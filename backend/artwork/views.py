from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status

from drf_yasg.utils import swagger_auto_schema

# from .models import ArtworkRequest, ArtworkVersion, ArtworkApproval
from .models import ArtworkRequest, ArtworkVersion, ArtworkApproval, ArtworkComment, PackagingSpecification
from activity_logs.models import ActivityLog


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

APPROVAL_STAGE_ORDER = ["MARKETING", "PPC", "TQM", "CUSTOMER"]

MAX_UPLOAD_SIZE_MB = 25
ALLOWED_EXTENSIONS = [".pdf", ".ai", ".eps", ".psd", ".png", ".jpg", ".jpeg", ".tiff"]


def _log_activity(request, artwork, action, message, old_value=None, new_value=None):
    """Reuses the existing generic ActivityLog model — FR014 audit trail."""
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


def _artwork_to_dict(artwork, include_versions=True, include_approvals=True):
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
        data["approvals"] = [
            {
                "stage": a.stage,
                "sequence": a.sequence,
                "decision": a.decision,
                "comments": a.comments,
                "acted_by": a.acted_by.username if a.acted_by else None,
                "acted_on": a.acted_on,
            }
            for a in artwork.approvals.select_related("acted_by").order_by("sequence")
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
        created_by=request.user,
        updated_by=request.user,
    )

    # Pre-create the approval stage rows so the pipeline is visible upfront
    stages = ["MARKETING", "PPC", "TQM"]
    if artwork.customer_approval_required:
        stages.append("CUSTOMER")
    # (approvals are attached once the first version is uploaded — see upload_artwork_version)

    _log_activity(
        request, artwork, "Created",
        f"Artwork request {artwork.artwork_id} created.",
        new_value=artwork.status,
    )

    return Response(_artwork_to_dict(artwork), status=http_status.HTTP_201_CREATED)


# ------------------------------------------------------------------
# FR003, FR004 — Upload / revise an artwork file (vendor or internal)
# Every call creates a NEW version. Approved versions are never
# touched — this is how immutability (Business Rule) is enforced.
# ------------------------------------------------------------------

