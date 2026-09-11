from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status

from drf_yasg.utils import swagger_auto_schema

from .models import (
    ArtworkRequest, ArtworkVersion, ArtworkApproval, ArtworkComment,
    PackagingSpecification, ArtworkNotification, WorkflowStep,
    PhysicalSample, MatcodeSequence,
)
# from .workflow_config import get_workflow_key, get_workflow_steps
from .workflow_config import get_workflow_key, get_workflow_steps, get_workflow_steps_for_artwork
from activity_logs.models import ActivityLog


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

APPROVAL_STAGE_ORDER = ["MARKETING", "PPC", "TQM", "CUSTOMER"]

MAX_UPLOAD_SIZE_MB = 25
ALLOWED_EXTENSIONS = [".pdf", ".ai", ".eps", ".psd", ".png", ".jpg", ".jpeg", ".tiff"]


def _log_activity(request, artwork, action, message, old_value=None, new_value=None):
    ActivityLog.objects.create(
        module_name="Artwork Management",
        record_id=str(artwork.pk),
        action=action,
        message=message,
        old_value=old_value,
        new_value=new_value,
        performed_by=request.user,
        performed_by_name=getattr(request.user, "get_full_name", lambda: "")() or request.user.username,
        performed_by_role=getattr(request.user, "role", ""),
    )


def _notify(user, artwork, message):
    """Create one notification for a specific user."""
    if not user:
        return
    ArtworkNotification.objects.create(recipient=user, artwork=artwork, message=message)


