from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from .models import PPSampleOrder


# # ------------------------------------------------------------------
# # Swagger Schema: Submit PP Sample Order
# # ------------------------------------------------------------------

# pp_sample_submit_schema = openapi.Schema(
#     type=openapi.TYPE_OBJECT,
#     required=[
#         "sample_sale_order_no",
#         "customer_name",
#         "no_of_samples"
#     ],
#     properties={

#         "sample_sale_order_no": openapi.Schema(type=openapi.TYPE_STRING),

#         "existing_customer": openapi.Schema(type=openapi.TYPE_BOOLEAN),

#         "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
#         "brand_name": openapi.Schema(type=openapi.TYPE_STRING),
#         "sale_order_number": openapi.Schema(type=openapi.TYPE_STRING),

#         "ppc_sample_requirement_date": openapi.Schema(
#             type=openapi.TYPE_STRING,
#             format="date"
#         ),

#         "top_sample_requirement_date": openapi.Schema(
#             type=openapi.TYPE_STRING,
#             format="date"
#         ),

#         "top_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
#         "testing_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

#         "no_of_samples": openapi.Schema(type=openapi.TYPE_INTEGER),

#         "remarks": openapi.Schema(type=openapi.TYPE_STRING),

#         "btn": openapi.Schema(
#             type=openapi.TYPE_STRING,
#             description="save as draft / submit"
#         )
#     }
# )


# # ------------------------------------------------------------------
# # API: Submit PP Sample Order
# #
# # Description:
# #   Creates a PP Sample Order.
# #
# #   Supports:
# #   - Save as Draft
# #   - Submit
# #
# #   Stores:
# #   - Customer details
# #   - Requirement dates
# #   - TOP & Testing flags
# #   - Total no_of_samples
# #
# # Method: POST
# # ------------------------------------------------------------------

# @swagger_auto_schema(
#     method="post",
#     operation_summary="Submit PP Sample Order",
#     operation_description="Creates a new PP Sample Order record",
#     request_body=pp_sample_submit_schema,
#     responses={
#         201: openapi.Schema(
#             type=openapi.TYPE_OBJECT,
#             properties={
#                 "message": openapi.Schema(type=openapi.TYPE_STRING),
#                 "pp_sample_id": openapi.Schema(type=openapi.TYPE_INTEGER),
#                 "status": openapi.Schema(type=openapi.TYPE_STRING)
#             }
#         ),
#         400: "Bad Request"
#     }
# )
# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# @transaction.atomic
# def submit_pp_sample(request):

#     data = request.data

#     sample_sale_order_no = data.get("sample_sale_order_no")
#     customer_name = data.get("customer_name")
#     no_of_samples = data.get("no_of_samples")
#     btn = data.get("btn", "")

#     # --------------------------------------------------
#     # VALIDATION
#     # --------------------------------------------------

#     if not sample_sale_order_no:
#         return Response(
#             {"error": "sample_sale_order_no is required"},
#             status=400
#         )

#     if not customer_name:
#         return Response(
#             {"error": "customer_name is required"},
#             status=400
#         )

#     if not no_of_samples:
#         return Response(
#             {"error": "no_of_samples is required"},
#             status=400
#         )

#     # Prevent duplicate Sale Order
#     if PPSampleOrder.objects.filter(
#         sample_sale_order_no=sample_sale_order_no
#     ).exists():
#         return Response(
#             {"error": "Sample Sale Order already exists"},
#             status=400
#         )

#     # --------------------------------------------------
#     # STATUS LOGIC
#     # --------------------------------------------------

#     status_value = "Draft" if btn.lower() == "save as draft" else "Submitted"

#     # --------------------------------------------------
#     # CREATE RECORD
#     # --------------------------------------------------

#     pp_sample = PPSampleOrder.objects.create(
#         sample_sale_order_no=sample_sale_order_no,
#         existing_customer=data.get("existing_customer", True),
#         customer_name=customer_name,
#         brand_name=data.get("brand_name"),
#         sale_order_number=data.get("sale_order_number"),

