
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status

from drf_yasg.utils import swagger_auto_schema

from .models import ArtworkRequest, ArtworkVersion, ArtworkApproval, ArtworkComment, PackagingSpecification
from activity_logs.models import ActivityLog
from .models import ArtworkRequest, ArtworkVersion, ArtworkApproval, ArtworkComment, PackagingSpecification, ArtworkNotification, WorkflowStep, PhysicalSample, MatcodeSequence
from .workflow_config import get_workflow_key, get_workflow_steps



APPROVAL_STAGE_ORDER = ["MARKETING", "PPC", "TQM", "CUSTOMER"]

MAX_UPLOAD_SIZE_MB = 25
ALLOWED_EXTENSIONS = [".pdf", ".ai", ".eps", ".psd", ".png", ".jpg", ".jpeg", ".tiff"]

# Helper function
def _notify(user, artwork, message):
    """Create one notification for a specific user."""
    if not user:
        return
    ArtworkNotification.objects.create(recipient=user, artwork=artwork, message=message)


def _notify_role(role, artwork, message, exclude_user=None):
    """Create a notification for every user that has the given role
    (used when the next reviewer isn't one specific assigned person,
    e.g. PPC/TQM stages — any user with that role should be alerted)."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.filter(role=role)
    if exclude_user:
        users = users.exclude(id=exclude_user.id)
    for u in users:
        ArtworkNotification.objects.create(recipient=u, artwork=artwork, message=message)
        
        
        

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
        "customer_approval_required": artwork.customer_approval_required,
        "status": artwork.status,
        "remarks": artwork.remarks,
        "workflow_key": artwork.workflow_key,
        "created_by": artwork.created_by.username if artwork.created_by else None,
        "created_on": artwork.created_on,
        "updated_on": artwork.updated_on,
    }

    if artwork.workflow_key != "STANDARD":
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
            }
            for s in artwork.workflow_steps.order_by("sequence")
        ]

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

    return data


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

    # version = ArtworkVersion.objects.create(
    #     artwork=artwork,
    #     version_number=next_version_number,
    #     file=file_obj,
    #     change_summary=request.data.get("change_summary"),
    #     is_active_version=True,
    #     uploaded_by=request.user,
    # )

    # stages = ["MARKETING", "PPC", "TQM"]
    # if artwork.customer_approval_required:
    #     stages.append("CUSTOMER")
    # for i, stage in enumerate(stages, start=1):
    #     ArtworkApproval.objects.create(artwork=artwork, version=version, stage=stage, sequence=i)

    # artwork.status = "MARKETING_REVIEW"
    # artwork.updated_by = request.user
    # artwork.save(update_fields=["status", "updated_by", "updated_on"])
    
    version = ArtworkVersion.objects.create(
        artwork=artwork,
        version_number=next_version_number,
        file=file_obj,
        change_summary=request.data.get("change_summary"),
        is_active_version=True,
        uploaded_by=request.user,
    )

    if artwork.workflow_key == "STANDARD":
        # Existing behavior — completely untouched.
        stages = ["MARKETING", "PPC", "TQM"]
        if artwork.customer_approval_required:
            stages.append("CUSTOMER")
        for i, stage in enumerate(stages, start=1):
            ArtworkApproval.objects.create(artwork=artwork, version=version, stage=stage, sequence=i)
        artwork.status = "MARKETING_REVIEW"
    else:
        # Custom category workflow — build its WorkflowStep chain from
        # the config, and set status to whatever its FIRST step needs.
        WorkflowStep.objects.filter(artwork=artwork).delete()
        step_defs = get_workflow_steps(artwork.workflow_key)
        for i, step_def in enumerate(step_defs, start=1):
            WorkflowStep.objects.create(
                artwork=artwork,
                workflow_key=artwork.workflow_key,
                step_code=step_def["code"],
                step_type=step_def["type"],
                step_label=step_def["label"],
                actor_role=step_def["role"],
                sequence=i,
            )
        artwork.status = "MARKETING_REVIEW"

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


@swagger_auto_schema(method="post", operation_summary="Approve or Reject Artwork Stage")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def act_on_artwork_approval(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    # Guard: approval actions are only valid while the artwork is
    # actively in a review stage. Once ANY stage rejects (or the whole
    # cycle finishes), no other stage can act — even if its row was
    # pre-created as PENDING — until a fresh version is uploaded.
    ACTIVE_REVIEW_STATUSES = ["MARKETING_REVIEW", "PPC_REVIEW", "TQM_REVIEW", "CUSTOMER_REVIEW"]
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

    # if decision == "REJECTED":
    #     artwork.status = "REJECTED"
    # else:
    #     next_pending = artwork.approvals.filter(decision="PENDING", version=current_version).order_by("sequence").first()
    #     if next_pending:
    #         artwork.status = f"{next_pending.stage}_REVIEW" if next_pending.stage != "CUSTOMER" else "CUSTOMER_REVIEW"
    #     else:
    #         artwork.status = "APPROVED"
    #         active_version = artwork.versions.filter(is_active_version=True).first()
    #         if active_version:
    #             active_version.is_locked = True
    #             active_version.save(update_fields=["is_locked"])
    
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


@swagger_auto_schema(method="post", operation_summary="Release Approved Artwork")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def release_artwork(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if artwork.status != "APPROVED":
        return Response({"error": "Only APPROVED artworks can be released."}, status=http_status.HTTP_400_BAD_REQUEST)

    # if not artwork.material_code:
    #     return Response({"error": "material_code is required before release."}, status=http_status.HTTP_400_BAD_REQUEST)

    artwork.status = "RELEASED"
    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(request, artwork, "Released", f"{artwork.artwork_id} released for production.", new_value="RELEASED")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


@swagger_auto_schema(method="get", operation_summary="List / Search Artwork Requests")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_artwork_requests(request):
    qs = ArtworkRequest.objects.all()

    if getattr(request.user, "role", None) == "PROCUREMENT":
        qs = qs.filter(assigned_vendor=request.user)

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


@swagger_auto_schema(method="get", operation_summary="Get Artwork Detail")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_artwork_details(request, artwork_id):
    artwork = get_object_or_404(
        ArtworkRequest.objects.prefetch_related("versions", "approvals"),
        artwork_id=artwork_id,
    )

    if getattr(request.user, "role", None) == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


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


@swagger_auto_schema(method="get", operation_summary="List Artwork Comments")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_artwork_comments(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if getattr(request.user, "role", None) == "PROCUREMENT" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    # comments = artwork.comments.select_related("author","version").order_by("created_on")
    # return Response(
    #     [
    #         {
    #             "id": c.id,
    #             "author": c.author.username if c.author else None,
    #             "author_role": getattr(c.author, "role", None),
    #             "message": c.message,
    #             "attachment_url": (request.build_absolute_uri(c.attachment.url) if c.attachment else None),
    #             "version_number": c.version.version_number if c.version else None,
    #             "created_on": c.created_on,
    #         }
    #         for c in comments
    #     ],
    #     status=http_status.HTTP_200_OK,
    # )
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

    # message = request.data.get("message", "").strip()
    # attachment = request.FILES.get("attachment")

    # if not message and not attachment:
    #     return Response({"error": "Add a remark or an attachment (at least one)."}, status=http_status.HTTP_400_BAD_REQUEST)

    # # Tag this comment with whichever version is currently active —
    # # that's the design the person is actually looking at/discussing.
    # current_version = artwork.versions.filter(is_active_version=True).first()
    
    
    # comment = ArtworkComment.objects.create(
    #     artwork=artwork,
    #     author=request.user,
    #     message=message,
    #     attachment=attachment,
    #     version=current_version,
    # )
    
    
    
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
            "created_on": comment.created_on,
        },
        status=http_status.HTTP_201_CREATED,
    )


@swagger_auto_schema(method="get", operation_summary="List Procurement Team Users")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_procurement_team(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.filter(role="PROCUREMENT").values("id", "username")
    return Response(list(users), status=http_status.HTTP_200_OK)


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
    # sku_code = data.get("sku_code") or spec_data.get("SIZE") or category
    
    sku_code = data.get("sku_code") or category
    
    artwork = ArtworkRequest.objects.create(
        title=title,
        sku_code=sku_code,
        brand_name=data.get("brand_name") or spec_data.get("BUYER NAME"),
        customer_name=data.get("customer_name"),
        material_code=data.get("material_code"),
        po_number=data.get("po_number"),
        assigned_vendor_id=data.get("assigned_vendor_id") or None,
        customer_approval_required=bool(data.get("customer_approval_required", False)),
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
    
   
@swagger_auto_schema(method="post", operation_summary="Assign Procurement Contact")
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
    # A DRAFT artwork (never had anyone assigned) moves forward once
    # a procurement contact is finally picked — same as if it had been
    # assigned at creation time.
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_artwork_excel(request, artwork_id):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill
    from django.http import HttpResponse

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
        ("Material Code", artwork.material_code or ""),
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
        ws2.column_dimensions["A"].width = 32
        ws2.column_dimensions["B"].width = 40

    # Sheet 3 — Full Approval History (across all versions)
    ws3 = wb.create_sheet("Approval History")
    ws3.append(["Version", "Stage", "Decision", "Acted By", "Acted On", "Comments"])
    style_header(ws3)
    for a in artwork.approvals.select_related("acted_by", "version").order_by("version__version_number", "sequence"):
        ws3.append([
            a.version.version_number,
            a.stage,
            a.decision,
            a.acted_by.username if a.acted_by else "",
            a.acted_on.strftime("%Y-%m-%d %H:%M") if a.acted_on else "",
            a.comments or "",
        ])
    for col, width in zip("ABCDEF", [10, 12, 12, 15, 18, 45]):
        ws3.column_dimensions[col].width = width

    # Sheet 4 — Comments & Attachments
    ws4 = wb.create_sheet("Comments")
    ws4.append(["Author", "Role", "Version", "Message", "Has Attachment", "Posted On"])
    style_header(ws4)
    for c in artwork.comments.select_related("author", "version").order_by("created_on"):
        ws4.append([
            c.author.username if c.author else "",
            getattr(c.author, "role", "") if c.author else "",
            c.version.version_number if c.version else "",
            c.message,
            "Yes" if c.attachment else "No",
            c.created_on.strftime("%Y-%m-%d %H:%M"),
        ])
    for col, width in zip("ABCDEF", [15, 14, 10, 45, 15, 18]):
        ws4.column_dimensions[col].width = width

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = f"attachment; filename={artwork.artwork_id}.xlsx"
    wb.save(response)
    return response


# ------------------------------------------------------------------
# BRD Section 12 — Performance Dashboard
# Average review time by department, first-pass approval rate,
# and approval bottleneck analysis — computed on the fly from
# ArtworkVersion/ArtworkApproval data (no extra tables needed).
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

    # First-pass approval rate
    terminal_qs = ArtworkRequest.objects.filter(status__in=["APPROVED", "RELEASED"])
    terminal_count = terminal_qs.count()
    first_pass_count = sum(1 for artwork in terminal_qs if artwork.versions.count() == 1)
    first_pass_rate = round((first_pass_count / terminal_count) * 100, 1) if terminal_count else None

    # Bottleneck stage
    valid_stages = {k: v for k, v in avg_review_time_days.items() if v is not None}
    bottleneck_stage = max(valid_stages, key=valid_stages.get) if valid_stages else None

    # Vendor (Procurement) performance — avg turnaround days and
    # average revision count (versions per artwork), grouped by the
    # assigned procurement contact.
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
# Custom-workflow step actions — generic, works for ANY category
# whose workflow_key != "STANDARD" (currently BW_STICKER; RIBBON's
# PHYSICAL_SAMPLE/SAMPLE_APPROVAL step types are modeled but not
# wired up yet — that's a separate follow-up).
# ------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def act_on_workflow_step(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    if artwork.workflow_key == "STANDARD":
        return Response({"error": "This artwork uses the standard approval flow — use act-approval/ instead."}, status=http_status.HTTP_400_BAD_REQUEST)

    decision = request.data.get("decision")
    comments = request.data.get("comments", "")

    if decision not in ["APPROVED", "REJECTED"]:
        return Response({"error": "decision must be APPROVED or REJECTED."}, status=http_status.HTTP_400_BAD_REQUEST)

    pending = artwork.workflow_steps.filter(status="PENDING", step_type="APPROVAL").order_by("sequence").first()
    if not pending:
        return Response({"error": "No pending approval step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    if request.user.role != pending.actor_role and not request.user.is_superuser:
        return Response(
            {"error": f"Only role '{pending.actor_role}' can act on this step."},
            status=http_status.HTTP_403_FORBIDDEN,
        )

    pending.status = "DONE" if decision == "APPROVED" else "REJECTED"
    pending.comments = comments
    pending.acted_by = request.user
    pending.acted_on = timezone.now()
    pending.save()

    if decision == "REJECTED":
        artwork.status = "REJECTED"
        if artwork.assigned_vendor:
            _notify(artwork.assigned_vendor, artwork, f"{artwork.artwork_id} was rejected. Please revise and re-upload." + (f" Reason: {comments}" if comments else ""))
    else:
        next_step = artwork.workflow_steps.filter(status="PENDING").order_by("sequence").first()
        if next_step:
            if next_step.step_type == "MATCODE":
                artwork.status = "MATCODE_PENDING"
            else:
                artwork.status = "MARKETING_REVIEW"
            _notify_role(next_step.actor_role, artwork, f"{artwork.artwork_id} is ready for your '{next_step.step_label}' step.", exclude_user=request.user)
        else:
            artwork.status = "APPROVED"

    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(
        request, artwork, f"Workflow Step {decision.title()}",
        f"{pending.step_label} {decision.lower()} by {request.user.username}." + (f" Reason: {comments}" if comments else ""),
    )

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)


# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# @transaction.atomic
# def generate_matcode(request, artwork_id):
#     artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

#     if artwork.workflow_key == "STANDARD":
#         return Response({"error": "This artwork does not use matcode-generation workflow."}, status=http_status.HTTP_400_BAD_REQUEST)

#     pending = artwork.workflow_steps.filter(status="PENDING", step_type="MATCODE").order_by("sequence").first()
#     if not pending:
#         return Response({"error": "No pending matcode-generation step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

#     if request.user.role != pending.actor_role and not request.user.is_superuser:
#         return Response(
#             {"error": f"Only role '{pending.actor_role}' can generate the matcode."},
#             status=http_status.HTTP_403_FORBIDDEN,
#         )

#     material_code = request.data.get("material_code", "").strip()
#     if not material_code:
#         return Response({"error": "material_code is required."}, status=http_status.HTTP_400_BAD_REQUEST)

#     pending.status = "DONE"
#     pending.acted_by = request.user
#     pending.acted_on = timezone.now()
#     pending.save()

#     artwork.material_code = material_code

#     next_step = artwork.workflow_steps.filter(status="PENDING").order_by("sequence").first()
#     if next_step:
#         artwork.status = "MARKETING_REVIEW"
#         _notify_role(next_step.actor_role, artwork, f"{artwork.artwork_id} is ready for your '{next_step.step_label}' step.", exclude_user=request.user)
#     else:
#         # No further steps — matches the STANDARD flow's meaning of
#         # "fully approved", so PPC can Release exactly as before,
#         # with zero changes to the release endpoint.
#         artwork.status = "APPROVED"
#         active_version = artwork.versions.filter(is_active_version=True).first()
#         if active_version:
#             active_version.is_locked = True
#             active_version.save(update_fields=["is_locked"])
#         _notify_role("PPC", artwork, f"{artwork.artwork_id} has a matcode ({material_code}) and is ready for release.", exclude_user=request.user)

#     artwork.updated_by = request.user
#     artwork.save(update_fields=["status", "material_code", "updated_by", "updated_on"])

#     _log_activity(request, artwork, "Matcode Generated", f"{request.user.username} generated matcode '{material_code}' for {artwork.artwork_id}.")

#     return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def generate_matcode(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    if artwork.workflow_key == "STANDARD":
        return Response({"error": "This artwork does not use matcode-generation workflow."}, status=http_status.HTTP_400_BAD_REQUEST)

    pending = artwork.workflow_steps.filter(status="PENDING", step_type="MATCODE").order_by("sequence").first()
    if not pending:
        return Response({"error": "No pending matcode-generation step for this artwork."}, status=http_status.HTTP_400_BAD_REQUEST)

    if request.user.role != pending.actor_role and not request.user.is_superuser:
        return Response(
            {"error": f"Only role '{pending.actor_role}' can generate the matcode."},
            status=http_status.HTTP_403_FORBIDDEN,
        )

    # Auto-generated — no manual typing, guaranteed unique (race-safe).
    material_code = MatcodeSequence.next_code()

    pending.status = "DONE"
    pending.acted_by = request.user
    pending.acted_on = timezone.now()
    pending.save()

    artwork.material_code = material_code

    next_step = artwork.workflow_steps.filter(status="PENDING").order_by("sequence").first()
    if next_step:
        artwork.status = "MARKETING_REVIEW"
        _notify_role(next_step.actor_role, artwork, f"{artwork.artwork_id} is ready for your '{next_step.step_label}' step.", exclude_user=request.user)
    else:
        artwork.status = "APPROVED"
        active_version = artwork.versions.filter(is_active_version=True).first()
        if active_version:
            active_version.is_locked = True
            active_version.save(update_fields=["is_locked"])
        _notify_role("PPC", artwork, f"{artwork.artwork_id} has matcode {material_code} generated and is ready for release.", exclude_user=request.user)

    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "material_code", "updated_by", "updated_on"])

    _log_activity(request, artwork, "Matcode Generated", f"{request.user.username} generated matcode '{material_code}' for {artwork.artwork_id}.")

    return Response(_artwork_to_dict(artwork, request=request), status=http_status.HTTP_200_OK)