@swagger_auto_schema(method="post", operation_summary="Upload Artwork Version")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def upload_artwork_version(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    # RBAC: only the assigned vendor or internal staff (not other vendors) may upload
    if artwork.assigned_vendor_id and request.user.role == "VENDOR" and request.user.id != artwork.assigned_vendor_id:
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

    # Deactivate previous version's "active" flag; locked versions are untouched otherwise
    artwork.versions.filter(is_active_version=True).update(is_active_version=False)

    version = ArtworkVersion.objects.create(
        artwork=artwork,
        version_number=next_version_number,
        file=file_obj,
        change_summary=request.data.get("change_summary"),
        is_active_version=True,
        uploaded_by=request.user,
    )

    # Reset approval stages for this new version
    ArtworkApproval.objects.filter(artwork=artwork).delete()
    stages = ["MARKETING", "PPC", "TQM"]
    if artwork.customer_approval_required:
        stages.append("CUSTOMER")
    for i, stage in enumerate(stages, start=1):
        ArtworkApproval.objects.create(artwork=artwork, version=version, stage=stage, sequence=i)

    artwork.status = "MARKETING_REVIEW"
    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(
        request, artwork, "Version Uploaded",
        f"Version {version.version_number} uploaded for {artwork.artwork_id}.",
        new_value=f"v{version.version_number}",
    )

    return Response(_artwork_to_dict(artwork), status=http_status.HTTP_201_CREATED)


# ------------------------------------------------------------------
# FR005 — Approve / Reject the current pending stage
# Sequential: a stage can only act once all prior stages are APPROVED.
# ------------------------------------------------------------------

@swagger_auto_schema(method="post", operation_summary="Approve or Reject Artwork Stage")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def act_on_artwork_approval(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest.objects.select_for_update(), artwork_id=artwork_id)

    decision = request.data.get("decision")  # "APPROVED" or "REJECTED"
    comments = request.data.get("comments", "")

    if decision not in ["APPROVED", "REJECTED"]:
        return Response({"error": "decision must be APPROVED or REJECTED."}, status=http_status.HTTP_400_BAD_REQUEST)

    pending = artwork.approvals.filter(decision="PENDING").order_by("sequence").first()
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
    else:
        next_pending = artwork.approvals.filter(decision="PENDING").order_by("sequence").first()
        if next_pending:
            artwork.status = f"{next_pending.stage}_REVIEW" if next_pending.stage != "CUSTOMER" else "CUSTOMER_REVIEW"
        else:
            # All stages approved -> lock the version, mark request approved
            artwork.status = "APPROVED"
            active_version = artwork.versions.filter(is_active_version=True).first()
            if active_version:
                active_version.is_locked = True
                active_version.save(update_fields=["is_locked"])

    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(
        request, artwork, f"Stage {decision.title()}",
        f"{pending.stage} stage {decision.lower()} by {request.user.username}.",
        old_value="PENDING",
        new_value=decision,
    )

    return Response(_artwork_to_dict(artwork), status=http_status.HTTP_200_OK)


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

    if not artwork.material_code:
        return Response({"error": "material_code is required before release."}, status=http_status.HTTP_400_BAD_REQUEST)

    artwork.status = "RELEASED"
    artwork.updated_by = request.user
    artwork.save(update_fields=["status", "updated_by", "updated_on"])

    _log_activity(request, artwork, "Released", f"{artwork.artwork_id} released for production.", new_value="RELEASED")

    return Response(_artwork_to_dict(artwork), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# FR012 — Search / list (role-aware visibility, FR016/FR017)
# ------------------------------------------------------------------

@swagger_auto_schema(method="get", operation_summary="List / Search Artwork Requests")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_artwork_requests(request):
    qs = ArtworkRequest.objects.all()

    # FR017 — vendors only ever see artwork assigned to them
    if getattr(request.user, "role", None) == "VENDOR":
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
        [_artwork_to_dict(a, include_versions=False, include_approvals=False) for a in qs],
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

    if getattr(request.user, "role", None) == "VENDOR" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    return Response(_artwork_to_dict(artwork), status=http_status.HTTP_200_OK)


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

    return Response(_artwork_to_dict(artwork), status=http_status.HTTP_200_OK)


# ------------------------------------------------------------------
# FR006, FR028 — Vendor comments / query management
# Same visibility rule as everywhere else: vendor only sees/posts
# on artwork assigned to them; internal roles see everything.
# ------------------------------------------------------------------

@swagger_auto_schema(method="get", operation_summary="List Artwork Comments")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_artwork_comments(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if getattr(request.user, "role", None) == "VENDOR" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    comments = artwork.comments.select_related("author").order_by("created_on")
    return Response(
        [
            {
                "id": c.id,
                "author": c.author.username if c.author else None,
                "author_role": getattr(c.author, "role", None),
                "message": c.message,
                "created_on": c.created_on,
            }
            for c in comments
        ],
        status=http_status.HTTP_200_OK,
    )


@swagger_auto_schema(method="post", operation_summary="Add Artwork Comment")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_artwork_comment(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if getattr(request.user, "role", None) == "VENDOR" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to comment on this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    message = request.data.get("message", "").strip()
    if not message:
        return Response({"error": "Comment message cannot be empty."}, status=http_status.HTTP_400_BAD_REQUEST)

    comment = ArtworkComment.objects.create(artwork=artwork, author=request.user, message=message)

    _log_activity(
        request, artwork, "Comment Added",
        f"{request.user.username} commented on {artwork.artwork_id}.",
    )

    return Response(
        {
            "id": comment.id,
            "author": comment.author.username,
            "author_role": getattr(comment.author, "role", None),
            "message": comment.message,
            "created_on": comment.created_on,
        },
        status=http_status.HTTP_201_CREATED,
    )
    
# ------------------------------------------------------------------
# Vendor dropdown data — for Marketing to pick a vendor while
# creating/assigning an artwork request from the UI.
# ------------------------------------------------------------------

@swagger_auto_schema(method="get", operation_summary="List Vendor Users")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_vendors(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    vendors = User.objects.filter(role="VENDOR").values("id", "username")
    return Response(list(vendors), status=http_status.HTTP_200_OK)    


# ------------------------------------------------------------------
# FR008, FR022 — Create Artwork Request WITH full Packaging
# Specification (from the TRIMS_SPECIFICATION.xlsx form).
# One call: generates the Artwork ID and stores every filled
# spec field exactly as the excel form defines it.
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

    # PRODUCT / BUYER NAME are always present in every sheet — use them
    # to build a sensible title/sku if the caller didn't send explicit ones.
    title = data.get("title") or spec_data.get("PRODUCT") or f"{category} Artwork Request"
    sku_code = data.get("sku_code") or spec_data.get("SIZE") or category

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

    return Response(_artwork_to_dict(artwork), status=http_status.HTTP_201_CREATED)


# ------------------------------------------------------------------
# Fetch a saved packaging specification for an artwork
# ------------------------------------------------------------------

@swagger_auto_schema(method="get", operation_summary="Get Packaging Specification")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_packaging_spec(request, artwork_id):
    artwork = get_object_or_404(ArtworkRequest, artwork_id=artwork_id)

    if getattr(request.user, "role", None) == "VENDOR" and artwork.assigned_vendor_id != request.user.id:
        return Response({"error": "Not authorized to view this artwork."}, status=http_status.HTTP_403_FORBIDDEN)

    spec = getattr(artwork, "packaging_spec", None)
    if not spec:
        return Response({"error": "No packaging specification found."}, status=http_status.HTTP_404_NOT_FOUND)

    return Response(
        {"category": spec.category, "spec_data": spec.spec_data},
        status=http_status.HTTP_200_OK,
    )