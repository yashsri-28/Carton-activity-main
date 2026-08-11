from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from activity_logs.utils import create_log


from .models import (
    LabDipRequest,
    LabDipTerryDetails,
    LabDipRugsDetails,
    LabDipShade
)


# ------------------------------------------------------------------
# API: Submit LabDip Request
#
# Description:
#   Creates a LabDip request with:
#   1. Header information
#   2. Category specific details
#   3. Multiple shade rows
#
# Method: POST
# ------------------------------------------------------------------


# ------------------------------------------------------------------
# Swagger Schema: Shade Row
# ------------------------------------------------------------------

labdip_shade_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "shade_name": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Shade name"
        ),
        "shade_details": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Shade description or details"
        ),
        "archroma_name": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Archroma dye reference name"
        ),
        "pantone_reference": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Pantone reference number"
        ),
        "remark": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Remarks for shade"
        ),
    }
)


# ------------------------------------------------------------------
# Swagger Schema: Terry Towel Details
# ------------------------------------------------------------------

labdip_terry_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "contact_person": openapi.Schema(type=openapi.TYPE_STRING),
        "washing_type": openapi.Schema(type=openapi.TYPE_STRING),
        "special_instructions": openapi.Schema(type=openapi.TYPE_STRING),
        "lab_dip_status": openapi.Schema(type=openapi.TYPE_STRING),
        "lab_dip_format": openapi.Schema(type=openapi.TYPE_STRING),
    }
)


# ------------------------------------------------------------------
# Swagger Schema: Rugs Details
# ------------------------------------------------------------------

labdip_rugs_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "programme_name": openapi.Schema(type=openapi.TYPE_STRING),
        "standard_type": openapi.Schema(type=openapi.TYPE_STRING),
        "material_description": openapi.Schema(type=openapi.TYPE_STRING),
        "piece_dyeing": openapi.Schema(type=openapi.TYPE_STRING),
        "yarn_dyeing": openapi.Schema(type=openapi.TYPE_STRING),
        "product_route_quality": openapi.Schema(type=openapi.TYPE_STRING),
        "coordinate_with_towel": openapi.Schema(type=openapi.TYPE_BOOLEAN),
    }
)


# ------------------------------------------------------------------
# Swagger Schema: Submit LabDip Request
# ------------------------------------------------------------------

submit_labdip_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["category", "customer_name"],
    properties={

        "category": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="LabDip category (Heb Solid Towel / Anjar TT / Rugs)"
        ),

        "no_of_shade": openapi.Schema(type=openapi.TYPE_STRING),

        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),

        "enquiry": openapi.Schema(type=openapi.TYPE_STRING),

        "design_name": openapi.Schema(type=openapi.TYPE_STRING),

        "greige_mat_code": openapi.Schema(type=openapi.TYPE_STRING),

        "towel_type": openapi.Schema(type=openapi.TYPE_STRING),

        "yarn_type": openapi.Schema(type=openapi.TYPE_STRING),

        "border_type": openapi.Schema(type=openapi.TYPE_STRING),

        "mix_match": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "light_source": openapi.Schema(type=openapi.TYPE_STRING),

        "party_protocol_attached": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "shade_match_with": openapi.Schema(type=openapi.TYPE_STRING),

        "approval": openapi.Schema(type=openapi.TYPE_STRING),

        "special_features": openapi.Schema(type=openapi.TYPE_STRING),

        "terry_details": labdip_terry_schema,

        "rugs_details": labdip_rugs_schema,

        "shades": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=labdip_shade_schema,
            description="Multiple shade rows"
        )
    }
)