#         ppc_sample_requirement_date=data.get("ppc_sample_requirement_date"),
#         top_sample_requirement_date=data.get("top_sample_requirement_date"),



#         no_of_samples=no_of_samples,
#         remarks=data.get("remarks"),

#         status=status_value,
#         created_by=request.user
#     )

#     # --------------------------------------------------
#     # RESPONSE
#     # --------------------------------------------------

#     return Response(
#         {
#             "message": "PP Sample Order Saved Successfully",
#             "pp_sample_id": pp_sample.id,
#             "status": status_value
#         },
#         status=201
#     )





# ------------------------------------------------------------------
# Swagger Schema: Submit PP Sample Order
# ------------------------------------------------------------------

pp_sample_submit_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=[
        "sample_sale_order_no",
        "customer_name",
        "no_of_samples"
    ],
    properties={

        # ---------------- BASIC DETAILS ----------------

        "sample_sale_order_no": openapi.Schema(type=openapi.TYPE_STRING),

        "existing_customer": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),

        "brand_name": openapi.Schema(type=openapi.TYPE_STRING),

        "sale_order_number": openapi.Schema(type=openapi.TYPE_STRING),

        "no_of_samples": openapi.Schema(type=openapi.TYPE_INTEGER),

        "remarks": openapi.Schema(type=openapi.TYPE_STRING),

        # ---------------- ESTIMATED DATES ----------------

        "ppc_sample_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        "top_sample_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        "testing_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        "adv_photoshoot_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        "anyother_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        # ---------------- ACTUAL DATES ----------------

        "ppc_actual_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        "top_actual_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        "testing_actual_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        "adv_photoshoot_actual_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        "anyother_actual_requirement_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),

        # ---------------- REQUIRED FLAGS ----------------

        "top_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "testing_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "pp_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "adv_photoshoot_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "anyother_requirement": openapi.Schema(type=openapi.TYPE_STRING),

        # ---------------- REMARKS ----------------

        "pp_remarks": openapi.Schema(type=openapi.TYPE_STRING),

        "top_remarks": openapi.Schema(type=openapi.TYPE_STRING),

        "testing_remarks": openapi.Schema(type=openapi.TYPE_STRING),

        "adv_photoshoot_remarks": openapi.Schema(type=openapi.TYPE_STRING),

        "anyother_remarks": openapi.Schema(type=openapi.TYPE_STRING),

        # ---------------- BUTTON ----------------

        "btn": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="save as draft / submit"
        )
    }
)



# ------------------------------------------------------------------
# API: Submit PP Sample Order
#
# Description:
#   Creates a PP Sample Order with:
#
#   - Customer details
#   - Estimated requirement dates
#   - Actual requirement dates
#   - Requirement flags (TOP / Testing / PP / Photoshoot)
#   - Remarks for each requirement
#
#   Supports:
#   - Save as Draft
#   - Submit
#
# Method: POST
# ------------------------------------------------------------------


