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
        ("VENDOR_UPLOAD_PENDING", "PROCUREMENT Upload Pending"),
        ("VENDOR_UPLOADED", "PROCUREMENT Uploaded"),
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
        # --- Custom category workflow statuses (RIBBON, BW_STICKER) ---
        ("PHYSICAL_SAMPLE_PENDING", "Physical Sample Pending"),
        ("SAMPLE_SENT", "Sample Sent - Awaiting Receipt"),
        ("SAMPLE_RECEIVED_REVIEW", "Sample Received - Review Pending"),
        ("SAMPLE_REJECTED", "Sample Rejected"),
        ("MATCODE_PENDING", "Reference Code Generation Pending"),
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
    
    
    
    # Same pattern as assigned_vendor (Procurement) — Legal and
    # Compliance are separately assignable per artwork, each seeing
    # only the artworks assigned to them.
    assigned_legal = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artworks_assigned_as_legal",
    )
    assigned_compliance = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artworks_assigned_as_compliance",
    )
    
    assigned_lab = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="artworks_assigned_as_lab",
    )

    # --------------------------------------------------
    # Customer approval optionality (BR: "Customer, wherever applicable")
    # --------------------------------------------------

    customer_approval_required = models.BooleanField(default=False)
    
    
      # Extra optional approval stages — Marketing picks these AT
    # REQUEST-CREATION TIME to decide which approvals this specific
    # request needs, on top of the standard Marketing -> PPC -> TQM
    # chain. Same pattern as customer_approval_required above.
    legal_approval_required = models.BooleanField(default=False)
    compliance_approval_required = models.BooleanField(default=False)
    lab_approval_required = models.BooleanField(default=False)
    
    # Which workflow this artwork follows — decided once at creation
    # time based on its category. "STANDARD" = the original
    # Marketing -> PPC -> TQM chain used by most categories.
    workflow_key = models.CharField(max_length=50, default="STANDARD", db_index=True)

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

    # STAGE_CHOICES = (
    #     ("MARKETING", "Marketing"),
    #     ("PPC", "PPC"),
    #     ("TQM", "TQM"),
    #     ("CUSTOMER", "Customer"),
    # )
    
    STAGE_CHOICES = (
        ("MARKETING", "Marketing"),
        ("PPC", "PPC"),
        ("TQM", "TQM"),
        ("LEGAL", "Legal"),
        ("COMPLIANCE", "Compliance"),
        ("LAB", "Lab"),
        ("CUSTOMER", "Customer"),
    )

    DECISION_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    # Role permitted to act on each stage — single source of truth,
    # used by the view to authorize decisions.
    # STAGE_ROLE_MAP = {
    #     "MARKETING": "MARKETING",
    #     "PPC": "PPC",   # Packaging Procurement team role in this system
    #     "TQM": "TTQM",
    #     "CUSTOMER": "ADMIN",       # customer has no direct login yet (Phase 2); logged on their behalf
    # }
    
    STAGE_ROLE_MAP = {
        "MARKETING": "MARKETING",
        "PPC": "PPC",   # Packaging Procurement team role in this system
        "TQM": "TTQM",
        "LEGAL": "LEGAL",
        "COMPLIANCE": "COMPLIANCE",
        "LAB": "LAB",
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
        # Which version this comment/attachment is about — so when there
    # are multiple versions (v1 rejected, v2 re-uploaded), it's always
    # clear which design the remark refers to. Nullable for backward
    # compatibility with any comments made before this field existed.
    version = models.ForeignKey(
        "ArtworkVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="comments",
    )

    message = models.TextField(blank=True, default="")

        # Optional reference attachment (customer requirement doc, revised
        # spec, physical proof photo, etc.) — any role can attach one along
        # with their remark.
    attachment = models.FileField(upload_to="artwork_attachments/%Y/%m/", null=True, blank=True)
    
    # Marks the ONE remark/attachment added at request-creation time
    # (via the Packaging Spec form) — so it always shows inside the
    # Packaging Specification box, never in the general Comments feed.
    is_initial_remark = models.BooleanField(default=False)

    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
            db_table = "artwork_comment"
            ordering = ["created_on"]

    def __str__(self):
        return f"{self.artwork.artwork_id} - comment by {self.author}"   
    
    
    
    # ============================================================
# FR008, FR022 — Packaging Specification Management
# Captures the full TRIMS_SPECIFICATION.xlsx form data per
# category (PVC Bag, Ribbon, Label, Box, etc). Every category has
# a different set of fields, so answers are stored as JSON keyed
# by the exact excel field label — nothing is hardcoded per
# category, so it always matches the source excel exactly.
# ============================================================

class PackagingSpecification(models.Model):

    CATEGORY_CHOICES = (
        ("PVC_BAG", "PVC Bag Specification"),
        ("RIBBON", "Ribbon"),
        ("BW_STICKER", "B&W Sticker"),
        ("LABEL", "Label"),
        ("PAPER_PRINTED_ITEM", "Paper Printed Item"),
        ("BOX", "Box"),
        ("OTHER", "Other"),
        ("PDQ", "PDQ"),
    )

    artwork = models.OneToOneField(
        ArtworkRequest,
        on_delete=models.CASCADE,
        related_name="packaging_spec",
    )

    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)

    # Every filled field from the excel form, keyed exactly by its
    # label text (e.g. {"BUYER NAME": "Costco", "QUALITY OF THE PVC": "LHM"})
    spec_data = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="packaging_specs_created",
    )
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "artwork_packaging_specification"

    def __str__(self):
        return f"{self.artwork.artwork_id} - {self.category}" 
    
    