@swagger_auto_schema(
    method="post",
    operation_summary="Submit LabDip Request",
    operation_description="Creates LabDip request with category details and multiple shades",
    request_body=submit_labdip_schema,
    responses={
        201: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "message": openapi.Schema(type=openapi.TYPE_STRING),
                "labdip_id": openapi.Schema(type=openapi.TYPE_INTEGER),
            }
        ),
        400: "Bad Request"
    }
)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_labdip(request):

    data = request.data

    category = data.get("category")
    customer_name = data.get("customer_name")

    if not category:
        return Response({"error": "category is required"}, status=400)

    if not customer_name:
        return Response({"error": "customer_name is required"}, status=400)

    shades = data.get("shades", [])

    # --------------------------------------------------
    # 1️⃣ CREATE MAIN LABDIP REQUEST
    # --------------------------------------------------

    labdip = LabDipRequest.objects.create(

        category=category,

        no_of_shade=data.get("no_of_shade"),
        customer_name=customer_name,
        enquiry=data.get("enquiry"),
        design_name=data.get("design_name"),

        greige_mat_code=data.get("greige_mat_code"),
        towel_type=data.get("towel_type"),
        yarn_type=data.get("yarn_type"),

        border_type=data.get("border_type"),
        mix_match=data.get("mix_match", False),

        light_source=data.get("light_source"),

        party_protocol_attached=data.get("party_protocol_attached", False),

        shade_match_with=data.get("shade_match_with"),

        approval=data.get("approval"),

        special_features=data.get("special_features"),

        created_by=request.user
    )

    # --------------------------------------------------
    # 2️⃣ CATEGORY SPECIFIC DETAILS
    # --------------------------------------------------

    if category == "ANJAR_TT":

        terry_data = data.get("terry_details", {})

        LabDipTerryDetails.objects.create(

            labdip=labdip,

            contact_person=terry_data.get("contact_person"),

            washing_type=terry_data.get("washing_type"),

            special_instructions=terry_data.get("special_instructions"),

            lab_dip_status=terry_data.get("lab_dip_status"),

            lab_dip_format=terry_data.get("lab_dip_format")
        )


    elif category == "RUGS":

        rugs_data = data.get("rugs_details", {})

        LabDipRugsDetails.objects.create(

            labdip=labdip,

            programme_name=rugs_data.get("programme_name"),

            standard_type=rugs_data.get("standard_type"),

            material_description=rugs_data.get("material_description"),

            piece_dyeing=rugs_data.get("piece_dyeing"),

            yarn_dyeing=rugs_data.get("yarn_dyeing"),

            product_route_quality=rugs_data.get("product_route_quality"),

            coordinate_with_towel=rugs_data.get("coordinate_with_towel", False)
        )


    # --------------------------------------------------
    # 3️⃣ CREATE SHADE ROWS
    # --------------------------------------------------

    for sh in shades:

        LabDipShade.objects.create(

            labdip=labdip,

            shade_name=sh.get("shade_name"),

            shade_details=sh.get("shade_details"),

            archroma_name=sh.get("archroma_name"),

            pantone_reference=sh.get("pantone_reference"),

            remark=sh.get("remark")
        )

    # --------------------------------------------------
    # 4️⃣ LOGGING
    # --------------------------------------------------

    create_log(
        module_name="LabDip",
        record_id=labdip.id,
        action="Created",
        message="LabDip request created",
        user=request.user
    )

    # --------------------------------------------------
    # 5️⃣ RESPONSE
    # --------------------------------------------------

    return Response(
        {
            "message": "LabDip Created Successfully",
            "labdip_id": labdip.id
        },
        status=201
    )




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_labdip(request):

    records = LabDipRequest.objects.all()

    data = []

    for r in records:

        data.append({
            "labdip_id": r.id,
            "category": r.category,
            "customer_name": r.customer_name,
            "no_of_shade": r.no_of_shade,
            "created_on": r.created_on.strftime("%d-%m-%Y")
        })

    return Response(data)


# ------------------------------------------------------------------
# Swagger Schema: LabDip Details Request
# ------------------------------------------------------------------

labdip_details_request_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["labdip_id"],
    properties={
        "labdip_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="LabDip Request ID"
        )
    }
)


# ------------------------------------------------------------------
# Swagger Schema: LabDip Details Response
# ------------------------------------------------------------------