def _notify_role(role, artwork, message, exclude_user=None):
    """Create a notification for every user with the given role (used
    when the next reviewer isn't one specific assigned person, e.g.
    PPC/TQM stages — any user with that role should be alerted)."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.filter(role=role)
    if exclude_user:
        users = users.exclude(id=exclude_user.id)
    for u in users:
        ArtworkNotification.objects.create(recipient=u, artwork=artwork, message=message)


def _validate_upload_file(f):
    if f.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        return f"File exceeds {MAX_UPLOAD_SIZE_MB}MB limit."
    ext = "." + f.name.rsplit(".", 1)[-1].lower() if "." in f.name else ""
    if ext not in ALLOWED_EXTENSIONS:
        return f"File type '{ext}' not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    return None


def _artwork_to_dict(artwork, request=None, include_versions=True, include_approvals=True):
    data = {
        "id": artwork.id,
        "artwork_id": artwork.artwork_id,
        "title": artwork.title,
        "sku_code": artwork.sku_code,
        "brand_name": artwork.brand_name,
        "customer_name": artwork.customer_name,
        "material_code": artwork.material_code,
        "po_number": artwork.po_number,
        "assigned_vendor": artwork.assigned_vendor.username if artwork.assigned_vendor else None,
        "assigned_legal": artwork.assigned_legal.username if artwork.assigned_legal else None,
        "assigned_compliance": artwork.assigned_compliance.username if artwork.assigned_compliance else None,
        "assigned_lab": artwork.assigned_lab.username if artwork.assigned_lab else None,
        "customer_approval_required": artwork.customer_approval_required,
        "legal_approval_required": artwork.legal_approval_required,
        "compliance_approval_required": artwork.compliance_approval_required,
        "lab_approval_required": artwork.lab_approval_required,
        "status": artwork.status,
        "remarks": artwork.remarks,
        "workflow_key": artwork.workflow_key,
        "pending_roles": sorted(_compute_pending_roles(artwork)),
        "created_by": artwork.created_by.username if artwork.created_by else None,
        "created_on": artwork.created_on,
        "updated_on": artwork.updated_on,
    }

    if include_versions:
        data["versions"] = [
            {
                "id": v.id,
                "version_number": v.version_number,
                "file_url": v.file.url if v.file else None,
                "change_summary": v.change_summary,
                "is_active_version": v.is_active_version,
                "is_locked": v.is_locked,
                "uploaded_by": v.uploaded_by.username if v.uploaded_by else None,
                "uploaded_on": v.uploaded_on,
            }
            for v in artwork.versions.all()
        ]

    if include_approvals:
        current_version = artwork.versions.filter(is_active_version=True).first()

        # ---- STANDARD flow data (unchanged) ----
        data["approvals"] = [
            {
                "stage": a.stage,
                "sequence": a.sequence,
                "decision": a.decision,
                "comments": a.comments,
                "version_number": a.version.version_number,
                "acted_by": a.acted_by.username if a.acted_by else None,
                "acted_on": a.acted_on,
            }
            for a in artwork.approvals.filter(version=current_version).select_related("acted_by").order_by("sequence")
        ] if current_version else []

        data["approval_history"] = [
            {
                "version_number": a.version.version_number,
                "stage": a.stage,
                "decision": a.decision,
                "comments": a.comments,
                "acted_by": a.acted_by.username if a.acted_by else None,
                "acted_on": a.acted_on,
            }
            for a in artwork.approvals.select_related("acted_by", "version").order_by("version__version_number", "sequence")
        ]

        # ---- Custom-workflow data (RIBBON, BW_STICKER, future categories) ----
        if artwork.workflow_key != "STANDARD":
            
            
            # data["workflow_steps"] = [
            #     {
            #         "step_code": s.step_code,
            #         "step_type": s.step_type,
            #         "step_label": s.step_label,
            #         "actor_role": s.actor_role,
            #         "sequence": s.sequence,
            #         "status": s.status,
            #         "comments": s.comments,
            #         "acted_by": s.acted_by.username if s.acted_by else None,
            #         "acted_on": s.acted_on,
            #     }
            #     for s in artwork.workflow_steps.filter(version=current_version).order_by("sequence")
            # ] if current_version else []
            
            data["workflow_steps"] = [
                {
                    "step_code": s.step_code,
                    "step_type": s.step_type,
                    "step_label": s.step_label,
                    "actor_role": s.actor_role,
                    "sequence": s.sequence,
                    "status": s.status,
                    "comments": s.comments,
                    "acted_by": s.acted_by.username if s.acted_by else None,
                    "acted_on": s.acted_on,
                    "received_by": s.received_by.username if s.received_by else None,
                    "received_on": s.received_on,
                }
                for s in artwork.workflow_steps.filter(version=current_version).order_by("sequence")
        ] if current_version else []

            data["workflow_step_history"] = [
                {
                    "version_number": s.version.version_number if s.version else None,
                    "step_code": s.step_code,
                    "step_type": s.step_type,
                    "step_label": s.step_label,
                    "status": s.status,
                    "comments": s.comments,
                    "acted_by": s.acted_by.username if s.acted_by else None,
                    "acted_on": s.acted_on,
                }
                for s in artwork.workflow_steps.select_related("acted_by", "version").order_by("version__version_number", "sequence")
            ]

            latest_sample = artwork.physical_samples.order_by("-sent_on").first()
            if latest_sample:
                data["latest_physical_sample"] = {
                    "id": latest_sample.id,
                    "sent_by": latest_sample.sent_by.username if latest_sample.sent_by else None,
                    "attachment_url": (request.build_absolute_uri(latest_sample.attachment.url) if latest_sample.attachment and request else None),
                    "date_sent": latest_sample.date_sent,
                    "est_arrival_date": latest_sample.est_arrival_date,
                    "comments": latest_sample.comments,
                    "sent_on": latest_sample.sent_on,
                    "is_received": latest_sample.is_received,
                    "received_by": latest_sample.received_by.username if latest_sample.received_by else None,
                    "received_on": latest_sample.received_on,
                    "decision": latest_sample.decision,
                    "reject_level": latest_sample.reject_level,
                    "decision_comments": latest_sample.decision_comments,
                }
            else:
                data["latest_physical_sample"] = None

            data["physical_sample_history"] = [
                {
                    "id": s.id,
                    "version_number": s.version.version_number if s.version else None,
                    "sent_by": s.sent_by.username if s.sent_by else None,
                    "date_sent": s.date_sent,
                    "est_arrival_date": s.est_arrival_date,
                    "comments": s.comments,
                    "sent_on": s.sent_on,
                    "is_received": s.is_received,
                    "decision": s.decision,
                    "reject_level": s.reject_level,
                    "decision_comments": s.decision_comments,
                    "decided_by": s.decided_by.username if s.decided_by else None,
                    "decided_on": s.decided_on,
                }
                for s in artwork.physical_samples.select_related("sent_by", "decided_by", "version").order_by("version__version_number", "sent_on")
            ]

    return data


# ------------------------------------------------------------------
# FR001, FR002 — Create Artwork Request (Marketing raises request)
# ------------------------------------------------------------------

@swagger_auto_schema(method="post", operation_summary="Create Artwork Request")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_artwork_request(request):
    data = request.data

    required = ["title", "sku_code"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return Response(
            {"error": f"Missing required fields: {', '.join(missing)}"},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    artwork = ArtworkRequest.objects.create(
        title=data.get("title"),
        sku_code=data.get("sku_code"),
        brand_name=data.get("brand_name"),
        customer_name=data.get("customer_name"),
        material_code=data.get("material_code"),
        po_number=data.get("po_number"),
        assigned_vendor_id=data.get("assigned_vendor_id") or None,
        customer_approval_required=bool(data.get("customer_approval_required", False)),
        remarks=data.get("remarks"),
        status="VENDOR_UPLOAD_PENDING" if data.get("assigned_vendor_id") else "DRAFT",
        workflow_key="STANDARD",
        created_by=request.user,
        updated_by=request.user,
    )

    _log_activity(
        request, artwork, "Created",
        f"Artwork request {artwork.artwork_id} created.",
        new_value=artwork.status,
    )

    if artwork.assigned_vendor:
        _notify(artwork.assigned_vendor, artwork, f"New artwork request {artwork.artwork_id} assigned to you.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_201_CREATED)


# ------------------------------------------------------------------
# FR003, FR004 — Upload / revise an artwork file (procurement or internal)
# Every call creates a NEW version. Approved versions are never
# touched — this is how immutability (Business Rule) is enforced.
# Old versions' approval/step history is NEVER deleted, so a full
# reject -> re-upload -> re-approve trail stays traceable.
# ------------------------------------------------------------------

@swagger_auto_schema(method="post", operation_summary="Upload Artwork Version")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def upload_artwork_version(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if artwork.assigned_vendor_id and request.user.role == "PROCUREMENT" and request.user.id != artwork.assigned_vendor_id:
        return Response({"error": "You are not assigned to this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    if artwork.status in ["APPROVED", "RELEASED", "ARCHIVED", "OBSOLETE"]:
        return Response(
            {"error": f"Artwork is '{artwork.status}' and locked. Raise a revision request instead."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"error": "No file provided."}, status=http_status.HTTP_400_BAD_REQUEST)

    error = _validate_upload_file(file_obj)
    if error:
        return Response({"error": error}, status=http_status.HTTP_400_BAD_REQUEST)

    next_version_number = (artwork.versions.first().version_number + 1) if artwork.versions.exists() else 1

    artwork.versions.filter(is_active_version=True).update(is_active_version=False)

    version = ArtworkVersion.objects.create(
        artwork=artwork,
        version_number=next_version_number,
        file=file_obj,
        change_summary=request.data.get("change_summary"),
        is_active_version=True,
        uploaded_by=request.user,
    )

    # if artwork.workflow_key == "STANDARD":
    #     # Existing behavior — completely untouched.
    #     stages = ["MARKETING", "PPC", "TQM"]
    #     if artwork.customer_approval_required:
    #         stages.append("CUSTOMER")
    #     for i, stage in enumerate(stages, start=1):
    #         ArtworkApproval.objects.create(artwork=artwork, version=version, stage=stage, sequence=i)
    #     artwork.status = "MARKETING_REVIEW"
    
    # if artwork.workflow_key == "STANDARD":
    #     # Base chain, plus whichever OPTIONAL stages were selected at
    #     # request-creation time (legal_approval_required etc.) — chosen
    #     # per-request by Marketing, not fixed per category.
    #     stages = ["MARKETING", "PPC", "TQM"]
    #     if artwork.legal_approval_required:
    #         stages.append("LEGAL")
    #     if artwork.compliance_approval_required:
    #         stages.append("COMPLIANCE")
    #     if artwork.lab_approval_required:
    #         stages.append("LAB")
    #     if artwork.customer_approval_required:
    #         stages.append("CUSTOMER")
    #     for i, stage in enumerate(stages, start=1):
    #         ArtworkApproval.objects.create(artwork=artwork, version=version, stage=stage, sequence=i)
    #     artwork.status = "MARKETING_REVIEW"
    
    if artwork.workflow_key == "STANDARD":
            stages = ["MARKETING", "PPC", "TQM"]
            if artwork.legal_approval_required:
                stages.append("LEGAL")
            if artwork.compliance_approval_required:
                stages.append("COMPLIANCE")
            if artwork.lab_approval_required:
                stages.append("LAB")
            if artwork.customer_approval_required:
                stages.append("CUSTOMER")
            for i, stage in enumerate(stages, start=1):
                ArtworkApproval.objects.create(artwork=artwork, version=version, stage=stage, sequence=i)
            artwork.status = "MARKETING_REVIEW"

            # NEW — sabhi ticked stages ke roles ko turant batao ki naya
            # version upload ho gaya hai, taki sabko pata ho unki approval
            # is chain mein pending hai (sirf jiski turn hai usko nahi,
            # balki poori chain ke sabhi roles ko).
            for stage in stages:
                stage_role = ArtworkApproval.STAGE_ROLE_MAP.get(stage)
                if stage_role:
                    _notify_role(
                        stage_role, artwork,
                        f"{artwork.artwork_id} has a new version uploaded — you're in the {stage} approval chain for this request.",
                        exclude_user=request.user,
                    )
    # else:
    #     # Custom category workflow — build a FRESH WorkflowStep chain
    #     # for this new version. Old versions' steps are NEVER deleted,
    #     # so a full reject/re-upload history stays traceable forever.
    #     step_defs = get_workflow_steps(artwork.workflow_key)
    #     for i, step_def in enumerate(step_defs, start=1):
    #         WorkflowStep.objects.create(
    #             artwork=artwork,
    #             version=version,
    #             workflow_key=artwork.workflow_key,
    #             step_code=step_def["code"],
    #             step_type=step_def["type"],
    #             step_label=step_def["label"],
    #             actor_role=step_def["role"],
    #             sequence=i,
    #         )
    #     artwork.status = "MARKETING_REVIEW"
    
    # else:
    #     # Custom category workflow — build a FRESH WorkflowStep chain
    #     # for this new version. Old versions' steps are NEVER deleted,
    #     # so a full reject/re-upload history stays traceable forever.
    #     # Steps come from a per-artwork builder (not a fixed config
    #     # list) because RIBBON's gates depend on which stakeholders
    #     # were ticked at request-creation time.
    #     step_defs = get_workflow_steps_for_artwork(artwork)
    #     for step_def in step_defs:
    #         WorkflowStep.objects.create(
    #             artwork=artwork,
    #             version=version,
    #             workflow_key=artwork.workflow_key,
    #             step_code=step_def["code"],
    #             step_type=step_def["type"],
    #             step_label=step_def["label"],
    #             actor_role=step_def["role"],
    #             sequence=step_def["sequence"],
    #         )
    #     artwork.status = "MARKETING_REVIEW"
    
    else:
        step_defs = get_workflow_steps_for_artwork(artwork)
        for step_def in step_defs:
            WorkflowStep.objects.create(
                artwork=artwork,
                version=version,
                workflow_key=artwork.workflow_key,
                step_code=step_def["code"],
                step_type=step_def["type"],
                step_label=step_def["label"],
                actor_role=step_def["role"],
                sequence=step_def["sequence"],
            )
        artwork.status = "MARKETING_REVIEW"

        # NEW — Gate 1 ke sabhi roles (Marketing + jo bhi ticked the) ko
        # turant batao, kyunki custom flow mein ye sab EK saath parallel
        # gate mein hote hain — sabki approval ek sath chahiye hoti hai.
        gate_1_roles = {s["role"] for s in step_defs if s["sequence"] == 1}
        for role in gate_1_roles:
            _notify_role(
                role, artwork,
                f"{artwork.artwork_id} has a new version uploaded and is ready for your review.",
                exclude_user=request.user,
            )

    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(
        request, artwork, "Version Uploaded",
        f"Version {version.version_number} uploaded for {artwork.artwork_id}.",
        new_value=f"v{version.version_number}",
    )

    if artwork.created_by:
        _notify(artwork.created_by, artwork, f"{artwork.artwork_id} has a new version ready for your review.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_201_CREATED)


# ------------------------------------------------------------------
# FR005 — Approve / Reject the current pending stage (STANDARD flow)
# Sequential: a stage can only act once all prior stages are APPROVED.
# ------------------------------------------------------------------

@swagger_auto_schema(method="post", operation_summary="Approve or Reject Artwork Stage")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def act_on_artwork_approval(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    # ACTIVE_REVIEW_STATUSES = ["MARKETING_REVIEW", "PPC_REVIEW", "TQM_REVIEW", "CUSTOMER_REVIEW"]
    ACTIVE_REVIEW_STATUSES = ["MARKETING_REVIEW", "PPC_REVIEW", "TQM_REVIEW", "LEGAL_REVIEW", "COMPLIANCE_REVIEW", "LAB_REVIEW", "CUSTOMER_REVIEW"]
    if artwork.status not in ACTIVE_REVIEW_STATUSES:
        return Response(
            {"error": f"Artwork is '{artwork.status}' — no approval action can be taken right now."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    decision = request.data.get("decision")
    comments = request.data.get("comments", "")

    if decision not in ["APPROVED", "REJECTED"]:
        return Response({"error": "decision must be APPROVED or REJECTED."}, status=http_status.HTTP_400_BAD_REQUEST)

    current_version = artwork.versions.filter(is_active_version=True).first()
    pending = artwork.approvals.filter(decision="PENDING", version=current_version).order_by("sequence").first()
    if not pending:
        return Response({"error": "No pending approval stage for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    required_role = ArtworkApproval.STAGE_ROLE_MAP.get(pending.stage)
    if request.user.role != required_role and not request.user.is_superuser:
        return Response(
            {"error": f"Only role '{required_role}' can act on the '{pending.stage}' stage."},
            status=http_status.HTTP_403_FORBIDDEN,
        )

    pending.decision = decision
    pending.comments = comments
    pending.acted_by = request.user
    pending.acted_on = timezone.now()
    pending.save()

    if decision == "REJECTED":
        artwork.status = "REJECTED"
        if artwork.assigned_vendor:
            _notify(
                artwork.assigned_vendor, artwork,
                f"{artwork.artwork_id} was rejected at {pending.stage} stage. Please revise and re-upload."
                + (f" Reason: {comments}" if comments else ""),
            )
    else:
        next_pending = artwork.approvals.filter(decision="PENDING", version=current_version).order_by("sequence").first()
        if next_pending:
            artwork.status = f"{next_pending.stage}_REVIEW" if next_pending.stage != "CUSTOMER" else "CUSTOMER_REVIEW"
            next_role = ArtworkApproval.STAGE_ROLE_MAP.get(next_pending.stage)
            if next_role:
                _notify_role(next_role, artwork, f"{artwork.artwork_id} is ready for your {next_pending.stage} review.", exclude_user=request.user)
        else:
            artwork.status = "APPROVED"
            active_version = artwork.versions.filter(is_active_version=True).first()
            if active_version:
                active_version.is_locked = True
                active_version.save(update_fields=["is_locked"])
            if artwork.assigned_vendor:
                _notify(artwork.assigned_vendor, artwork, f"{artwork.artwork_id} has been fully approved.")
            if artwork.created_by:
                _notify(artwork.created_by, artwork, f"{artwork.artwork_id} has been fully approved.")
            _notify_role("PPC", artwork, f"{artwork.artwork_id} is fully approved and ready for release.", exclude_user=request.user)

    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(
        request, artwork, f"Stage {decision.title()}",
        f"{pending.stage} stage {decision.lower()} by {request.user.username}."
        + (f" Reason: {comments}" if comments else ""),
        old_value="PENDING",
        new_value=decision,
    )

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# Custom-workflow step actions — generic, works for ANY category
# whose workflow_key != "STANDARD" (currently BW_STICKER, RIBBON).
# ------------------------------------------------------------------

# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# @transaction.atomic
# def act_on_workflow_step(request, artwork_id):
#     artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

#     if artwork.workflow_key == "STANDARD":
#         return Response({"error": "This artwork uses the standard approval flow — use act-approval/ instead."}, status=http_status.HTTP_400_BAD_REQUEST)

#     if artwork.status != "MARKETING_REVIEW":
#         return Response(
#             {"error": f"Artwork is '{artwork.status}' — no approval action can be taken right now."},
#             status=http_status.HTTP_400_BAD_REQUEST,
#         )

#     decision = request.data.get("decision")
#     comments = request.data.get("comments", "")

#     if decision not in ["APPROVED", "REJECTED"]:
#         return Response({"error": "decision must be APPROVED or REJECTED."}, status=http_status.HTTP_400_BAD_REQUEST)

#     current_version = artwork.versions.filter(is_active_version=True).first()
#     pending = artwork.workflow_steps.filter(status="PENDING", step_type="APPROVAL", version=current_version).order_by("sequence").first()
#     if not pending:
#         return Response({"error": "No pending approval step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

#     if request.user.role != pending.actor_role and not request.user.is_superuser:
#         return Response(
#             {"error": f"Only role '{pending.actor_role}' can act on this step."},
#             status=http_status.HTTP_403_FORBIDDEN,
#         )

#     pending.status = "DONE" if decision == "APPROVED" else "REJECTED"
#     pending.comments = comments
#     pending.acted_by = request.user
#     pending.acted_on = timezone.now()
#     pending.save()

#     if decision == "REJECTED":
#         artwork.status = "REJECTED"
#         if artwork.assigned_vendor:
#             _notify(
#                 artwork.assigned_vendor, artwork,
#                 f"Return Artwork — {artwork.artwork_id} was rejected. Please revise and re-upload a new artwork version."
#                 + (f" Reason: {comments}" if comments else ""),
#             )
#     else:
#         next_step = artwork.workflow_steps.filter(status="PENDING", version=current_version).order_by("sequence").first()
#         if next_step:
#             if next_step.step_type == "MATCODE":
#                 artwork.status = "MATCODE_PENDING"
#             elif next_step.step_type == "PHYSICAL_SAMPLE":
#                 artwork.status = "PHYSICAL_SAMPLE_PENDING"
#             else:
#                 artwork.status = "MARKETING_REVIEW"
#             _notify_role(next_step.actor_role, artwork, f"{artwork.artwork_id} is ready for your '{next_step.step_label}' step.", exclude_user=request.user)
#         else:
#             artwork.status = "APPROVED"

#     artwork.updated_by = request.user
#     artwork.save(update_fields=["status", "updated_by", "updated_on"])

#     _log_activity(
#         request, artwork, f"Workflow Step {decision.title()}",
#         f"{pending.step_label} {decision.lower()} by {request.user.username}." + (f" Reason: {comments}" if comments else ""),
#     )

#     return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def act_on_workflow_step(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    if artwork.workflow_key == "STANDARD":
        return Response({"error": "This artwork uses the standard approval flow — use act-approval/ instead."}, status=http_status.HTTP_400_BAD_REQUEST)

    if artwork.status != "MARKETING_REVIEW":
        return Response(
            {"error": f"Artwork is '{artwork.status}' — no approval action can be taken right now."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    decision = request.data.get("decision")
    comments = request.data.get("comments", "")

    if decision not in ["APPROVED", "REJECTED"]:
        return Response({"error": "decision must be APPROVED or REJECTED."}, status=http_status.HTTP_400_BAD_REQUEST)

    current_version = artwork.versions.filter(is_active_version=True).first()

    # Each reviewer acts on THEIR OWN pending row — multiple roles
    # (e.g. Marketing AND Lab) can be pending in parallel at the same
    # "gate", so we look up the row matching THIS user's role, not
    # just the first pending row overall.
    pending = artwork.workflow_steps.filter(
        status="PENDING", step_type="APPROVAL", version=current_version, actor_role=request.user.role
    ).order_by("sequence").first()

    if not pending and not request.user.is_superuser:
        return Response({"error": "You have no pending approval step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    pending.status = "DONE" if decision == "APPROVED" else "REJECTED"
    pending.comments = comments
    pending.acted_by = request.user
    pending.acted_on = timezone.now()
    pending.save()

    if decision == "REJECTED":
        artwork.status = "REJECTED"
        if artwork.assigned_vendor:
            _notify(
                artwork.assigned_vendor, artwork,
                f"Return Artwork — {artwork.artwork_id} was rejected by {request.user.role}. Please revise and re-upload a new artwork version."
                + (f" Reason: {comments}" if comments else ""),
            )
    else:
        # Has EVERY OTHER reviewer at this same gate also finished?
        gate_sequence = pending.sequence
        still_pending_in_gate = artwork.workflow_steps.filter(
            version=current_version, sequence=gate_sequence, status="PENDING"
        ).exclude(id=pending.id).exists()

        if still_pending_in_gate:
            # Gate not fully cleared yet — status stays as-is, waiting
            # on the remaining approver(s) in this same gate.
            pass
        else:
            next_step = artwork.workflow_steps.filter(
                status="PENDING", version=current_version, sequence__gt=gate_sequence
            ).order_by("sequence").first()
            if next_step:
                if next_step.step_type == "MATCODE":
                    artwork.status = "MATCODE_PENDING"
                elif next_step.step_type == "PHYSICAL_SAMPLE":
                    artwork.status = "PHYSICAL_SAMPLE_PENDING"
                else:
                    artwork.status = "MARKETING_REVIEW"
                next_gate_roles = artwork.workflow_steps.filter(
                    version=current_version, sequence=next_step.sequence, status="PENDING"
                ).values_list("actor_role", flat=True).distinct()
                for role in next_gate_roles:
                    _notify_role(role, artwork, f"{artwork.artwork_id} is ready for your review.", exclude_user=request.user)
    #         else:
    #             artwork.status = "APPROVED"

    # artwork.updated_by = request.user
    # artwork.save(update_fields=["status", "updated_by", "updated_on"])

    # _log_activity(
    #     request, artwork, f"Workflow Step {decision.title()}",
    #     f"{pending.step_label} {decision.lower()} by {request.user.username}." + (f" Reason: {comments}" if comments else ""),
    # )

    # return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)
    
            else:
                artwork.status = "APPROVED"
                if artwork.assigned_vendor:
                    _notify(artwork.assigned_vendor, artwork, f"{artwork.artwork_id} has been fully approved.")
                _notify_role("PPC", artwork, f"{artwork.artwork_id} is fully approved and ready for release.", exclude_user=request.user)

    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(
        request, artwork, f"Workflow Step {decision.title()}",
        f"{pending.step_label} {decision.lower()} by {request.user.username}." + (f" Reason: {comments}" if comments else ""),
    )

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def generate_matcode(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    if artwork.workflow_key == "STANDARD":
        return Response({"error": "This artwork does not use matcode-generation workflow."}, status=http_status.HTTP_400_BAD_REQUEST)

    if artwork.status != "MATCODE_PENDING":
        return Response(
            {"error": f"Artwork is '{artwork.status}' — reference code cannot be generated until all prior approvals are complete."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    current_version = artwork.versions.filter(is_active_version=True).first()
    pending = artwork.workflow_steps.filter(status="PENDING", step_type="MATCODE", version=current_version).order_by("sequence").first()
    if not pending:
        return Response({"error": "No pending matcode-generation step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    if request.user.role != pending.actor_role and not request.user.is_superuser:
        return Response(
            {"error": f"Only role '{pending.actor_role}' can generate the reference code."},
            status=http_status.HTTP_403_FORBIDDEN,
        )

    # Auto-generated — no manual typing, guaranteed unique (race-safe).
    # material_code = MatcodeSequence.next_code()
        # Auto-generated — no manual typing, guaranteed unique (race-safe).
    # Follows the client's structured format: PREFIX-YYMM-RUNNING-SUFFIX
    # (e.g. 737-2601-0001-LAB). Prefix/suffix depend on this artwork's
    # packaging category — and, only for PAPER_PRINTED_ITEM, on the
    # "TYPE OF PACKAGING" value, which decides Sticker/Belly Band vs
    # everything else.
    spec = getattr(artwork, "packaging_spec", None)
    category = spec.category if spec else None
    packaging_type = None
    if category == "PAPER_PRINTED_ITEM" and spec:
        packaging_type = (spec.spec_data or {}).get("TYPE OF PACKAGING")
    material_code = MatcodeSequence.next_code(category, packaging_type)

    pending.status = "DONE"
    pending.acted_by = request.user
    pending.acted_on = timezone.now()
    pending.save()

    artwork.material_code = material_code

    next_step = artwork.workflow_steps.filter(status="PENDING", version=current_version).order_by("sequence").first()
    if next_step:
        artwork.status = "MARKETING_REVIEW"
        _notify_role(next_step.actor_role, artwork, f"{artwork.artwork_id} is ready for your '{next_step.step_label}' step.", exclude_user=request.user)
    else:
        artwork.status = "APPROVED"
        active_version = artwork.versions.filter(is_active_version=True).first()
        if active_version:
            active_version.is_locked = True
            active_version.save(update_fields=["is_locked"])
        _notify_role("PPC", artwork, f"{artwork.artwork_id} has reference code {material_code} generated and is ready for release.", exclude_user=request.user)

    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "material_code", "updated_by", "updated_on"])

    _log_activity(request, artwork, "Reference Code Generated", f"{request.user.username} generated reference code '{material_code}' for {artwork.artwork_id}.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# RIBBON-style Physical Sample stage — Procurement sends -> Marketing
# receives -> Marketing approves/rejects. Generic: works for any
# category whose workflow includes a PHYSICAL_SAMPLE-type step.
# ------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def send_physical_sample(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    if artwork.status != "PHYSICAL_SAMPLE_PENDING":
        return Response(
            {"error": f"Artwork is '{artwork.status}' — cannot send a physical sample right now."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    current_version = artwork.versions.filter(is_active_version=True).first()
    pending = artwork.workflow_steps.filter(status="PENDING", step_type="PHYSICAL_SAMPLE", version=current_version).order_by("sequence").first()
    if not pending:
        return Response({"error": "No pending physical-sample step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    if request.user.role != pending.actor_role and not request.user.is_superuser:
        return Response({"error": f"Only role '{pending.actor_role}' can send a physical sample."}, status=http_status.HTTP_403_FORBIDDEN)

    sample = PhysicalSample.objects.create(
        artwork=artwork,
        version=current_version,
        sent_by=request.user,
        attachment=request.FILES.get("attachment"),
        date_sent=request.data.get("date_sent") or None,
        est_arrival_date=request.data.get("est_arrival_date") or None,
        comments=request.data.get("comments", ""),
    )

    pending.status = "DONE"
    pending.acted_by = request.user
    pending.acted_on = timezone.now()
    pending.save()

    # artwork.status = "SAMPLE_SENT"
    # artwork.updated_by = request.user
    # artwork.save(update_fields=["status", "updated_by", "updated_on"])

    # if artwork.created_by:
    #     _notify(artwork.created_by, artwork, f"Physical sample sent for {artwork.artwork_id}. Est. arrival: {sample.est_arrival_date or 'not specified'}.")


    artwork.status = "SAMPLE_SENT"
    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    # Notify EVERY role that will need to act on this sample once it's
    # received — not just the artwork's creator (Marketing).
    current_version = artwork.versions.filter(is_active_version=True).first()
    sample_gate_roles = artwork.workflow_steps.filter(
        version=current_version, step_type="SAMPLE_APPROVAL"
    ).values_list("actor_role", flat=True).distinct()
    for role_code in sample_gate_roles:
        _notify_role(role_code, artwork, f"Physical sample sent for {artwork.artwork_id}. Est. arrival: {sample.est_arrival_date or 'not specified'}.", exclude_user=request.user)
        
        
    _log_activity(request, artwork, "Physical Sample Sent", f"{request.user.username} sent a physical sample for {artwork.artwork_id}.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def receive_physical_sample(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    if artwork.status != "SAMPLE_SENT":
        return Response(
            {"error": f"Artwork is '{artwork.status}' — no sample is currently awaiting receipt."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    sample = artwork.physical_samples.filter(is_received=False).order_by("-sent_on").first()
    if not sample:
        return Response({"error": "No sample awaiting receipt for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    # if request.user.role not in ["MARKETING", "ADMIN"]:
    #     return Response({"error": "Only Marketing can mark a sample as received."}, status=http_status.HTTP_403_FORBIDDEN)
    if request.user.role not in ["MARKETING", "TTQM", "LAB", "LEGAL", "COMPLIANCE", "ADMIN"]:
        return Response({"error": "Only Marketing, TQM, Lab, Legal or Compliance can mark a sample as received."}, status=http_status.HTTP_403_FORBIDDEN)

    sample.is_received = True
    sample.received_by = request.user
    sample.received_on = timezone.now()
    sample.save()

    # artwork.status = "SAMPLE_RECEIVED_REVIEW"
    # artwork.updated_by = request.user
    # artwork.save(update_fields=["status", "updated_by", "updated_on"])

    # _log_activity(request, artwork, "Physical Sample Received", f"{request.user.username} confirmed receipt of the physical sample for {artwork.artwork_id}.")


    artwork.status = "SAMPLE_RECEIVED_REVIEW"
    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    # Notify every role in the Sample-Approval gate that the sample
    # has physically arrived and is now ready for their review.
    current_version = artwork.versions.filter(is_active_version=True).first()
    gate_roles = artwork.workflow_steps.filter(
        version=current_version, step_type="SAMPLE_APPROVAL", status="PENDING"
    ).values_list("actor_role", flat=True).distinct()
    for role_code in gate_roles:
        _notify_role(role_code, artwork, f"Physical sample for {artwork.artwork_id} has been received — ready for your review.", exclude_user=request.user)

    _log_activity(request, artwork, "Physical Sample Received", f"{request.user.username} confirmed receipt of the physical sample for {artwork.artwork_id}.")
    
    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# @transaction.atomic
# def decide_physical_sample(request, artwork_id):
#     artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

#     if artwork.status != "SAMPLE_RECEIVED_REVIEW":
#         return Response(
#             {"error": f"Artwork is '{artwork.status}' — no received sample is currently awaiting a decision."},
#             status=http_status.HTTP_400_BAD_REQUEST,
#         )

#     sample = artwork.physical_samples.filter(is_received=True, decision="PENDING").order_by("-sent_on").first()
#     if not sample:
#         return Response({"error": "No received sample awaiting a decision."}, status=http_status.HTTP_400_BAD_REQUEST)

#     step = artwork.workflow_steps.filter(status="PENDING", step_type="SAMPLE_APPROVAL").order_by("sequence").first()
#     if not step:
#         return Response({"error": "No pending sample-approval step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

#     if request.user.role != step.actor_role and not request.user.is_superuser:
#         return Response({"error": f"Only role '{step.actor_role}' can decide on this sample."}, status=http_status.HTTP_403_FORBIDDEN)

#     decision = request.data.get("decision")
#     comments = request.data.get("comments", "")
#     # Only relevant when decision == REJECTED:
#     #   "SAMPLE"  -> just this physical sample was wrong; Procurement
#     #                sends a NEW sample, artwork/version untouched.
#     #   "ARTWORK" -> the whole artwork/design is wrong; the artwork is
#     #                fully rejected and Procurement must upload a NEW
#     #                VERSION, restarting the workflow from scratch.
#     reject_level = request.data.get("reject_level", "SAMPLE")

#     if decision not in ["APPROVED", "REJECTED"]:
#         return Response({"error": "decision must be APPROVED or REJECTED."}, status=http_status.HTTP_400_BAD_REQUEST)

#     if decision == "REJECTED" and reject_level not in ["SAMPLE", "ARTWORK"]:
#         return Response({"error": "reject_level must be SAMPLE or ARTWORK."}, status=http_status.HTTP_400_BAD_REQUEST)

#     sample.decision = decision
#     sample.decision_comments = comments
#     sample.decided_by = request.user
#     sample.decided_on = timezone.now()
#     if decision == "REJECTED":
#         sample.reject_level = reject_level
#     sample.save()

#     current_version = artwork.versions.filter(is_active_version=True).first()

#     if decision == "REJECTED" and reject_level == "SAMPLE":
#         physical_sample_step = artwork.workflow_steps.filter(step_type="PHYSICAL_SAMPLE", version=current_version).order_by("sequence").first()
#         if physical_sample_step:
#             physical_sample_step.status = "PENDING"
#             physical_sample_step.acted_by = None
#             physical_sample_step.acted_on = None
#             physical_sample_step.save()
#         artwork.status = "PHYSICAL_SAMPLE_PENDING"
#         if artwork.assigned_vendor:
#             _notify(
#                 artwork.assigned_vendor, artwork,
#                 f"Return Physical Sample — {artwork.artwork_id}'s sample was rejected. Please send a new physical sample."
#                 + (f" Reason: {comments}" if comments else ""),
#             )
#         _log_activity(
#             request, artwork, "Sample Rejected (Sample Level)",
#             f"{request.user.username} rejected the physical sample for {artwork.artwork_id} at SAMPLE level."
#             + (f" Reason: {comments}" if comments else ""),
#         )

#     elif decision == "REJECTED" and reject_level == "ARTWORK":
#         artwork.status = "REJECTED"
#         if artwork.assigned_vendor:
#             _notify(
#                 artwork.assigned_vendor, artwork,
#                 f"Return Artwork — {artwork.artwork_id} was rejected during sample review. Please revise and upload a new artwork version."
#                 + (f" Reason: {comments}" if comments else ""),
#             )
#         _log_activity(
#             request, artwork, "Sample Rejected (Artwork Level)",
#             f"{request.user.username} rejected {artwork.artwork_id} at ARTWORK level during sample review."
#             + (f" Reason: {comments}" if comments else ""),
#         )

#     else:
#         step.status = "DONE"
#         step.acted_by = request.user
#         step.acted_on = timezone.now()
#         step.comments = comments
#         step.save()

#         next_step = artwork.workflow_steps.filter(status="PENDING", version=current_version).order_by("sequence").first()
#         if next_step:
#             if next_step.step_type == "MATCODE":
#                 artwork.status = "MATCODE_PENDING"
#             else:
#                 artwork.status = "MARKETING_REVIEW"
#             _notify_role(next_step.actor_role, artwork, f"{artwork.artwork_id} is ready for your '{next_step.step_label}' step.", exclude_user=request.user)
#         else:
#             artwork.status = "APPROVED"

#         _log_activity(request, artwork, "Sample Approved", f"{request.user.username} approved the physical sample for {artwork.artwork_id}.")

#     artwork.updated_by = request.user
#     artwork.save(update_fields=["status", "updated_by", "updated_on"])

#     return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def decide_physical_sample(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    if artwork.status != "SAMPLE_RECEIVED_REVIEW":
        return Response(
            {"error": f"Artwork is '{artwork.status}' — no received sample is currently awaiting a decision."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    sample = artwork.physical_samples.filter(is_received=True, decision="PENDING").order_by("-sent_on").first()
    if not sample:
        return Response({"error": "No received sample awaiting a decision."}, status=http_status.HTTP_400_BAD_REQUEST)

    current_version = artwork.versions.filter(is_active_version=True).first()

    # Each reviewer (Marketing / TQM / any ticked stakeholder) acts on
    # THEIR OWN pending row for this sample-approval gate.
    step = artwork.workflow_steps.filter(
        status="PENDING", step_type="SAMPLE_APPROVAL", version=current_version, actor_role=request.user.role
    ).order_by("sequence").first()

    if not step:
        return Response({"error": "You have no pending sample-approval step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    if not step.received_by:
        return Response({"error": "Please confirm receipt of the physical sample first."}, status=http_status.HTTP_400_BAD_REQUEST)
    
    
    decision = request.data.get("decision")
    comments = request.data.get("comments", "")
    reject_level = request.data.get("reject_level", "SAMPLE")

    if decision not in ["APPROVED", "REJECTED"]:
        return Response({"error": "decision must be APPROVED or REJECTED."}, status=http_status.HTTP_400_BAD_REQUEST)
    if decision == "REJECTED" and reject_level not in ["SAMPLE", "ARTWORK"]:
        return Response({"error": "reject_level must be SAMPLE or ARTWORK."}, status=http_status.HTTP_400_BAD_REQUEST)

    step.status = "DONE" if decision == "APPROVED" else "REJECTED"
    step.comments = comments
    step.acted_by = request.user
    step.acted_on = timezone.now()
    step.save()

    if decision == "REJECTED":
        sample.decision = "REJECTED"
        sample.reject_level = reject_level
        sample.decision_comments = comments
        sample.decided_by = request.user
        sample.decided_on = timezone.now()
        sample.save()

        if reject_level == "SAMPLE":
            physical_sample_step = artwork.workflow_steps.filter(step_type="PHYSICAL_SAMPLE", version=current_version).order_by("sequence").first()
            if physical_sample_step:
                physical_sample_step.status = "PENDING"
                physical_sample_step.acted_by = None
                physical_sample_step.acted_on = None
                physical_sample_step.save()
            # Reset the WHOLE sample-approval gate for the next sample
            artwork.workflow_steps.filter(step_type="SAMPLE_APPROVAL", version=current_version).update(
                status="PENDING", acted_by=None, acted_on=None, comments=""
            )
            artwork.status = "PHYSICAL_SAMPLE_PENDING"
            if artwork.assigned_vendor:
                _notify(
                    artwork.assigned_vendor, artwork,
                    f"Return Physical Sample — {artwork.artwork_id}'s sample was rejected by {request.user.role}. Please send a new physical sample."
                    + (f" Reason: {comments}" if comments else ""),
                )
        else:
            artwork.status = "REJECTED"
            if artwork.assigned_vendor:
                _notify(
                    artwork.assigned_vendor, artwork,
                    f"Return Artwork — {artwork.artwork_id} was rejected by {request.user.role} during sample review. Please revise and upload a new artwork version."
                    + (f" Reason: {comments}" if comments else ""),
                )

        _log_activity(
            request, artwork, "Sample Rejected",
            f"{request.user.username} ({request.user.role}) rejected the physical sample for {artwork.artwork_id} at {reject_level} level."
            + (f" Reason: {comments}" if comments else ""),
        )

    else:
        gate_sequence = step.sequence
        still_pending_in_gate = artwork.workflow_steps.filter(
            version=current_version, sequence=gate_sequence, status="PENDING"
        ).exclude(id=step.id).exists()

        if still_pending_in_gate:
            pass
        else:
            sample.decision = "APPROVED"
            sample.decided_by = request.user
            sample.decided_on = timezone.now()
            sample.save()

            next_step = artwork.workflow_steps.filter(
                status="PENDING", version=current_version, sequence__gt=gate_sequence
            ).order_by("sequence").first()
            if next_step:
                artwork.status = "MATCODE_PENDING" if next_step.step_type == "MATCODE" else "MARKETING_REVIEW"
                next_gate_roles = artwork.workflow_steps.filter(
                    version=current_version, sequence=next_step.sequence, status="PENDING"
                ).values_list("actor_role", flat=True).distinct()
                for role in next_gate_roles:
                    _notify_role(role, artwork, f"{artwork.artwork_id} is ready for your review.", exclude_user=request.user)
        #     else:
        #         artwork.status = "APPROVED"

        # _log_activity(request, artwork, "Sample Approved", f"{request.user.username} ({request.user.role}) approved the physical sample for {artwork.artwork_id}.")
            else:
                artwork.status = "APPROVED"
                if artwork.assigned_vendor:
                    _notify(artwork.assigned_vendor, artwork, f"{artwork.artwork_id} has been fully approved.")
                _notify_role("PPC", artwork, f"{artwork.artwork_id} is fully approved and ready for release.", exclude_user=request.user)

        _log_activity(request, artwork, "Sample Approved", f"{request.user.username} ({request.user.role}) approved the physical sample for {artwork.artwork_id}.")
        
    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)

# ------------------------------------------------------------------
# FR030 — Release (final release, linked to Material/PO)
# Only callable once fully APPROVED.
# ------------------------------------------------------------------

@swagger_auto_schema(method="post", operation_summary="Release Approved Artwork")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def release_artwork(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if artwork.status != "APPROVED":
        return Response({"error": "Only APPROVED artworks can be released."}, status=http_status.HTTP_400_BAD_REQUEST)

    # NOTE (client update): Material Code was earlier mandatory before
    # release. Per updated instruction, business will add Material
    # Code / PO Number LATER — so release is no longer blocked on it.
    # if not artwork.material_code:
    #     return Response({"error": "material_code is required before release."}, status=http_status.HTTP_400_BAD_REQUEST)

    artwork.status = "RELEASED"
    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(request, artwork, "Released", f"{artwork.artwork_id} released for production.", new_value="RELEASED")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# FR012 — Search / list (role-aware visibility, FR016/FR017)
# ------------------------------------------------------------------

@swagger_auto_schema(method="get", operation_summary="List / Search Artwork Requests")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_artwork_requests(request):
    qs = ArtworkRequest.objects.all()

    # if getattr(request.user, "role", None) == "PROCUREMENT":
    #     qs = qs.filter(assigned_vendor=request.user)
    
    # user_role = getattr(request.user, "role", None)
    # if user_role == "PROCUREMENT":
    #     qs = qs.filter(assigned_vendor=request.user)
    # elif user_role == "LEGAL":
    #     qs = qs.filter(assigned_legal=request.user)
    # elif user_role == "COMPLIANCE":
    #     qs = qs.filter(assigned_compliance=request.user)
    
    user_role = getattr(request.user, "role", None)
    if user_role == "PROCUREMENT":
        qs = qs.filter(assigned_vendor=request.user)
    # Legal/Compliance/Lab are ROLE-WIDE participants now (any user in
    # that role can act, chosen via checkbox at request time — not
    # tied to one specific assigned person) — so, like Marketing/PPC/
    # TQM, they see everything, no visibility filter needed.

    params = request.query_params
    if params.get("artwork_id"):
        qs = qs.filter(artwork_id__icontains=params["artwork_id"])
    if params.get("sku_code"):
        qs = qs.filter(sku_code__icontains=params["sku_code"])
    if params.get("brand_name"):
        qs = qs.filter(brand_name__icontains=params["brand_name"])
    if params.get("customer_name"):
        qs = qs.filter(customer_name__icontains=params["customer_name"])
    if params.get("material_code"):
        qs = qs.filter(material_code__icontains=params["material_code"])
    if params.get("po_number"):
        qs = qs.filter(po_number__icontains=params["po_number"])
    if params.get("status"):
        qs = qs.filter(status=params["status"])

    qs = qs.select_related("assigned_vendor", "created_by")[:500]

    return Response(
        [_artwork_to_dict(a, request=request, include_versions=False, include_approvals=False) for a in qs],
        status=http_status.HTTP_200_OK,
    )


# ------------------------------------------------------------------
# Detail view — full artwork with versions + approval trail
# ------------------------------------------------------------------

@swagger_auto_schema(method="get", operation_summary="Get Artwork Detail")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_artwork_details(request, artwork_id):
    artwork = get_object_or_404(
        ArtworkRequest.objects.prefetch_related("versions", "approvals"),
        artwork_id=artwork_id,
    )

    # if getattr(request.user, "role", None) == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
    #     return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)
    
    # user_role = getattr(request.user, "role", None)
    # if user_role == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
    #     return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)
    # if user_role == "LEGAL" and artwork.assigned_legal_id != request.user.id:
    #     return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)
    # if user_role == "COMPLIANCE" and artwork.assigned_compliance_id != request.user.id:
    #     return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)
    
    user_role = getattr(request.user, "role", None)
    if user_role == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# Business rule — obsolete artworks archived & protected
# ------------------------------------------------------------------

@swagger_auto_schema(method="post", operation_summary="Archive / Obsolete Artwork")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def archive_artwork(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if request.user.role not in ["ADMIN", "SUPER_ADMIN"]:
        return Response({"error": "Only Admin can archive artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    artwork.status = "OBSOLETE"
    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(request, artwork, "Archived", f"{artwork.artwork_id} marked obsolete.", new_value="OBSOLETE")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# FR006, FR028 — Comments / reference-attachment thread.
# Open to ALL internal roles plus Procurement — everyone can leave a
# remark and/or attach a reference file. Procurement can only
# see/post on artwork assigned to them; everyone else sees all.
# ------------------------------------------------------------------

@swagger_auto_schema(method="get", operation_summary="List Artwork Comments")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_artwork_comments(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if getattr(request.user, "role", None) == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    comments = artwork.comments.select_related("author", "version").order_by("created_on")
    return Response(
        [
            {
                "id": c.id,
                "author": c.author.username if c.author else None,
                "author_role": getattr(c.author, "role", None),
                "message": c.message,
                "attachment_url": (request.build_absolute_uri(c.attachment.url) if c.attachment else None),
                "version_number": c.version.version_number if c.version else None,
                "is_initial_remark": c.is_initial_remark,
                "created_on": c.created_on,
            }
            for c in comments
        ],
        status=http_status.HTTP_200_OK,
    )


@swagger_auto_schema(method="post", operation_summary="Add Artwork Comment / Attachment")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_artwork_comment(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if getattr(request.user, "role", None) == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to comment on this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    message = request.data.get("message", "").strip()
    attachment = request.FILES.get("attachment")
    is_initial_remark = str(request.data.get("is_initial_remark", "")).lower() == "true"

    if not message and not attachment:
        return Response({"error": "Add a remark or an attachment (at least one)."}, status=http_status.HTTP_400_BAD_REQUEST)

    current_version = artwork.versions.filter(is_active_version=True).first()

    comment = ArtworkComment.objects.create(
        artwork=artwork,
        author=request.user,
        message=message,
        attachment=attachment,
        version=current_version,
        is_initial_remark=is_initial_remark,
    )

    _log_activity(
        request, artwork,
        "Attachment Added" if attachment else "Comment Added",
        f"{request.user.username} {'attached a file' if attachment else 'commented'} on {artwork.artwork_id}.",
    )

    return Response(
        {
            "id": comment.id,
            "author": comment.author.username,
            "author_role": getattr(comment.author, "role", None),
            "message": comment.message,
            "attachment_url": (request.build_absolute_uri(comment.attachment.url) if comment.attachment else None),
            "version_number": comment.version.version_number if comment.version else None,
            "is_initial_remark": comment.is_initial_remark,
            "created_on": comment.created_on,
        },
        status=http_status.HTTP_201_CREATED,
    )


# ------------------------------------------------------------------
# Procurement dropdown data
# ------------------------------------------------------------------

@swagger_auto_schema(method="get", operation_summary="List Procurement Team Users")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_procurement_team(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.filter(role="PROCUREMENT").values("id", "username")
    return Response(list(users), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# FR008, FR022 — Create Artwork Request WITH full Packaging
# Specification (from the TRIMS_SPECIFICATION.xlsx form).
# ------------------------------------------------------------------

@swagger_auto_schema(method="post", operation_summary="Create Artwork Request With Packaging Spec")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_artwork_with_spec(request):
    data = request.data

    category = data.get("category")
    spec_data = data.get("spec_data") or {}

    valid_categories = [c[0] for c in PackagingSpecification.CATEGORY_CHOICES]
    if category not in valid_categories:
        return Response(
            {"error": f"category must be one of {valid_categories}"},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    title = data.get("title") or spec_data.get("PRODUCT") or f"{category} Artwork Request"
    sku_code = data.get("sku_code") or category

    # artwork = ArtworkRequest.objects.create(
    #     title=title,
    #     sku_code=sku_code,
    #     brand_name=data.get("brand_name") or spec_data.get("BUYER NAME"),
    #     customer_name=data.get("customer_name"),
    #     material_code=data.get("material_code"),
    #     po_number=data.get("po_number"),
    #     assigned_vendor_id=data.get("assigned_vendor_id") or None,
    #     assigned_legal_id=data.get("assigned_legal_id") or None,
    #     assigned_compliance_id=data.get("assigned_compliance_id") or None,
    #     customer_approval_required=bool(data.get("customer_approval_required", False)),
    
    artwork = ArtworkRequest.objects.create(
        title=title,
        sku_code=sku_code,
        brand_name=data.get("brand_name") or spec_data.get("BUYER NAME"),
        customer_name=data.get("customer_name"),
        material_code=data.get("material_code"),
        po_number=data.get("po_number"),
        assigned_vendor_id=data.get("assigned_vendor_id") or None,
        assigned_legal_id=data.get("assigned_legal_id") or None,
        assigned_compliance_id=data.get("assigned_compliance_id") or None,
        assigned_lab_id=data.get("assigned_lab_id") or None,
        customer_approval_required=bool(data.get("customer_approval_required", False)),
        legal_approval_required=bool(data.get("legal_approval_required", False)),
        # ppc_approval_required=bool(data.get("ppc_approval_required", True)),
        # tqm_approval_required=bool(data.get("tqm_approval_required", True)),
        ppc_approval_required=bool(data.get("ppc_approval_required", False)),
        tqm_approval_required=bool(data.get("tqm_approval_required", False)),
        compliance_approval_required=bool(data.get("compliance_approval_required", False)),
        lab_approval_required=bool(data.get("lab_approval_required", False)),
        remarks=data.get("remarks"),
        status="VENDOR_UPLOAD_PENDING" if data.get("assigned_vendor_id") else "DRAFT",
        workflow_key=get_workflow_key(category),
        created_by=request.user,
        updated_by=request.user,
    )

    PackagingSpecification.objects.create(
        artwork=artwork,
        category=category,
        spec_data=spec_data,
        created_by=request.user,
    )

    _log_activity(
        request, artwork, "Created",
        f"Artwork request {artwork.artwork_id} created with {category} packaging specification.",
        new_value=artwork.status,
    )

    if artwork.assigned_vendor:
        _notify(artwork.assigned_vendor, artwork, f"New artwork request {artwork.artwork_id} assigned to you.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_201_CREATED)


@swagger_auto_schema(method="get", operation_summary="Get Packaging Specification")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_packaging_spec(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if getattr(request.user, "role", None) == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    spec = getattr(artwork, "packaging_spec", None)
    if not spec:
        return Response({"error": "No packaging specification found."}, status=http_status.HTTP_404_NOT_FOUND)

    return Response(
        {"category": spec.category, "spec_data": spec.spec_data},
        status=http_status.HTTP_200_OK,
    )


# ------------------------------------------------------------------
# Missing-assignment recovery — assign/reassign Procurement any time
# ------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def assign_procurement(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if request.user.role not in ["MARKETING", "ADMIN"]:
        return Response(
            {"error": "Only Marketing or Admin can assign a procurement contact."},
            status=http_status.HTTP_403_FORBIDDEN,
        )

    if artwork.status in ["RELEASED", "ARCHIVED", "OBSOLETE"]:
        return Response(
            {"error": f"Artwork is '{artwork.status}' — cannot reassign procurement now."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    vendor_id = request.data.get("vendor_id")
    if not vendor_id:
        return Response({"error": "vendor_id is required."}, status=http_status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        vendor_user = User.objects.get(id=vendor_id, role="PROCUREMENT")
    except User.DoesNotExist:
        return Response({"error": "Invalid procurement user."}, status=http_status.HTTP_400_BAD_REQUEST)

    artwork.assigned_vendor = vendor_user
    if artwork.status == "DRAFT":
        artwork.status = "VENDOR_UPLOAD_PENDING"
    artwork.updated_by = request.user
    artwork.save(update_fields=["assigned_vendor", "status", "updated_by", "updated_on"])

    _log_activity(
        request, artwork, "Procurement Assigned",
        f"{request.user.username} assigned procurement contact '{vendor_user.username}' to {artwork.artwork_id}.",
    )

    _notify(vendor_user, artwork, f"You have been assigned artwork {artwork.artwork_id}.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# Excel export — full artwork data, one download
# ------------------------------------------------------------------

# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def export_artwork_excel(request, artwork_id):
#     from openpyxl import Workbook
#     from openpyxl.styles import Font, PatternFill
#     from django.http import HttpResponse
#     import re

#     artwork = get_object_or_404(
#         ArtworkRequest.objects.prefetch_related("versions", "approvals", "comments"),
#         artwork_id=artwork_id,
#     )

#     if getattr(request.user, "role", None) == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
#         return Response({"error": "Not authorized."}, status=http_status.HTTP_403_FORBIDDEN)

#     wb = Workbook()
#     header_font = Font(bold=True, color="FFFFFF")
#     header_fill = PatternFill(start_color="003366", end_color="003366", fill_type="solid")

#     def style_header(ws):
#         for cell in ws[1]:
#             cell.font = header_font
#             cell.fill = header_fill

#     # Sheet 1 — Overview
#     ws = wb.active
#     ws.title = "Overview"
#     ws.append(["Field", "Value"])
#     style_header(ws)
#     overview_rows = [
#         ("Artwork ID", artwork.artwork_id),
#         ("Title", artwork.title),
#         ("SKU Code", artwork.sku_code),
#         ("Brand", artwork.brand_name or ""),
#         ("Customer", artwork.customer_name or ""),
#         ("Reference Code", artwork.material_code or ""),
#         ("PO Number", artwork.po_number or ""),
#         ("Status", artwork.status),
#         ("Assigned Procurement", artwork.assigned_vendor.username if artwork.assigned_vendor else ""),
#         ("Created By", artwork.created_by.username if artwork.created_by else ""),
#         ("Created On", artwork.created_on.strftime("%Y-%m-%d %H:%M") if artwork.created_on else ""),
#     ]
#     for row in overview_rows:
#         ws.append(row)
#     ws.column_dimensions["A"].width = 22
#     ws.column_dimensions["B"].width = 45

#     # Sheet 2 — Packaging Specification (if this artwork has one)
#     spec = getattr(artwork, "packaging_spec", None)
#     if spec:
#         ws2 = wb.create_sheet("Packaging Specification")
#         ws2.append(["Field", "Value"])
#         style_header(ws2)
#         ws2.append(["Category", spec.category])
#         for label, val in spec.spec_data.items():
#             if val:
#                 ws2.append([label, val])

#         initial_remark = artwork.comments.filter(is_initial_remark=True).first()
#         if initial_remark:
#             if initial_remark.message:
#                 plain_text = re.sub(r"<[^>]+>", " ", initial_remark.message).strip()
#                 plain_text = re.sub(r"\s+", " ", plain_text)
#                 ws2.append(["Remark", plain_text])
#             if initial_remark.attachment:
#                 row_num = ws2.max_row + 1
#                 ws2.append(["Attachment URL", ""])
#                 cell = ws2.cell(row=row_num, column=2)
#                 attachment_url = request.build_absolute_uri(initial_remark.attachment.url)
#                 cell.value = attachment_url
#                 cell.hyperlink = attachment_url
#                 cell.font = Font(color="0563C1", underline="single")

#         ws2.column_dimensions["A"].width = 32
#         ws2.column_dimensions["B"].width = 50

#     # Sheet 3 — Full Approval History (across all versions)
#     ws3 = wb.create_sheet("Approval History")
#     ws3.append(["Version", "Stage", "Decision", "Acted By", "Acted On", "Comments"])
#     style_header(ws3)
#     for a in artwork.approvals.select_related("acted_by", "version").order_by("version__version_number", "sequence"):
#         ws3.append([
#             a.version.version_number,
#             a.stage,
#             a.decision,
#             a.acted_by.username if a.acted_by else "",
#             a.acted_on.strftime("%Y-%m-%d %H:%M") if a.acted_on else "",
#             a.comments or "",
#         ])
#     for col, width in zip("ABCDEF", [10, 12, 12, 15, 18, 45]):
#         ws3.column_dimensions[col].width = width

#     # Sheet 4 — Comments & Attachments
#     ws4 = wb.create_sheet("Comments")
#     ws4.append(["Author", "Role", "Version", "Message", "Attachment URL", "Posted On"])
#     style_header(ws4)
#     for c in artwork.comments.select_related("author", "version").order_by("created_on"):
#         plain_message = re.sub(r"<[^>]+>", " ", c.message).strip() if c.message else ""
#         plain_message = re.sub(r"\s+", " ", plain_message)

#         row_num = ws4.max_row + 1
#         ws4.append([
#             c.author.username if c.author else "",
#             getattr(c.author, "role", "") if c.author else "",
#             c.version.version_number if c.version else "",
#             plain_message,
#             "",
#             c.created_on.strftime("%Y-%m-%d %H:%M"),
#         ])
#         if c.attachment:
#             cell = ws4.cell(row=row_num, column=5)
#             attachment_url = request.build_absolute_uri(c.attachment.url)
#             cell.value = attachment_url
#             cell.hyperlink = attachment_url
#             cell.font = Font(color="0563C1", underline="single")

#     for col, width in zip("ABCDEF", [15, 14, 10, 45, 40, 18]):
#         ws4.column_dimensions[col].width = width

#     response = HttpResponse(
#         content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
#     )
#     response["Content-Disposition"] = f"attachment; filename={artwork.artwork_id}.xlsx"
#     wb.save(response)
#     return response



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_artwork_excel(request, artwork_id):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill
    from django.http import HttpResponse
    import re

    artwork = get_object_or_404(
        ArtworkRequest.objects.prefetch_related("versions", "approvals", "comments"),
        artwork_id=artwork_id,
    )

    if getattr(request.user, "role", None) == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized."}, status=http_status.HTTP_403_FORBIDDEN)

    wb = Workbook()
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="003366", end_color="003366", fill_type="solid")

    def style_header(ws):
        for cell in ws[1]:
            cell.font = header_font
            cell.fill = header_fill

    # Sheet 1 — Overview
    ws = wb.active
    ws.title = "Overview"
    ws.append(["Field", "Value"])
    style_header(ws)
    overview_rows = [
        ("Artwork ID", artwork.artwork_id),
        ("Title", artwork.title),
        ("SKU Code", artwork.sku_code),
        ("Brand", artwork.brand_name or ""),
        ("Customer", artwork.customer_name or ""),
        ("Reference Code", artwork.material_code or ""),
        ("PO Number", artwork.po_number or ""),
        ("Status", artwork.status),
        ("Assigned Procurement", artwork.assigned_vendor.username if artwork.assigned_vendor else ""),
        ("Created By", artwork.created_by.username if artwork.created_by else ""),
        ("Created On", artwork.created_on.strftime("%Y-%m-%d %H:%M") if artwork.created_on else ""),
    ]
    for row in overview_rows:
        ws.append(row)
    ws.column_dimensions["A"].width = 22
    ws.column_dimensions["B"].width = 45

    # Sheet 2 — Packaging Specification (if this artwork has one)
    spec = getattr(artwork, "packaging_spec", None)
    if spec:
        ws2 = wb.create_sheet("Packaging Specification")
        ws2.append(["Field", "Value"])
        style_header(ws2)
        ws2.append(["Category", spec.category])
        for label, val in spec.spec_data.items():
            if val:
                ws2.append([label, val])

        initial_remark = artwork.comments.filter(is_initial_remark=True).first()
        if initial_remark:
            if initial_remark.message:
                plain_text = re.sub(r"<[^>]+>", " ", initial_remark.message).strip()
                plain_text = re.sub(r"\s+", " ", plain_text)
                ws2.append(["Remark", plain_text])
            if initial_remark.attachment:
                row_num = ws2.max_row + 1
                ws2.append(["Attachment URL", ""])
                cell = ws2.cell(row=row_num, column=2)
                attachment_url = request.build_absolute_uri(initial_remark.attachment.url)
                cell.value = attachment_url
                cell.hyperlink = attachment_url
                cell.font = Font(color="0563C1", underline="single")

        ws2.column_dimensions["A"].width = 32
        ws2.column_dimensions["B"].width = 50

    # Sheet 3 — Full Approval History (across all versions).
    # STANDARD categories use ArtworkApproval; custom-workflow
    # categories (RIBBON, BW_STICKER) use WorkflowStep instead — both
    # get combined into this one sheet so nothing is ever empty.
    ws3 = wb.create_sheet("Approval History")
    ws3.append(["Version", "Stage", "Decision", "Acted By", "Acted On", "Comments"])
    style_header(ws3)

    if artwork.workflow_key == "STANDARD":
        for a in artwork.approvals.select_related("acted_by", "version").order_by("version__version_number", "sequence"):
            ws3.append([
                a.version.version_number,
                a.stage,
                a.decision,
                a.acted_by.username if a.acted_by else "",
                a.acted_on.strftime("%Y-%m-%d %H:%M") if a.acted_on else "",
                a.comments or "",
            ])
    else:
        for s in artwork.workflow_steps.select_related("acted_by", "version").order_by("version__version_number", "sequence"):
            ws3.append([
                s.version.version_number if s.version else "",
                s.step_label,
                s.status,
                s.acted_by.username if s.acted_by else "",
                s.acted_on.strftime("%Y-%m-%d %H:%M") if s.acted_on else "",
                s.comments or "",
            ])

    for col, width in zip("ABCDEF", [10, 22, 12, 15, 18, 45]):
        ws3.column_dimensions[col].width = width

    # Sheet 4 — Comments & Attachments
    ws4 = wb.create_sheet("Comments")
    ws4.append(["Author", "Role", "Version", "Message", "Attachment URL", "Posted On"])
    style_header(ws4)
    for c in artwork.comments.select_related("author", "version").order_by("created_on"):
        plain_message = re.sub(r"<[^>]+>", " ", c.message).strip() if c.message else ""
        plain_message = re.sub(r"\s+", " ", plain_message)

        row_num = ws4.max_row + 1
        ws4.append([
            c.author.username if c.author else "",
            getattr(c.author, "role", "") if c.author else "",
            c.version.version_number if c.version else "",
            plain_message,
            "",
            c.created_on.strftime("%Y-%m-%d %H:%M"),
        ])
        if c.attachment:
            cell = ws4.cell(row=row_num, column=5)
            attachment_url = request.build_absolute_uri(c.attachment.url)
            cell.value = attachment_url
            cell.hyperlink = attachment_url
            cell.font = Font(color="0563C1", underline="single")

    for col, width in zip("ABCDEF", [15, 14, 10, 45, 40, 18]):
        ws4.column_dimensions[col].width = width

    # Sheet 5 — Physical Sample History (RIBBON-style categories only)
    if artwork.workflow_key != "STANDARD" and artwork.physical_samples.exists():
        ws5 = wb.create_sheet("Physical Samples")
        ws5.append(["Version", "Sent By", "Date Sent", "Est. Arrival", "Received", "Decision", "Reject Level", "Marketing's Reason"])
        style_header(ws5)
        for s in artwork.physical_samples.select_related("sent_by", "decided_by", "version").order_by("version__version_number", "sent_on"):
            ws5.append([
                s.version.version_number if s.version else "",
                s.sent_by.username if s.sent_by else "",
                str(s.date_sent) if s.date_sent else "",
                str(s.est_arrival_date) if s.est_arrival_date else "",
                "Yes" if s.is_received else "No",
                s.decision,
                s.reject_level or "",
                s.decision_comments or "",
            ])
        for col, width in zip("ABCDEFGH", [10, 15, 14, 14, 10, 12, 14, 40]):
            ws5.column_dimensions[col].width = width

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = f"attachment; filename={artwork.artwork_id}.xlsx"
    wb.save(response)
    return response


# ------------------------------------------------------------------
# BRD Section 12 — Performance Dashboard
# ------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def artwork_performance_stats(request):
    stage_durations = {"MARKETING": [], "PPC": [], "TQM": [], "CUSTOMER": []}

    versions = ArtworkVersion.objects.prefetch_related("approvals")
    for v in versions:
        approvals = list(v.approvals.order_by("sequence"))
        prev_time = v.uploaded_on
        for a in approvals:
            if not a.acted_on:
                break
            duration_hours = (a.acted_on - prev_time).total_seconds() / 3600.0
            if duration_hours >= 0:
                stage_durations[a.stage].append(duration_hours)
            prev_time = a.acted_on
            if a.decision == "REJECTED":
                break

    avg_review_time_days = {}
    for stage, durations in stage_durations.items():
        avg_review_time_days[stage] = round((sum(durations) / len(durations)) / 24, 2) if durations else None

    terminal_qs = ArtworkRequest.objects.filter(status__in=["APPROVED", "RELEASED"])
    terminal_count = terminal_qs.count()
    first_pass_count = sum(1 for artwork in terminal_qs if artwork.versions.count() == 1)
    first_pass_rate = round((first_pass_count / terminal_count) * 100, 1) if terminal_count else None

    valid_stages = {k: v for k, v in avg_review_time_days.items() if v is not None}
    bottleneck_stage = max(valid_stages, key=valid_stages.get) if valid_stages else None

    from collections import defaultdict
    vendor_turnarounds = defaultdict(list)
    vendor_version_counts = defaultdict(list)

    for artwork in ArtworkRequest.objects.select_related("assigned_vendor").prefetch_related("versions"):
        if not artwork.assigned_vendor:
            continue
        vendor_name = artwork.assigned_vendor.username
        vendor_version_counts[vendor_name].append(artwork.versions.count())
        if artwork.status in ["APPROVED", "RELEASED"]:
            days = (artwork.updated_on - artwork.created_on).total_seconds() / 86400.0
            vendor_turnarounds[vendor_name].append(days)

    vendor_performance = []
    all_vendors = set(vendor_version_counts.keys()) | set(vendor_turnarounds.keys())
    for vendor_name in all_vendors:
        turnarounds = vendor_turnarounds.get(vendor_name, [])
        versions_list = vendor_version_counts.get(vendor_name, [])
        vendor_performance.append({
            "vendor": vendor_name,
            "avg_turnaround_days": round(sum(turnarounds) / len(turnarounds), 1) if turnarounds else None,
            "revisions": round(sum(versions_list) / len(versions_list), 1) if versions_list else 0,
        })

    return Response(
        {
            "avg_review_time_by_department": avg_review_time_days,
            "first_pass_approval_rate": first_pass_rate,
            "bottleneck_stage": bottleneck_stage,
            "bottleneck_days": valid_stages.get(bottleneck_stage) if bottleneck_stage else None,
            "vendor_performance": vendor_performance,
            "sample_size": {
                "versions_analyzed": versions.count(),
                "terminal_artworks": terminal_count,
            },
        },
        status=http_status.HTTP_200_OK,
    )


# ------------------------------------------------------------------
# Notification Bell — list + mark-read endpoints
# ------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_artwork_notifications(request):
    notifications = ArtworkNotification.objects.filter(recipient=request.user).select_related("artwork")[:30]
    unread_count = ArtworkNotification.objects.filter(recipient=request.user, is_read=False).count()
    return Response(
        {
            "unread_count": unread_count,
            "notifications": [
                {
                    "id": n.id,
                    "artwork_id": n.artwork.artwork_id,
                    "message": n.message,
                    "is_read": n.is_read,
                    "created_on": n.created_on,
                }
                for n in notifications
            ],
        },
        status=http_status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    notif = get_object_or_404(ArtworkNotification, id=notification_id, recipient=request.user)
    notif.is_read = True
    notif.save(update_fields=["is_read"])
    return Response({"status": "ok"}, status=http_status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    ArtworkNotification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({"status": "ok"}, status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# Legal / Compliance dropdown data + assignment — same pattern as
# Procurement's list_procurement_team / assign_procurement.
# ------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_legal_team(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.filter(role="LEGAL").values("id", "username")
    return Response(list(users), status=http_status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_compliance_team(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.filter(role="COMPLIANCE").values("id", "username")
    return Response(list(users), status=http_status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_lab_team(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.filter(role="LAB").values("id", "username")
    return Response(list(users), status=http_status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def assign_legal(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if request.user.role not in ["MARKETING", "ADMIN"]:
        return Response({"error": "Only Marketing or Admin can assign a legal contact."}, status=http_status.HTTP_403_FORBIDDEN)

    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"error": "user_id is required."}, status=http_status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        legal_user = User.objects.get(id=user_id, role="LEGAL")
    except User.DoesNotExist:
        return Response({"error": "Invalid legal user."}, status=http_status.HTTP_400_BAD_REQUEST)

    artwork.assigned_legal = legal_user
    artwork.updated_by = request.user
    artwork.save(update_fields=["assigned_legal", "updated_by", "updated_on"])

    _log_activity(request, artwork, "Legal Assigned", f"{request.user.username} assigned legal contact '{legal_user.username}' to {artwork.artwork_id}.")
    _notify(legal_user, artwork, f"You have been assigned artwork {artwork.artwork_id} for legal review.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def assign_compliance(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if request.user.role not in ["MARKETING", "ADMIN"]:
        return Response({"error": "Only Marketing or Admin can assign a compliance contact."}, status=http_status.HTTP_403_FORBIDDEN)

    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"error": "user_id is required."}, status=http_status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        compliance_user = User.objects.get(id=user_id, role="COMPLIANCE")
    except User.DoesNotExist:
        return Response({"error": "Invalid compliance user."}, status=http_status.HTTP_400_BAD_REQUEST)

    artwork.assigned_compliance = compliance_user
    artwork.updated_by = request.user
    artwork.save(update_fields=["assigned_compliance", "updated_by", "updated_on"])

    _log_activity(request, artwork, "Compliance Assigned", f"{request.user.username} assigned compliance contact '{compliance_user.username}' to {artwork.artwork_id}.")
    _notify(compliance_user, artwork, f"You have been assigned artwork {artwork.artwork_id} for compliance review.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)




# def _compute_pending_roles(artwork):
#     """Returns the set of roles whose action is needed RIGHT NOW for
#     this artwork — across upload/approval/sample/matcode/release
#     stages. Powers both the status display AND the 'In Action' filter."""
#     roles = set()