@swagger_auto_schema(
    method="post",
    operation_summary="Submit PP Sample Order",
    operation_description="Creates a new PP Sample Order record",
    request_body=pp_sample_submit_schema,
    responses={
        201: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "message": openapi.Schema(type=openapi.TYPE_STRING),
                "pp_sample_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                "status": openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        400: "Bad Request"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def submit_pp_sample(request):

    data = request.data

    sample_sale_order_no = data.get("sample_sale_order_no")
    customer_name = data.get("customer_name")
    no_of_samples = data.get("no_of_samples")
    btn = data.get("btn", "")

    # --------------------------------------------------
    # VALIDATION
    # --------------------------------------------------

    if not sample_sale_order_no:
        return Response(
            {"error": "sample_sale_order_no is required"},
            status=400
        )

    if not customer_name:
        return Response(
            {"error": "customer_name is required"},
            status=400
        )

    if not no_of_samples:
        return Response(
            {"error": "no_of_samples is required"},
            status=400
        )

    # Prevent duplicate Sale Order

    if PPSampleOrder.objects.filter(
        sample_sale_order_no=sample_sale_order_no
    ).exists():
        return Response(
            {"error": "Sample Sale Order already exists"},
            status=400
        )

    # --------------------------------------------------
    # STATUS LOGIC
    # --------------------------------------------------

    status_value = "Draft" if btn.lower() == "save as draft" else "Submitted"

    # --------------------------------------------------
    # CREATE RECORD
    # --------------------------------------------------

    pp_sample = PPSampleOrder.objects.create(

        sample_sale_order_no=sample_sale_order_no,

        existing_customer=data.get("existing_customer", True),

        customer_name=customer_name,

        brand_name=data.get("brand_name"),

        sale_order_number=data.get("sale_order_number"),

        # Estimated Dates

        ppc_sample_requirement_date=data.get("ppc_sample_requirement_date"),

        top_sample_requirement_date=data.get("top_sample_requirement_date"),

        testing_requirement_date=data.get("testing_requirement_date"),

        adv_photoshoot_requirement_date=data.get("adv_photoshoot_requirement_date"),

        anyother_requirement_date=data.get("anyother_requirement_date"),



        # Requirement Flags

        top_required=data.get("top_required", False),

        testing_required=data.get("testing_required", False),

        pp_required=data.get("pp_required", False),

        adv_photoshoot_required=data.get("adv_photoshoot_required", False),

        anyother_requirement=data.get("anyother_requirement"),

        # Requirement Remarks

        pp_remarks=data.get("pp_remarks"),

        top_remarks=data.get("top_remarks"),

        testing_remarks=data.get("testing_remarks"),

        adv_photoshoot_remarks=data.get("adv_photoshoot_remarks"),

        anyother_remarks=data.get("anyother_remarks"),

        # General

        no_of_samples=no_of_samples,

        remarks=data.get("remarks"),

        status=status_value,

        created_by=request.user
    )

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return Response(
        {
            "message": "PP Sample Order Saved Successfully",
            "pp_sample_id": pp_sample.id,
            "status": status_value
        },
        status=201
    )
    
    
    
# ------------------------------------------------------------------
# Swagger Schema: Update PP Sample Requirement
# ------------------------------------------------------------------

pp_sample_requirement_update_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["pp_sample_id"],
    properties={

        "pp_sample_id": openapi.Schema(type=openapi.TYPE_INTEGER),

        "top_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "testing_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "top_sample_requirement_date": openapi.Schema(
            type=openapi.TYPE_STRING,
            format="date"
        ),

        "btn": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="save as draft / submit"
        )
    }
)


# ------------------------------------------------------------------
# API: Update PP Sample Requirement Details
#
# Description:
#   Allows authorized user (PPC/QA) to update:
#   - top_required
#   - testing_required
#  
# Method: POST
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
    operation_summary="Update PP Sample Requirement Details",
    operation_description="Updates TOP & Testing details for PP Sample",
    request_body=pp_sample_requirement_update_schema,
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "message": openapi.Schema(type=openapi.TYPE_STRING),
                "status": openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def update_pp_sample_requirement(request):

    data = request.data
    pp_sample_id = data.get("pp_sample_id")
    btn = data.get("btn", "")

    if not pp_sample_id:
        return Response(
            {"error": "pp_sample_id is required"},
            status=400
        )

    try:
        pp_sample = PPSampleOrder.objects.get(id=pp_sample_id)
    except PPSampleOrder.DoesNotExist:
        return Response(
            {"error": "Invalid pp_sample_id"},
            status=404
        )

    # Optional: Prevent update if already closed
    if pp_sample.status == "Completed":
        return Response(
            {"error": "Completed records cannot be modified"},
            status=400
        )

    # --------------------------------------------------
    # UPDATE FIELDS
    # --------------------------------------------------

    if "top_required" in data:
        pp_sample.top_required = data.get("top_required")

    if "testing_required" in data:
        pp_sample.testing_required = data.get("testing_required")


    # --------------------------------------------------
    # STATUS LOGIC
    # --------------------------------------------------

    if btn.lower() == "submit":
        pp_sample.status = "Requirement Updated"
    else:
        pp_sample.status = "Requirement Draft"

    pp_sample.updated_by = request.user
    pp_sample.save()

    return Response({
        "message": "Requirement Details Updated Successfully",
        "status": pp_sample.status
    })
    
    