# ============================================================
# Notification Bell — whenever an artwork moves to a stage that
# needs someone's action (created & assigned, uploaded, approved
# to next stage, rejected), a notification row is created for the
# relevant person(s). Read by the bell icon in the top bar.
# ============================================================

class ArtworkNotification(models.Model):

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="artwork_notifications",
    )

    artwork = models.ForeignKey(
        ArtworkRequest,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    message = models.CharField(max_length=255)

    is_read = models.BooleanField(default=False)

    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "artwork_notification"
        ordering = ["-created_on"]

    def __str__(self):
        return f"To {self.recipient} — {self.message}"
    
    
    
    # ============================================================
# Custom-workflow tracking (RIBBON and any future category with
# its own lifecycle). The STANDARD flow keeps using ArtworkApproval
# exactly as before — this model is ONLY used when
# ArtworkRequest.workflow_key != "STANDARD".
# ============================================================

class WorkflowStep(models.Model):

    STEP_STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("DONE", "Done"),
        ("REJECTED", "Rejected"),
    )

    artwork = models.ForeignKey(
        ArtworkRequest,
        on_delete=models.CASCADE,
        related_name="workflow_steps",
    )

    # Which version this step belongs to — old versions' rejection
    # history is NEVER deleted (same rule as the STANDARD flow's
    # ArtworkApproval), so a full reject/re-upload trail always stays
    # traceable, per version.
    version = models.ForeignKey(
        "ArtworkVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workflow_steps_for_version",
    )

    workflow_key = models.CharField(max_length=50)
    step_code = models.CharField(max_length=50)
    step_type = models.CharField(max_length=30)   # APPROVAL / PHYSICAL_SAMPLE / SAMPLE_APPROVAL / MATCODE
    step_label = models.CharField(max_length=100)
    actor_role = models.CharField(max_length=30)
    sequence = models.PositiveSmallIntegerField()

    status = models.CharField(max_length=10, choices=STEP_STATUS_CHOICES, default="PENDING")
    comments = models.TextField(blank=True, default="")

    acted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workflow_steps_acted",
    )
    acted_on = models.DateTimeField(null=True, blank=True)

    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "artwork_workflow_step"
        ordering = ["sequence"]

    def __str__(self):
        return f"{self.artwork.artwork_id} - {self.step_code} - {self.status}"


# ============================================================
# Physical Sample stage data (Procurement sends -> Marketing
# receives -> Marketing approves/rejects). Only used by categories
# whose workflow includes a PHYSICAL_SAMPLE-type step.
# ============================================================

class PhysicalSample(models.Model):

    DECISION_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    REJECT_LEVEL_CHOICES = (
        ("SAMPLE", "Sample Level"),
        ("ARTWORK", "Artwork Level"),
    )

    artwork = models.ForeignKey(
        ArtworkRequest,
        on_delete=models.CASCADE,
        related_name="physical_samples",
    )

    # Which artwork version this sample was sent for — same
    # history-preservation rule as everywhere else.
    version = models.ForeignKey(
        "ArtworkVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="physical_samples_for_version",
    )

    # --- Sent by Procurement ---
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="physical_samples_sent",
    )
    attachment = models.FileField(upload_to="physical_samples/%Y/%m/", null=True, blank=True)
    date_sent = models.DateField(null=True, blank=True)
    est_arrival_date = models.DateField(null=True, blank=True)
    comments = models.TextField(blank=True, default="")
    sent_on = models.DateTimeField(auto_now_add=True)

    # --- Received by Marketing (physical arrival confirmation) ---
    is_received = models.BooleanField(default=False)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="physical_samples_received",
    )
    received_on = models.DateTimeField(null=True, blank=True)

    # --- Marketing's decision on the received sample ---
       # --- Marketing's decision on the received sample ---
    decision = models.CharField(max_length=10, choices=DECISION_CHOICES, default="PENDING")
    # Permanently records WHICH TYPE of rejection this was — so
    # history always shows "was this a sample-only reject, or a
    # full-artwork reject" even long after the fact.
    reject_level = models.CharField(max_length=10, choices=REJECT_LEVEL_CHOICES, null=True, blank=True)
    decision_comments = models.TextField(blank=True, default="")
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="physical_samples_decided",
    )
    decided_on = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "artwork_physical_sample"
        ordering = ["-sent_on"]

    def __str__(self):
        return f"{self.artwork.artwork_id} - Sample sent {self.sent_on}"
    
    
class MatcodeSequence(models.Model):
    year = models.PositiveIntegerField(unique=True)
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "artwork_matcode_sequence"

    @classmethod
    def next_code(cls):
        year = timezone.now().year
        with transaction.atomic():
            seq, _ = cls.objects.select_for_update().get_or_create(year=year)
            seq.last_number += 1
            seq.save(update_fields=["last_number"])
            return f"MAT-{year}-{seq.last_number:05d}"    