#     if artwork.status == "DRAFT":
#         roles.add("MARKETING")  # needs a Procurement contact assigned
#         return roles
#     if artwork.status == "VENDOR_UPLOAD_PENDING":
#         roles.add("PROCUREMENT")
#         return roles
#     if artwork.status == "APPROVED":
#         roles.add("PPC")  # release pending
#         return roles

def _compute_pending_roles(artwork):
    """Returns the set of roles whose action is needed RIGHT NOW for
    this artwork — across upload/approval/sample/matcode/release
    stages. Powers both the status display AND the 'In Action' filter."""
    roles = set()

    if artwork.status == "DRAFT":
        roles.add("MARKETING")  # needs a Procurement contact assigned
        return roles
    if artwork.status == "VENDOR_UPLOAD_PENDING":
        roles.add("PROCUREMENT")
        return roles
    if artwork.status == "APPROVED":
        roles.add("PPC")  # release pending
        return roles
    if artwork.status in ["REJECTED", "SAMPLE_REJECTED"]:
        # Whoever rejected it, the ball is now in Procurement's court —
        # no other reviewer (even one who never got to act in the same
        # gate) should see this in their "In Action" list anymore.
        roles.add("PROCUREMENT")
        return roles

    current_version = artwork.versions.filter(is_active_version=True).first()
    if not current_version:
        return roles

    if artwork.workflow_key == "STANDARD":
        first_pending = artwork.approvals.filter(version=current_version, decision="PENDING").order_by("sequence").first()
        if first_pending:
            role = ArtworkApproval.STAGE_ROLE_MAP.get(first_pending.stage)
            if role:
                roles.add(role)
    else:
        pending_qs = artwork.workflow_steps.filter(version=current_version, status="PENDING")
        first = pending_qs.order_by("sequence").first()
        if first:
            for s in pending_qs.filter(sequence=first.sequence):
                roles.add(s.actor_role)

    return roles