# ------------------------------------------------------------------
# API: Update PP Sample Requirement Details
#
# Description:
#   Allows authorized user (PPC/QA) to update:
#   - top_required
#   - testing_required
#  
# Method: POST
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
    operation_summary="Update PP Sample Requirement Details",
    operation_description="Updates TOP & Testing details for PP Sample",
    request_body=pp_sample_requirement_update_schema,
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "message": openapi.Schema(type=openapi.TYPE_STRING),
                "status": openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def update_pp_sample_requirement_actual_date(request):

    data = request.data
    pp_sample_id = data.get("pp_sample_id")
    btn = data.get("btn", "")

    if not pp_sample_id:
        return Response(
            {"error": "pp_sample_id is required"},
            status=400
        )

    try:
        pp_sample = PPSampleOrder.objects.get(id=pp_sample_id)
    except PPSampleOrder.DoesNotExist:
        return Response(
            {"error": "Invalid pp_sample_id"},
            status=404
        )

    # Optional: Prevent update if already closed
    if pp_sample.status == "Completed":
        return Response(
            {"error": "Completed records cannot be modified"},
            status=400
        )

    # --------------------------------------------------
    # UPDATE FIELDS
    # --------------------------------------------------


    pp_sample.ppc_actual_requirement_date=data.get("ppc_actual_requirement_date")

    pp_sample.top_actual_requirement_date=data.get("top_actual_requirement_date")

    pp_sample.testing_actual_requirement_date=data.get("testing_actual_requirement_date")

    pp_sample.adv_photoshoot_actual_requirement_date=data.get("adv_photoshoot_actual_requirement_date")

    pp_sample.anyother_actual_requirement_date=data.get("anyother_actual_requirement_date")
    
    
    
    pp_sample.pp_remarks=data.get("pp_remarks")

    pp_sample.top_remarks=data.get("top_remarks")

    pp_sample.testing_remarks=data.get("testing_remarks")

    pp_sample.adv_photoshoot_remarks=data.get("adv_photoshoot_remarks")

    pp_sample.anyother_remarks=data.get("anyother_remarks")

    # --------------------------------------------------
    # STATUS LOGIC
    # --------------------------------------------------

    if btn.lower() == "submit":
        pp_sample.status = "Date Updated"
    else:
        pp_sample.status = "Requirement Draft"

    pp_sample.updated_by = request.user
    pp_sample.save()

    return Response({
        "message": "Requirement Details Updated Successfully",
        "status": pp_sample.status
    })


    
# ------------------------------------------------------------------
# Swagger Schema: Get PP Sample Details Request
# ------------------------------------------------------------------

pp_sample_details_request_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["pp_sample_id"],
    properties={
        "pp_sample_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="PP Sample Order ID"
        )
    }
)





# ------------------------------------------------------------------
# Swagger Schema: Get PP Sample Details Response
# ------------------------------------------------------------------

pp_sample_details_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={

        "pp_sample_id": openapi.Schema(type=openapi.TYPE_INTEGER),

        "sample_sale_order_no": openapi.Schema(type=openapi.TYPE_STRING),
        "existing_customer": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
        "brand_name": openapi.Schema(type=openapi.TYPE_STRING),
        "sale_order_number": openapi.Schema(type=openapi.TYPE_STRING),

        "no_of_samples": openapi.Schema(type=openapi.TYPE_INTEGER),

        "status": openapi.Schema(type=openapi.TYPE_STRING),

        "remarks": openapi.Schema(type=openapi.TYPE_STRING),

        "pp_requirement": openapi.Schema(type=openapi.TYPE_OBJECT),
        "top_requirement": openapi.Schema(type=openapi.TYPE_OBJECT),
        "testing_requirement": openapi.Schema(type=openapi.TYPE_OBJECT),
        "adv_photoshoot_requirement": openapi.Schema(type=openapi.TYPE_OBJECT),
        "anyother_requirement": openapi.Schema(type=openapi.TYPE_OBJECT),

        "created_by": openapi.Schema(type=openapi.TYPE_STRING),
        "updated_by": openapi.Schema(type=openapi.TYPE_STRING),

        "created_on": openapi.Schema(type=openapi.TYPE_STRING),
        "updated_on": openapi.Schema(type=openapi.TYPE_STRING),
    }
)


