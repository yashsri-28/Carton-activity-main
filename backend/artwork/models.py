from django.db import models
from django.conf import settings
from django.db import transaction
from django.utils import timezone


# ============================================================
# FR002 — Unique Artwork ID generator
# Format: ART-<YEAR>-<00001>
# Uses a dedicated counter row + select_for_update to stay
# race-condition safe under concurrent requests (matches the
# transaction.atomic pattern already used in pp_sample/labdip).
# ============================================================

class ArtworkIDSequence(models.Model):
    year = models.PositiveIntegerField(unique=True)
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "artwork_id_sequence"

    @classmethod
    def next_id(cls):
        year = timezone.now().year
        with transaction.atomic():
            seq, _ = cls.objects.select_for_update().get_or_create(year=year)
            seq.last_number += 1
            seq.save(update_fields=["last_number"])
            return f"ART-{year}-{seq.last_number:05d}"


# ============================================================
# FR001, FR004, FR011, FR012, FR030 — Artwork Request
# The parent record for one packaging artwork's full lifecycle.
# ============================================================

class ArtworkRequest(models.Model):

    STATUS_CHOICES = (
        ("DRAFT", "Draft"),
        ("VENDOR_UPLOAD_PENDING", "Vendor Upload Pending"),
        ("VENDOR_UPLOADED", "Vendor Uploaded"),
        ("AI_VALIDATION_PENDING", "AI Validation Pending"),
        ("AI_VALIDATION_FAILED", "AI Validation Failed"),
        ("MARKETING_REVIEW", "Marketing Review"),
        ("PPC_REVIEW", "PPC Review"),
        ("TQM_REVIEW", "TQM Review"),
        ("CUSTOMER_REVIEW", "Customer Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("RELEASED", "Released"),
        ("ARCHIVED", "Archived"),
        ("OBSOLETE", "Obsolete"),
    )

    # --------------------------------------------------
    # Identity
    # --------------------------------------------------

    artwork_id = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        editable=False,
    )

    title = models.CharField(max_length=255)

    # --------------------------------------------------
    # FR012 — Search & Retrieval fields
    # --------------------------------------------------

    sku_code = models.CharField(max_length=100, db_index=True)
    brand_name = models.CharField(max_length=150, db_index=True, blank=True, null=True)
    customer_name = models.CharField(max_length=150, db_index=True, blank=True, null=True)

    # --------------------------------------------------
    # FR011 — Material & PO Linkage
    # (real-time SAP validation is Phase 4; for now these are
    # captured as reference fields so the workflow isn't blocked)
    # --------------------------------------------------

    material_code = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    po_number = models.CharField(max_length=100, blank=True, null=True, db_index=True)

    # --------------------------------------------------
    # Vendor (Phase 1: single primary vendor.
    # Phase 2 adds ArtworkVendorInvite for multi-vendor + FR017
    # vendor-restricted visibility.)
    # --------------------------------------------------

    assigned_vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artworks_assigned_as_vendor",
    )

    # --------------------------------------------------
    # Customer approval optionality (BR: "Customer, wherever applicable")
    # --------------------------------------------------

    customer_approval_required = models.BooleanField(default=False)

    # --------------------------------------------------
    # Workflow
    # --------------------------------------------------

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="DRAFT",
        db_index=True,
    )

    remarks = models.TextField(blank=True, null=True)

    # --------------------------------------------------
    # Standard audit fields (matches pp_sample/labdip convention)
    # --------------------------------------------------

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="artwork_created",
    )
    created_on = models.DateTimeField(auto_now_add=True)

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="artwork_updated",
    )
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "artwork_request"
        ordering = ["-created_on"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["sku_code"]),
            models.Index(fields=["material_code"]),
            models.Index(fields=["po_number"]),
        ]

    def save(self, *args, **kwargs):
        if not self.artwork_id:
            self.artwork_id = ArtworkIDSequence.next_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.artwork_id} - {self.title}"


# ============================================================
# FR003, FR004, FR009 — Artwork Version
# Business rule: every revision creates a NEW version; approved
# versions are immutable/undeletable; only latest approved is
# active. We enforce immutability at the application layer
# (views) — approved versions are never edited, only superseded.
# ============================================================

def artwork_upload_path(instance, filename):
    return f"artwork_files/{instance.artwork.artwork_id}/v{instance.version_number}/{filename}"


class ArtworkVersion(models.Model):

    artwork = models.ForeignKey(
        ArtworkRequest,
        on_delete=models.CASCADE,
        related_name="versions",
    )

    version_number = models.PositiveIntegerField()

    file = models.FileField(upload_to=artwork_upload_path)

    change_summary = models.TextField(blank=True, null=True)

    # FR004 — only one version per artwork can be "active" (latest approved)
    is_active_version = models.BooleanField(default=False)

    # Business rule — approved versions become immutable
    is_locked = models.BooleanField(default=False)

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="artwork_versions_uploaded",
    )
    uploaded_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "artwork_version"
        ordering = ["-version_number"]
        unique_together = ("artwork", "version_number")

    def __str__(self):
        return f"{self.artwork.artwork_id} v{self.version_number}"


# ============================================================
# FR005 — Approval Workflow Management (sequential)
# One row per stage per artwork; created upfront in DRAFT/PENDING
# and updated as each stage acts. Sequence enforces
# Marketing -> Packaging -> TQM -> Customer(optional).
# ============================================================

class ArtworkApproval(models.Model):

    STAGE_CHOICES = (
        ("MARKETING", "Marketing"),
        ("PPC", "PPC"),
        ("TQM", "TQM"),
        ("CUSTOMER", "Customer"),
    )

    DECISION_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    # Role permitted to act on each stage — single source of truth,
    # used by the view to authorize decisions.
    STAGE_ROLE_MAP = {
        "MARKETING": "MARKETING",
        "PPC": "PPC",   # Packaging Procurement team role in this system
        "TQM": "TTQM",
        "CUSTOMER": "ADMIN",       # customer has no direct login yet (Phase 2); logged on their behalf
    }

    artwork = models.ForeignKey(
        ArtworkRequest,
        on_delete=models.CASCADE,
        related_name="approvals",
    )

    version = models.ForeignKey(
        ArtworkVersion,
        on_delete=models.CASCADE,
        related_name="approvals",
    )

    stage = models.CharField(max_length=20, choices=STAGE_CHOICES)
    sequence = models.PositiveSmallIntegerField()

    decision = models.CharField(
        max_length=10,
        choices=DECISION_CHOICES,
        default="PENDING",
    )

    comments = models.TextField(blank=True, null=True)

    acted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artwork_approvals_acted",
    )
    acted_on = models.DateTimeField(null=True, blank=True)

    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "artwork_approval"
        ordering = ["sequence"]

    def __str__(self):
        return f"{self.artwork.artwork_id} - {self.stage} - {self.decision}"
    
    
# ============================================================
# FR006, FR028 — Vendor Collaboration: Comments & Query Management
# A simple threaded comment feed on each artwork — vendor can ask
# a question, internal team can reply, or internal team can leave
# feedback for the vendor. Same table serves both "comments" and
# "query management" from the BRD — kept as one feed to avoid a
# separate, more complex ticketing system.
# ============================================================

class ArtworkComment(models.Model):

    artwork = models.ForeignKey(
        ArtworkRequest,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="artwork_comments_authored",
    )

    message = models.TextField()

    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "artwork_comment"
        ordering = ["created_on"]

    def __str__(self):
        return f"{self.artwork.artwork_id} - comment by {self.author}"    