@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def mark_sample_received_by_me(request, artwork_id):
    """Each reviewer in the Sample-Approval gate confirms receipt
    INDIVIDUALLY — one person clicking this does NOT count for anyone
    else. Only once THIS user has confirmed can THEY approve/reject."""
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    # if artwork.status != "SAMPLE_SENT":
    #     return Response({"error": f"Artwork is '{artwork.status}' — no sample is currently awaiting receipt."}, status=http_status.HTTP_400_BAD_REQUEST)
 
    if artwork.status not in ["SAMPLE_SENT", "SAMPLE_RECEIVED_REVIEW"]:
        return Response({"error": f"Artwork is '{artwork.status}' — no sample is currently awaiting receipt."}, status=http_status.HTTP_400_BAD_REQUEST)
    current_version = artwork.versions.filter(is_active_version=True).first()
    my_step = artwork.workflow_steps.filter(
        status="PENDING", step_type="SAMPLE_APPROVAL", version=current_version, actor_role=request.user.role
    ).order_by("sequence").first()

    if not my_step:
        return Response({"error": "You have no pending sample-approval step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    if my_step.received_by:
        return Response({"error": "You have already confirmed receipt."}, status=http_status.HTTP_400_BAD_REQUEST)

    my_step.received_by = request.user
    my_step.received_on = timezone.now()
    my_step.save()

    # Keep the shared PhysicalSample.is_received flag as a general
    # "has anyone confirmed yet" record, for history/display purposes.
    sample = artwork.physical_samples.filter(is_received=False).order_by("-sent_on").first()
    if sample:
        sample.is_received = True
        sample.received_by = request.user
        sample.received_on = timezone.now()
        sample.save()

    if artwork.status == "SAMPLE_SENT":
        artwork.status = "SAMPLE_RECEIVED_REVIEW"
        artwork.save(update_fields=["status"])

    _log_activity(request, artwork, "Sample Receipt Confirmed", f"{request.user.username} ({request.user.role}) confirmed receipt of the physical sample for {artwork.artwork_id}.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)