# ------------------------------------------------------------------
# API: Get PP Sample Order Details
#
# Description:
#   Returns PP Sample Order details.
#
#   Requirement sections are returned ONLY if:
#   - the corresponding *_required flag is TRUE
#   - and the date/remarks contain data
#
#   Sections:
#   - PPC Requirement
#   - TOP Requirement
#   - Testing Requirement
#   - Advertising Photoshoot Requirement
#   - Any Other Requirement
#
# Method: POST
# ------------------------------------------------------------------


@swagger_auto_schema(
    method="post",
    operation_summary="Get PP Sample Order Details",
    operation_description="Returns PP Sample Order details conditionally based on requirements",
    request_body=pp_sample_details_request_schema,
    responses={
        200: pp_sample_details_response_schema,
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_pp_sample_details(request):

    pp_sample_id = request.data.get("pp_sample_id")

    if not pp_sample_id:
        return Response(
            {"error": "pp_sample_id is required"},
            status=400
        )

    try:
        pp_sample = PPSampleOrder.objects.select_related(
            "created_by",
            "updated_by"
        ).get(id=pp_sample_id)

    except PPSampleOrder.DoesNotExist:
        return Response(
            {"error": "Invalid pp_sample_id"},
            status=404
        )

    response_data = {

        "pp_sample_id": pp_sample.id,

        "sample_sale_order_no": pp_sample.sample_sale_order_no,
        "existing_customer": pp_sample.existing_customer,
        "customer_name": pp_sample.customer_name,
        "brand_name": pp_sample.brand_name,
        "sale_order_number": pp_sample.sale_order_number,

        "no_of_samples": pp_sample.no_of_samples,

        "remarks": pp_sample.remarks,

        "status": pp_sample.status,

        "created_by":
            pp_sample.created_by.username if pp_sample.created_by else None,

        "updated_by":
            pp_sample.updated_by.username if pp_sample.updated_by else None,

        "created_on":
            pp_sample.created_on.strftime("%d-%m-%Y %H:%M:%S")
            if pp_sample.created_on else None,

        "updated_on":
            pp_sample.updated_on.strftime("%d-%m-%Y %H:%M:%S")
            if pp_sample.updated_on else None,
    }

    # --------------------------------------------------
    # PPC Requirement
    # --------------------------------------------------

    if pp_sample.pp_required and (
        pp_sample.ppc_sample_requirement_date or
        pp_sample.ppc_actual_requirement_date
    ):

        response_data["pp_requirement"] = {

            "estimated_date":
                pp_sample.ppc_sample_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.ppc_sample_requirement_date else None,

            "actual_date":
                pp_sample.ppc_actual_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.ppc_actual_requirement_date else None,

            "remarks": pp_sample.pp_remarks
        }

    # --------------------------------------------------
    # TOP Requirement
    # --------------------------------------------------

    if pp_sample.top_required and (
        pp_sample.top_sample_requirement_date or
        pp_sample.top_actual_requirement_date
    ):

        response_data["top_requirement"] = {

            "estimated_date":
                pp_sample.top_sample_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.top_sample_requirement_date else None,

            "actual_date":
                pp_sample.top_actual_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.top_actual_requirement_date else None,

            "remarks": pp_sample.top_remarks
        }

    # --------------------------------------------------
    # Testing Requirement
    # --------------------------------------------------

    if pp_sample.testing_required and (
        pp_sample.testing_requirement_date or
        pp_sample.testing_actual_requirement_date
    ):

        response_data["testing_requirement"] = {

            "estimated_date":
                pp_sample.testing_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.testing_requirement_date else None,

            "actual_date":
                pp_sample.testing_actual_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.testing_actual_requirement_date else None,

            "remarks": pp_sample.testing_remarks
        }

    # --------------------------------------------------
    # Advertising Photoshoot
    # --------------------------------------------------

    if pp_sample.adv_photoshoot_required and (
        pp_sample.adv_photoshoot_requirement_date or
        pp_sample.adv_photoshoot_actual_requirement_date
    ):

        response_data["adv_photoshoot_requirement"] = {

            "estimated_date":
                pp_sample.adv_photoshoot_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.adv_photoshoot_requirement_date else None,

            "actual_date":
                pp_sample.adv_photoshoot_actual_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.adv_photoshoot_actual_requirement_date else None,

            "remarks": pp_sample.adv_photoshoot_remarks
        }

    # --------------------------------------------------
    # Any Other Requirement
    # --------------------------------------------------

    if pp_sample.anyother_requirement:

        response_data["anyother_requirement"] = {

            "requirement": pp_sample.anyother_requirement,

            "estimated_date":
                pp_sample.anyother_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.anyother_requirement_date else None,

            "actual_date":
                pp_sample.anyother_actual_requirement_date.strftime("%d-%m-%Y")
                if pp_sample.anyother_actual_requirement_date else None,

            "remarks": pp_sample.anyother_remarks
        }

    return Response(response_data)



# # ------------------------------------------------------------------
# # Swagger Schema: Get PP Sample Details Response
# # ------------------------------------------------------------------

# pp_sample_details_response_schema = openapi.Schema(
#     type=openapi.TYPE_OBJECT,
#     properties={

#         "pp_sample_id": openapi.Schema(type=openapi.TYPE_INTEGER),

#         "sample_sale_order_no": openapi.Schema(type=openapi.TYPE_STRING),
#         "existing_customer": openapi.Schema(type=openapi.TYPE_BOOLEAN),
#         "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
#         "brand_name": openapi.Schema(type=openapi.TYPE_STRING),
#         "sale_order_number": openapi.Schema(type=openapi.TYPE_STRING),

#         "ppc_sample_requirement_date": openapi.Schema(type=openapi.TYPE_STRING),
#         "top_sample_requirement_date": openapi.Schema(type=openapi.TYPE_STRING),

#         "top_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
#         "testing_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

#         "no_of_samples": openapi.Schema(type=openapi.TYPE_INTEGER),
#         "remarks": openapi.Schema(type=openapi.TYPE_STRING),

#         "status": openapi.Schema(type=openapi.TYPE_STRING),

#         "created_by": openapi.Schema(type=openapi.TYPE_STRING),
#         "updated_by": openapi.Schema(type=openapi.TYPE_STRING),

#         "created_on": openapi.Schema(type=openapi.TYPE_STRING),
#         "updated_on": openapi.Schema(type=openapi.TYPE_STRING),
#     }
# )


# # ------------------------------------------------------------------
# # API: Get PP Sample Order Details
# #
# # Description:
# #   Returns complete PP Sample Order data including:
# #   - Customer details
# #   - Requirement details (TOP & Testing)
# #   - Status information
# #   - Audit fields
# #
# # Method: POST
# # ------------------------------------------------------------------

# @swagger_auto_schema(
#     method="post",
#     operation_summary="Get PP Sample Order Details",
#     operation_description="Returns complete PP Sample Order record",
#     request_body=pp_sample_details_request_schema,
#     responses={
#         200: pp_sample_details_response_schema,
#         400: "Bad Request",
#         404: "Not Found"
#     }
# )
# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def get_pp_sample_details(request):

#     pp_sample_id = request.data.get("pp_sample_id")

#     if not pp_sample_id:
#         return Response(
#             {"error": "pp_sample_id is required"},
#             status=400
#         )

#     try:
#         pp_sample = PPSampleOrder.objects.select_related(
#             "created_by",
#             "updated_by"
#         ).get(id=pp_sample_id)
#     except PPSampleOrder.DoesNotExist:
#         return Response(
#             {"error": "Invalid pp_sample_id"},
#             status=404
#         )

#     response_data = {

#         "pp_sample_id": pp_sample.id,

#         "sample_sale_order_no": pp_sample.sample_sale_order_no,
#         "existing_customer": pp_sample.existing_customer,
#         "customer_name": pp_sample.customer_name,
#         "brand_name": pp_sample.brand_name,
#         "sale_order_number": pp_sample.sale_order_number,

#         "ppc_sample_requirement_date":
#             pp_sample.ppc_sample_requirement_date.strftime("%d-%m-%Y")
#             if pp_sample.ppc_sample_requirement_date else None,

#         "top_sample_requirement_date":
#             pp_sample.top_sample_requirement_date.strftime("%d-%m-%Y")
#             if pp_sample.top_sample_requirement_date else None,
            
#         "ppc_actual_requirement_date":
#             pp_sample.ppc_actual_requirement_date.strftime("%d-%m-%Y")
#             if pp_sample.ppc_actual_requirement_date else None,

#         "top_actual_requirement_date":
#             pp_sample.top_actual_requirement_date.strftime("%d-%m-%Y")
#             if pp_sample.top_actual_requirement_date else None,

#         "top_required": pp_sample.top_required,
#         "testing_required": pp_sample.testing_required,

#         "no_of_samples": pp_sample.no_of_samples,
#         "remarks": pp_sample.remarks,

#         "status": pp_sample.status,

#         "created_by":
#             pp_sample.created_by.username if pp_sample.created_by else None,

#         "updated_by":
#             pp_sample.updated_by.username if pp_sample.updated_by else None,

#         "created_on":
#             pp_sample.created_on.strftime("%d-%m-%Y %H:%M:%S")
#             if pp_sample.created_on else None,

#         "updated_on":
#             pp_sample.updated_on.strftime("%d-%m-%Y %H:%M:%S")
#             if pp_sample.updated_on else None,
#     }

#     return Response(response_data)



# ------------------------------------------------------------------
# API: TOP Required PP Samples
#
# Description:
#   Returns PP Sample Orders where TOP is required.
#
# Method: GET
# ------------------------------------------------------------------


# ------------------------------------------------------------------
# Swagger Schema: TOP Dashboard Response
# ------------------------------------------------------------------

pp_sample_list_response_schema = openapi.Schema(
    type=openapi.TYPE_ARRAY,
    items=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            "pp_sample_id": openapi.Schema(type=openapi.TYPE_INTEGER),
            "sample_sale_order_no": openapi.Schema(type=openapi.TYPE_STRING),
            "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
            "brand_name": openapi.Schema(type=openapi.TYPE_STRING),
            "no_of_samples": openapi.Schema(type=openapi.TYPE_INTEGER),
            "status": openapi.Schema(type=openapi.TYPE_STRING),
            "top_sample_requirement_date": openapi.Schema(type=openapi.TYPE_STRING),
        }
    )
)