labdip_details_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={

        "labdip_id": openapi.Schema(type=openapi.TYPE_INTEGER),

        "category": openapi.Schema(type=openapi.TYPE_STRING),
        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
        "no_of_shade": openapi.Schema(type=openapi.TYPE_STRING),

        "enquiry": openapi.Schema(type=openapi.TYPE_STRING),
        "design_name": openapi.Schema(type=openapi.TYPE_STRING),
        "greige_mat_code": openapi.Schema(type=openapi.TYPE_STRING),
        "towel_type": openapi.Schema(type=openapi.TYPE_STRING),
        "yarn_type": openapi.Schema(type=openapi.TYPE_STRING),
        "border_type": openapi.Schema(type=openapi.TYPE_STRING),

        "mix_match": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "light_source": openapi.Schema(type=openapi.TYPE_STRING),
        "party_protocol_attached": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "shade_match_with": openapi.Schema(type=openapi.TYPE_STRING),
        "approval": openapi.Schema(type=openapi.TYPE_STRING),
        "special_features": openapi.Schema(type=openapi.TYPE_STRING),

        "created_on": openapi.Schema(type=openapi.TYPE_STRING),

        "shades": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "shade_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "shade_name": openapi.Schema(type=openapi.TYPE_STRING),
                    "archroma_name": openapi.Schema(type=openapi.TYPE_STRING),
                    "pantone_reference": openapi.Schema(type=openapi.TYPE_STRING),
                    "shade_details": openapi.Schema(type=openapi.TYPE_STRING),
                    "remark": openapi.Schema(type=openapi.TYPE_STRING),
                }
            )
        ),

        "rugs_details": openapi.Schema(type=openapi.TYPE_OBJECT),
        "terry_details": openapi.Schema(type=openapi.TYPE_OBJECT),
    }
)


# ------------------------------------------------------------------
# API: Get LabDip Request Details
#
# Description:
# Returns complete LabDip request including:
# - Main LabDip form
# - Shade details
# - Rugs details (if category = RUGS)
# - Terry towel details (if category = TERRY_TT)
#
# Method: POST
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
    operation_summary="Get LabDip Request Details",
    request_body=labdip_details_request_schema,
    responses={
        200: labdip_details_response_schema,
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_labdip_details(request):

    labdip_id = request.data.get("labdip_id")

    if not labdip_id:
        return Response(
            {"error": "labdip_id is required"},
            status=400
        )

    try:
        labdip = LabDipRequest.objects.get(id=labdip_id)
    except LabDipRequest.DoesNotExist:
        return Response(
            {"error": "Invalid labdip_id"},
            status=404
        )

    # --------------------------------------------------
    # Shades
    # --------------------------------------------------

    shade_list = []

    shades = LabDipShade.objects.filter(labdip=labdip)

    for s in shades:
        shade_list.append({
            "shade_id": s.id,
            "shade_name": s.shade_name,
            "archroma_name": s.archroma_name,
            "pantone_reference": s.pantone_reference,
            "shade_details": s.shade_details,
            "remark": s.remark,
        })

    # --------------------------------------------------
    # Rugs Details
    # --------------------------------------------------

    rugs_details = None

    try:
        rugs = labdip.rugs_details

        rugs_details = {
            "programme_name": rugs.programme_name,
            "standard_type": rugs.standard_type,
            "material_description": rugs.material_description,
            "piece_dyeing": rugs.piece_dyeing,
            "yarn_dyeing": rugs.yarn_dyeing,
            "product_route_quality": rugs.product_route_quality,
            "coordinate_with_towel": rugs.coordinate_with_towel,
        }

    except LabDipRugsDetails.DoesNotExist:
        pass


    # --------------------------------------------------
    # Terry Details
    # --------------------------------------------------

    terry_details = None

    try:
        terry = labdip.terry_details

        terry_details = {
            "contact_person": terry.contact_person,
            "washing_type": terry.washing_type,
            "special_instructions": terry.special_instructions,
            "lab_dip_status": terry.lab_dip_status,
            "lab_dip_format": terry.lab_dip_format,
        }

    except LabDipTerryDetails.DoesNotExist:
        pass


    # --------------------------------------------------
    # Final Response
    # --------------------------------------------------

    response_data = {

        "labdip_id": labdip.id,

        "category": labdip.category,
        "customer_name": labdip.customer_name,
        "no_of_shade": labdip.no_of_shade,

        "enquiry": labdip.enquiry,
        "design_name": labdip.design_name,
        "greige_mat_code": labdip.greige_mat_code,
        "towel_type": labdip.towel_type,
        "yarn_type": labdip.yarn_type,
        "border_type": labdip.border_type,

        "mix_match": labdip.mix_match,
        "light_source": labdip.light_source,
        "party_protocol_attached": labdip.party_protocol_attached,

        "shade_match_with": labdip.shade_match_with,
        "approval": labdip.approval,
        "special_features": labdip.special_features,

        "created_on": labdip.created_on.strftime("%d-%m-%Y")
        if labdip.created_on else None,

        "shades": shade_list,
        "rugs_details": rugs_details,
        "terry_details": terry_details
    }

    return Response(response_data)