@swagger_auto_schema(
    method="get",
    operation_summary="TOP Required PP Samples",
    responses={200: pp_sample_list_response_schema}
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_required_pp_samples(request):

    records = PPSampleOrder.objects.filter(
        top_required=True
    )

    data = []

    for r in records:
        data.append({
            "pp_sample_id": r.id,
            "sample_sale_order_no": r.sample_sale_order_no,
            "customer_name": r.customer_name,
            "brand_name": r.brand_name,
            "no_of_samples": r.no_of_samples,
            "status": r.status,
            "top_sample_requirement_date":
                r.top_sample_requirement_date.strftime("%d-%m-%Y")
                if r.top_sample_requirement_date else None,
        })

    return Response(data)



# ------------------------------------------------------------------
# API: Testing Required PP Samples
#
# Description:
#   Returns PP Sample Orders where testing is required.
#
# Method: GET
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="get",
    operation_summary="Testing Required PP Samples",
    responses={200: pp_sample_list_response_schema}
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def testing_required_pp_samples(request):

    records = PPSampleOrder.objects.filter(
        testing_required=True
    )

    data = []

    for r in records:
        data.append({
            "pp_sample_id": r.id,
            "sample_sale_order_no": r.sample_sale_order_no,
            "customer_name": r.customer_name,
            "brand_name": r.brand_name,
            "no_of_samples": r.no_of_samples,
            "status": r.status,
            "top_sample_requirement_date":
                r.top_sample_requirement_date.strftime("%d-%m-%Y")
                if r.top_sample_requirement_date else None,
        })

    return Response(data)


# ------------------------------------------------------------------
# API: Complete PP Sample (Testing Accept)
#
# Description:
#   Marks PP Sample Order as Completed.
#
# Method: POST
# ------------------------------------------------------------------


# ------------------------------------------------------------------
# Swagger Schema: Testing Accept Request
# ------------------------------------------------------------------

pp_sample_complete_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["pp_sample_id"],
    properties={
        "pp_sample_id": openapi.Schema(type=openapi.TYPE_INTEGER)
    }
)


@swagger_auto_schema(
    method="post",
    operation_summary="Complete PP Sample (Testing Accept)",
    request_body=pp_sample_complete_schema,
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "message": openapi.Schema(type=openapi.TYPE_STRING),
                "status": openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def complete_pp_sample(request):

    pp_sample_id = request.data.get("pp_sample_id")

    if not pp_sample_id:
        return Response({"error": "pp_sample_id is required"}, status=400)

    try:
        pp_sample = PPSampleOrder.objects.get(id=pp_sample_id)
    except PPSampleOrder.DoesNotExist:
        return Response({"error": "Invalid pp_sample_id"}, status=404)

    if pp_sample.status == "Completed":
        return Response({"error": "Already completed"}, status=400)

    pp_sample.status = "Completed"
    pp_sample.updated_by = request.user
    pp_sample.save()

    return Response({
        "message": "PP Sample marked as Completed",
        "status": pp_sample.status
    })
    
    
# ------------------------------------------------------------------
# Swagger Schema: PP Sample List Response
# ------------------------------------------------------------------

pp_sample_list_response_schema = openapi.Schema(
    type=openapi.TYPE_ARRAY,
    items=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={

            "pp_sample_id": openapi.Schema(type=openapi.TYPE_INTEGER),

            "sample_sale_order_no": openapi.Schema(type=openapi.TYPE_STRING),
            "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
            "brand_name": openapi.Schema(type=openapi.TYPE_STRING),

            "no_of_samples": openapi.Schema(type=openapi.TYPE_INTEGER),

            "top_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
            "testing_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

            "status": openapi.Schema(type=openapi.TYPE_STRING),

            "created_on": openapi.Schema(type=openapi.TYPE_STRING),
        }
    )
)


# ------------------------------------------------------------------
# API: PP Sample List
#
# Description:
#   Returns list of all PP Sample Orders.
#   Used for dashboard view.
#
# Method: GET
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="get",
    operation_summary="PP Sample List",
    operation_description="Returns list of PP Sample Orders",
    responses={200: pp_sample_list_response_schema}
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_pp_samples(request):

    records = PPSampleOrder.objects.all().order_by("-created_on")

    data = []

    for r in records:
        data.append({
            "pp_sample_id": r.id,
            "sample_sale_order_no": r.sample_sale_order_no,
            "customer_name": r.customer_name,
            "brand_name": r.brand_name,
            "no_of_samples": r.no_of_samples,
            "top_required": r.top_required,
            "testing_required": r.testing_required,
            "ppc_sample_requirement_date":
                r.ppc_sample_requirement_date.strftime("%d-%m-%Y")
                if r.ppc_sample_requirement_date else None,

            "top_sample_requirement_date":
                r.top_sample_requirement_date.strftime("%d-%m-%Y")
                if r.top_sample_requirement_date else None,
                
            "ppc_actual_requirement_date":
                r.ppc_actual_requirement_date.strftime("%d-%m-%Y")
                if r.ppc_actual_requirement_date else None,

            "top_actual_requirement_date":
                r.top_actual_requirement_date.strftime("%d-%m-%Y")
                if r.top_actual_requirement_date else None,

            "status": r.status,
            "created_on":
                r.created_on.strftime("%d-%m-%Y %H:%M:%S")
                if r.created_on else None,
        })

    return Response(data)