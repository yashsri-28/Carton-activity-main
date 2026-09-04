import logging
from decimal import Decimal

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from programs.services.carton_calculator import CartonCalculator
from activity_logs.utils import create_log
import os

logger = logging.getLogger(__name__)



from activity_logs.utils import create_log


from .models import (

    CartonProgram,
    ActivityProgramStatus,
    CartonProgramSubProgram,
    SampleProgram,
    CartonProgramAttachment,
    BedsheetProgramDetails,
    TerryTowelProgramDetails,
    BathRobeProgramDetails,
    GussetProgram,
    GussetProgramSpecification,
    BedsheetFreezingNoteRow,
    GussetSampleProgram,
    SampleProgramAttachment,
    GussetProgramAttachment,
    GussetSampleAttachment,
    SuperAdminDeleteLog,
    
)


from programs.services.notification_service import NotificationService


from django.utils import timezone as django_timezone
import pytz

def to_ist_str(dt):
    """Convert a UTC datetime to IST string, or return None."""
    if not dt:
        return None
    ist = pytz.timezone("Asia/Kolkata")
    return django_timezone.localtime(dt, ist).strftime("%d-%m-%Y %H:%M:%S")



from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi




def clean_kwargs(model, data: dict) -> dict:
    """
    Filters a dict down to only the keys that are actual fields
    on the given model, so stray/unexpected keys from the request
    don't blow up .objects.create() with a TypeError.
    """
    if not isinstance(data, dict):
        return {}

    valid_fields = {f.name for f in model._meta.get_fields()}

    return {
        key: value
        for key, value in data.items()
        if key in valid_fields
    }
def clean_int(value):
    """Convert '' or None to None, otherwise return the value as-is."""
    if value in (None, "", "null"):
        return None
    return value


def to_bool(value):
    """
    Converts frontend 'Yes'/'No' string into a proper Python boolean.
    Returns False if value is None or anything other than 'Yes'.
    """
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() == "yes"
# ------------------------------------------------------------------
# API: Submit Carton Program
# Description:
#   Creates a new Carton Program.
#
#   Supports Multiple Program Types:
#   - TOWEL (default)
#   - BEDSHEET
#   - TERRY_TOWEL
#   - BATH_ROBE
#
#   Creates:
#   - CartonProgram (common fields)
#   - Product Specific Details Model
#   - Sub Programs
#   - Sample Programs
#   - Activity Program Status
#
#   Sends Notifications based on workflow
# ------------------------------------------------------------------

bedsheet_details_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "fabric_tc": openapi.Schema(type=openapi.TYPE_STRING),
        "folding_details": openapi.Schema(type=openapi.TYPE_STRING),
        "required_pcs_per_polybag": openapi.Schema(type=openapi.TYPE_INTEGER),
        "polybag_size": openapi.Schema(type=openapi.TYPE_STRING),
        "product_type": openapi.Schema(type=openapi.TYPE_STRING),
        "special_packing_requirement": openapi.Schema(type=openapi.TYPE_STRING),
        "packing_type": openapi.Schema(type=openapi.TYPE_STRING),
        "product_dimension": openapi.Schema(type=openapi.TYPE_STRING),
        "fold_size": openapi.Schema(type=openapi.TYPE_STRING),
        "fold_length": openapi.Schema(type=openapi.TYPE_STRING),
        "fold_width": openapi.Schema(type=openapi.TYPE_STRING),
        "blister_packing_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "elastic_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "blister_packing_details": openapi.Schema(type=openapi.TYPE_STRING),
        "bag_type": openapi.Schema(type=openapi.TYPE_STRING),
        "special_box_required": openapi.Schema(type=openapi.TYPE_STRING),
        "required_sets_per_carton": openapi.Schema(type=openapi.TYPE_INTEGER),
        "polyfold_condition": openapi.Schema(type=openapi.TYPE_STRING),
        "filled_product_gsm": openapi.Schema(type=openapi.TYPE_NUMBER),
    }
)

terry_details_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "towel_sizes": openapi.Schema(type=openapi.TYPE_STRING),
        "required_pcs_carton_size": openapi.Schema(type=openapi.TYPE_STRING),
        "required_polybags_carton_size": openapi.Schema(type=openapi.TYPE_STRING),
        "towel_dimensions": openapi.Schema(type=openapi.TYPE_STRING),
        "towel_weight_per_piece": openapi.Schema(type=openapi.TYPE_NUMBER),
        "folding_details": openapi.Schema(type=openapi.TYPE_STRING),
        "required_pcs_per_polybag": openapi.Schema(type=openapi.TYPE_INTEGER),
        "special_carton_details": openapi.Schema(type=openapi.TYPE_STRING),
    }
)


bathrobe_details_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "original_bath_robe": openapi.Schema(type=openapi.TYPE_STRING),
        "bath_robe_sizes": openapi.Schema(type=openapi.TYPE_STRING),
        "bath_robe_dimensions": openapi.Schema(type=openapi.TYPE_STRING),
        "bath_robe_weight": openapi.Schema(type=openapi.TYPE_NUMBER),
        "folding_details": openapi.Schema(type=openapi.TYPE_STRING),
        "required_pcs_per_polybag": openapi.Schema(type=openapi.TYPE_INTEGER),
        "required_pcs_per_carton": openapi.Schema(type=openapi.TYPE_INTEGER),
        "polybag_type": openapi.Schema(type=openapi.TYPE_STRING),
        "polybag_size_carton": openapi.Schema(type=openapi.TYPE_STRING),
    }
)


carton_program_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={

        # --------------------------------------------------
        # BASIC DETAILS
        # --------------------------------------------------
        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
        "program_name": openapi.Schema(type=openapi.TYPE_STRING),
        "customer_protocol": openapi.Schema(type=openapi.TYPE_STRING),

        "confirm_new_or_shifted_from_vapi": openapi.Schema(
            type=openapi.TYPE_STRING
        ),

        "original_towel": openapi.Schema(type=openapi.TYPE_STRING),

        # --------------------------------------------------
        # POLYBAG
        # --------------------------------------------------
        "polybag_manual_or_automatic": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
        "polybag_type": openapi.Schema(type=openapi.TYPE_STRING),

        # --------------------------------------------------
        # BOOLEAN FLAGS
        # --------------------------------------------------
        "pallet_or_slipsheet_requirement": openapi.Schema(
            type=openapi.TYPE_BOOLEAN
        ),
        "special_carton_required": openapi.Schema(
            type=openapi.TYPE_BOOLEAN
        ),
        "pdq_required": openapi.Schema(
            type=openapi.TYPE_BOOLEAN
        ),
        "cdu_required": openapi.Schema(
            type=openapi.TYPE_BOOLEAN
        ),

        # --------------------------------------------------
        # SAMPLE ARRANGED
        # --------------------------------------------------
        "sample_carton_arranged": openapi.Schema(
            type=openapi.TYPE_BOOLEAN
        ),
        "pdq_arranged": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "cdu_arranged": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        # --------------------------------------------------
        # PDQ CONFIGURATION
        # --------------------------------------------------
        "shipped_as_single_pdq_or_monster_pdq": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
        "pdq_layers_stacking_details": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
        "common_pdq_same_dimension_for_all_sizes": openapi.Schema(
            type=openapi.TYPE_STRING
        ),

        # --------------------------------------------------
        # PALLET / STORE
        # --------------------------------------------------
        "small_pdq_on_pallet_or_slipsheet": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
        "small_pdq_count_on_pallet_or_slipsheet": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
        "warehouse_store_handling_method": openapi.Schema(
            type=openapi.TYPE_STRING
        ),

        # --------------------------------------------------
        # PACKING
        # --------------------------------------------------
        "towel_folded_and_poly_packed_before_carton": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
        "separator_protector_stiffener_required": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
        "ribbon_packing_required": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
        "belly_band_packing_required": openapi.Schema(
            type=openapi.TYPE_STRING
        ),
    }
)


subprogram_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={

        # --------------------------------------------------
        # BASIC DETAILS
        # --------------------------------------------------
        "program_name": openapi.Schema(type=openapi.TYPE_STRING),
        "style": openapi.Schema(type=openapi.TYPE_STRING),

        "width_in": openapi.Schema(type=openapi.TYPE_NUMBER),
        "length_in": openapi.Schema(type=openapi.TYPE_NUMBER),
        "width_cm": openapi.Schema(type=openapi.TYPE_NUMBER),
        "length_cm": openapi.Schema(type=openapi.TYPE_NUMBER),

        "wt_per_unit": openapi.Schema(type=openapi.TYPE_NUMBER),
        "gsm": openapi.Schema(type=openapi.TYPE_NUMBER),

        "unit_per_carton": openapi.Schema(type=openapi.TYPE_INTEGER),
        "inner_pack_unit_qty": openapi.Schema(type=openapi.TYPE_STRING),
        "fold": openapi.Schema(type=openapi.TYPE_STRING),

        # --------------------------------------------------
        # TQM CARTON FIELDS
        # --------------------------------------------------
        "carton_length": openapi.Schema(type=openapi.TYPE_NUMBER),
        "carton_width": openapi.Schema(type=openapi.TYPE_NUMBER),
        "carton_height": openapi.Schema(type=openapi.TYPE_NUMBER),

        "ribbon": openapi.Schema(type=openapi.TYPE_STRING),
        "belly_band": openapi.Schema(type=openapi.TYPE_STRING),
        "remark": openapi.Schema(type=openapi.TYPE_STRING),

        # --------------------------------------------------
        # PDQ FIELDS
        # --------------------------------------------------
        "pdq_length": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pdq_width": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pdq_height": openapi.Schema(type=openapi.TYPE_NUMBER),

        "net_wt_pdq": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pallet_wt_pdq": openapi.Schema(type=openapi.TYPE_NUMBER),

        # --------------------------------------------------
        # PALLET SIZE
        # --------------------------------------------------
        "pallet_length": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pallet_width": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pallet_height": openapi.Schema(type=openapi.TYPE_NUMBER),
        
        # --------------------------------------------------
        # PACKED PB SIZE
        # --------------------------------------------------
        "packed_pb_length": openapi.Schema(type=openapi.TYPE_NUMBER),
        "packed_pb_width": openapi.Schema(type=openapi.TYPE_NUMBER),
        "packed_pb_height": openapi.Schema(type=openapi.TYPE_NUMBER),

        # --------------------------------------------------
        # WAREHOUSE FIELDS
        # --------------------------------------------------
        "article_no": openapi.Schema(type=openapi.TYPE_STRING),
        "so_item_text": openapi.Schema(type=openapi.TYPE_STRING),
        "possible_ca": openapi.Schema(type=openapi.TYPE_INTEGER),
        "ship_qty": openapi.Schema(type=openapi.TYPE_INTEGER),
        "gross_wt_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
        "upc": openapi.Schema(type=openapi.TYPE_STRING),
        "final_destination": openapi.Schema(type=openapi.TYPE_STRING),
    }
)


sample_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "program_name": openapi.Schema(type=openapi.TYPE_STRING),
        "size": openapi.Schema(type=openapi.TYPE_STRING),
        "sample": openapi.Schema(type=openapi.TYPE_STRING),
        "quality": openapi.Schema(type=openapi.TYPE_STRING),
        "lbs_per_dz": openapi.Schema(type=openapi.TYPE_NUMBER),
        "gsm": openapi.Schema(type=openapi.TYPE_NUMBER),
        "shade": openapi.Schema(type=openapi.TYPE_STRING),
        "width_in": openapi.Schema(type=openapi.TYPE_NUMBER),
        "length_in": openapi.Schema(type=openapi.TYPE_NUMBER),
        "width_cm": openapi.Schema(type=openapi.TYPE_NUMBER),
        "length_cm": openapi.Schema(type=openapi.TYPE_NUMBER),
    }
)



submit_carton_program_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_name", "program_name"],
    properties={
        "activity_name": openapi.Schema(type=openapi.TYPE_STRING),
        "program_name": openapi.Schema(type=openapi.TYPE_STRING),

        "program_type": openapi.Schema(
            type=openapi.TYPE_STRING,
            enum=["TOWEL", "BEDSHEET", "TERRY_TOWEL", "BATH_ROBE"]
        ),

        "sent_to_user_id": openapi.Schema(type=openapi.TYPE_INTEGER),

        "btn": openapi.Schema(type=openapi.TYPE_STRING),

        "carton_program": carton_program_schema,

        "subprograms": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=subprogram_schema
        ),

        "samples": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=sample_schema
        ),

        "bedsheet_details": bedsheet_details_schema,
        "terry_details": terry_details_schema,
        "bathrobe_details": bathrobe_details_schema,
    }
)


@swagger_auto_schema(
    method="post",
    operation_summary="Submit Carton Program (All Product Types)",
    request_body=submit_carton_program_schema,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def submit_carton_program(request):
    data = request.data

    activity_name = data.get("activity_name")
    program_name = data.get("program_name")
    program_type = data.get("program_type", "TOWEL")
    sent_to_user_id = data.get("sent_to_user_id")
    btn = data.get("btn", "")

    if not activity_name:
        return Response({"error": "activity_name is required"}, status=400)
    if not program_name:
        return Response({"error": "program_name is required"}, status=400)

    valid_types = {"TOWEL", "BEDSHEET", "TERRY_TOWEL", "BATH_ROBE"}
    if program_type not in valid_types:
        return Response({"error": f"invalid program_type: {program_type}"}, status=400)

    carton_program_data = data.get("carton_program", {})
    subprograms = data.get("subprograms", [])
    samples = data.get("samples", [])

    # 1️⃣ MAIN CARTON PROGRAM
    carton_program = CartonProgram.objects.create(
        program_type=program_type,
        program_name=program_name,
        created_by=request.user,
        remark=carton_program_data.get("remark"),
        customer_name=carton_program_data.get("customer_name"),
        customer_protocol=carton_program_data.get("customer_protocol"),
        confirm_new_or_shifted_from_vapi=carton_program_data.get("confirm_new_or_shifted_from_vapi"),
        original_towel=carton_program_data.get("original_towel"),
        polybag_manual_or_automatic=carton_program_data.get("polybag_manual_or_automatic"),
        polybag_type=carton_program_data.get("polybag_type"),
        pallet_or_slipsheet_requirement=carton_program_data.get("pallet_or_slipsheet_requirement", False),
        special_carton_required=carton_program_data.get("special_carton_required", False),
        pdq_required=carton_program_data.get("pdq_required", False),
        cdu_required=carton_program_data.get("cdu_required", False),
        sample_arranged_for_special_carton=carton_program_data.get("sample_carton_arranged", False),
        sample_arranged_for_special_carton_pdq=carton_program_data.get("pdq_arranged", False),
        sample_arranged_for_special_carton_cdu=carton_program_data.get("cdu_arranged", False),
        shipped_as_single_pdq_or_monster_pdq=carton_program_data.get("shipped_as_single_pdq_or_monster_pdq"),
        pdq_layers_stacking_details=carton_program_data.get("pdq_layers_stacking_details"),
        common_pdq_same_dimension_for_all_sizes=carton_program_data.get("common_pdq_same_dimension_for_all_sizes"),
        small_pdq_on_pallet_or_slipsheet=carton_program_data.get("small_pdq_on_pallet_or_slipsheet"),
        small_pdq_count_on_pallet_or_slipsheet=carton_program_data.get("small_pdq_count_on_pallet_or_slipsheet"),
        warehouse_store_handling_method=carton_program_data.get("warehouse_store_handling_method"),
        towel_folded_and_poly_packed_before_carton=carton_program_data.get("towel_folded_and_poly_packed_before_carton"),
        separator_protector_stiffener_required=carton_program_data.get("separator_protector_stiffener_required"),
        ribbon_packing_required=carton_program_data.get("ribbon_packing_required"),
        belly_band_packing_required=carton_program_data.get("belly_band_packing_required"),
    )

    # 2️⃣ PRODUCT-SPECIFIC DETAILS
    if program_type == "BEDSHEET":
        BedsheetProgramDetails.objects.create(
            carton_program=carton_program,
            **clean_kwargs(BedsheetProgramDetails, data.get("bedsheet_details", {}))
        )
    elif program_type in ("TERRY_TOWEL", "TOWEL"):
        # Terry Towel fields are merged into the default Towel form,
        # so TOWEL programs also get a TerryTowelProgramDetails row.
        TerryTowelProgramDetails.objects.create(
            carton_program=carton_program,
            **clean_kwargs(TerryTowelProgramDetails, data.get("terry_details", {}))
        )
    elif program_type == "BATH_ROBE":
        BathRobeProgramDetails.objects.create(
            carton_program=carton_program,
            **clean_kwargs(BathRobeProgramDetails, data.get("bathrobe_details", {}))
        )

    # 3️⃣ ACTIVITY STATUS
    status_value = "Draft" if btn.lower() == "save as draft" else "Pending"
    ActivityProgramStatus.objects.create(
        activity=activity_name,
        program=carton_program,
        status=status_value,
        sent_to_id=sent_to_user_id,
        created_by=request.user
    )

    # 4️⃣ SUBPROGRAMS
    calc = CartonCalculator()
    for sp in subprograms:
        try:
            result = calc.compute(sp)
        except ValueError as e:
            return Response(
                {"error": f"{e} (program: {sp.get('program_name') or sp.get('style') or 'unnamed'})"},
                status=400
            )

        CartonProgramSubProgram.objects.create(
            carton_program=carton_program,
            program_name=sp.get("program_name"),
            style=sp.get("style"),
            width_in=sp.get("width_in"),
            length_in=sp.get("length_in"),
            gsm=sp.get("gsm"),
            wt_per_unit=result["weight"],
            unit_per_carton=sp.get("unit_per_carton"),
            inner_pack_unit_qty=sp.get("inner_pack_unit_qty"),
            fold=sp.get("fold"),
            pcs_per_set=sp.get("pcs_per_set"),
            remark=sp.get("remark"),
            folded_length=result["folded_length"],
            folded_width=result["folded_width"],
            carton_length=result["carton"]["length"],
            carton_width=result["carton"]["width"],
            carton_height=result["carton"]["height"],
        )

    # 5️⃣ SAMPLE PROGRAMS
    sample_ids = []
    for sm in samples:
        sample_obj = SampleProgram.objects.create(
            carton_program=carton_program,
            program_name=sm.get("program_name"),
            sample_code=sm.get("sample_code"),
            size=sm.get("size"),
            sample=sm.get("sample"),
            quality=sm.get("quality"),
            lbs_per_dz=sm.get("lbs_per_dz"),
            gsm=sm.get("gsm"),
            shade=sm.get("shade"),
            width_in=sm.get("width_in"),
            length_in=sm.get("length_in"),
            width_cm=sm.get("width_cm"),
            length_cm=sm.get("length_cm"),
        )
        sample_ids.append(sample_obj.id)

    # 5.5️⃣ FREEZING NOTE ROWS (Bedsheet only — Marketing fills at submit time)
    freezing_note_rows = data.get("freezing_note_rows", [])
    if program_type == "BEDSHEET":
        for fn in freezing_note_rows:
            BedsheetFreezingNoteRow.objects.create(
                carton_program=carton_program,
                sr_no=fn.get("sr_no"),
                buyer=fn.get("buyer"),
                tc=fn.get("tc"),
                program=fn.get("program"),
                date_of_carton_dimension_finalization=fn.get("date_of_carton_dimension_finalization") or None,
                product=fn.get("product"),
                size=fn.get("size"),
                product_dimension=fn.get("product_dimension"),
                pcs_per_bag_or_inner_box=fn.get("pcs_per_bag_or_inner_box"),
                bag_or_innerbox_per_carton=fn.get("bag_or_innerbox_per_carton"),
                pcs_per_carton=fn.get("pcs_per_carton"),
                carton_type_paper=fn.get("carton_type_paper"),
                carton_length_cm=fn.get("carton_length_cm"),
                carton_width_cm=fn.get("carton_width_cm"),
                carton_height_cm=fn.get("carton_height_cm"),
                net_weight_kgs=fn.get("net_weight_kgs"),
                gross_weight_kgs=fn.get("gross_weight_kgs"),
                carton_ply_no=fn.get("carton_ply_no"),
                carton_min_bursting_strength=fn.get("carton_min_bursting_strength"),
                carton_min_edge_crush_test=fn.get("carton_min_edge_crush_test"),
                stiffener_dimension=fn.get("stiffener_dimension"),
                stiffener_no_of_ply=fn.get("stiffener_no_of_ply"),
                stiffener_type_cut=fn.get("stiffener_type_cut"),
                side_stiffener_dimension=fn.get("side_stiffener_dimension"),
                side_stiffener_no_of_ply=fn.get("side_stiffener_no_of_ply"),
                side_stiffener_type_cut=fn.get("side_stiffener_type_cut"),
                separator_dimension=fn.get("separator_dimension"),
                separator_no_of_ply=fn.get("separator_no_of_ply"),
                bag_or_innerbox_size=fn.get("bag_or_innerbox_size"),
                bag_type_or_box_type=fn.get("bag_type_or_box_type"),
                ld_polybag_length_cm=fn.get("ld_polybag_length_cm"),
                ld_polybag_width_cm=fn.get("ld_polybag_width_cm"),
                ld_polybag_flap_cm=fn.get("ld_polybag_flap_cm"),
                ld_polybag_thickness_micron=fn.get("ld_polybag_thickness_micron"),
                ld_polybag_quality=fn.get("ld_polybag_quality"),
                printing_matter_polybag=fn.get("printing_matter_polybag"),
                product_position_in_carton=fn.get("product_position_in_carton"),
                folded_product_length=fn.get("folded_product_length"),
                folded_product_width=fn.get("folded_product_width"),
                folded_product_height=fn.get("folded_product_height"),
                bellyband_ribbon_dimension=fn.get("bellyband_ribbon_dimension"),
                bellyband_ribbon_quality=fn.get("bellyband_ribbon_quality"),
                macys_tmcl_placement=fn.get("macys_tmcl_placement"),
                macys_carton_type=fn.get("macys_carton_type"),
                macys_tmcl_placement_type=fn.get("macys_tmcl_placement_type"),
                pdq_accessories_others=fn.get("pdq_accessories_others"),
                remarks=fn.get("remarks"),
            )

    # 6️⃣ LOGGING
    create_log(
        module_name="Carton Program",
        record_id=carton_program.id,
        action="Created",
        message=f"{program_type} program created",
        user=request.user
    )

    # 7️⃣ NOTIFICATIONS (ek hi baar bheji ja rahi hain, duplicate hata diya)
    User = get_user_model()
    notification = NotificationService()

    try:
        notification.send_request_created(carton_program)
    except Exception:
        logger.exception("Failed to send creation notification for program %s", carton_program.id)

    if status_value != "Draft" and sent_to_user_id:
        try:
            assigned_user = User.objects.get(id=sent_to_user_id)
            notification.send_tqm_notification(carton_program)
        except User.DoesNotExist:
            logger.warning("sent_to_user_id %s not found for program %s", sent_to_user_id, carton_program.id)
        except Exception:
            logger.exception("Failed to send TQM notification for program %s", carton_program.id)

    # 8️⃣ RESPONSE
    return Response(
        {
            "message": "Carton Program Saved Successfully",
            "program_id": carton_program.id,
            "program_type": program_type,
            "sample_ids": sample_ids
        },
        status=201
    )

# def submit_carton_program(request):

#     data = request.data

#     activity_name = data.get("activity_name")
#     program_name = data.get("program_name")
#     program_type = data.get("program_type", "TOWEL")
#     sent_to_user_id = data.get("sent_to_user_id")
#     btn = data.get("btn", "")

#     if not activity_name:
#         return Response({"error": "activity_name is required"}, status=400)

#     if not program_name:
#         return Response({"error": "program_name is required"}, status=400)

#     carton_program_data = data.get("carton_program", {})
#     subprograms = data.get("subprograms", [])
#     samples = data.get("samples", [])

#     # --------------------------------------------------
#     # 1️⃣ CREATE MAIN CARTON PROGRAM
#     # --------------------------------------------------

#     carton_program = CartonProgram.objects.create(
#         program_type=program_type,
#         program_name=program_name,
#         created_by=request.user,

#         remark=carton_program_data.get("remark"),
#         customer_name=carton_program_data.get("customer_name"),
#         customer_protocol=carton_program_data.get("customer_protocol"),
#         confirm_new_or_shifted_from_vapi=carton_program_data.get("confirm_new_or_shifted_from_vapi"),
#         original_towel=carton_program_data.get("original_towel"),
#         size=carton_program_data.get("size"),

#         polybag_manual_or_automatic=carton_program_data.get("polybag_manual_or_automatic"),
#         polybag_type=carton_program_data.get("polybag_type"),

#         pallet_or_slipsheet_requirement=carton_program_data.get("pallet_or_slipsheet_requirement", False),
#         special_carton_required=carton_program_data.get("special_carton_required", False),
#         pdq_required=carton_program_data.get("pdq_required", False),
#         cdu_required=carton_program_data.get("cdu_required", False),

#         sample_arranged_for_special_carton=carton_program_data.get("sample_carton_arranged", False),
#         sample_arranged_for_special_carton_pdq=carton_program_data.get("pdq_arranged", False),
#         sample_arranged_for_special_carton_cdu=carton_program_data.get("cdu_arranged", False),

#         shipped_as_single_pdq_or_monster_pdq=carton_program_data.get("shipped_as_single_pdq_or_monster_pdq"),
#         pdq_layers_stacking_details=carton_program_data.get("pdq_layers_stacking_details"),
#         common_pdq_same_dimension_for_all_sizes=carton_program_data.get("common_pdq_same_dimension_for_all_sizes"),

#         small_pdq_on_pallet_or_slipsheet=carton_program_data.get("small_pdq_on_pallet_or_slipsheet"),
#         small_pdq_count_on_pallet_or_slipsheet=carton_program_data.get("small_pdq_count_on_pallet_or_slipsheet"),
#         warehouse_store_handling_method=carton_program_data.get("warehouse_store_handling_method"),

#         towel_folded_and_poly_packed_before_carton=carton_program_data.get("towel_folded_and_poly_packed_before_carton"),
#         separator_protector_stiffener_required=carton_program_data.get("separator_protector_stiffener_required"),
#         ribbon_packing_required=carton_program_data.get("ribbon_packing_required"),
#         belly_band_packing_required=carton_program_data.get("belly_band_packing_required"),
#     )

#     # --------------------------------------------------
#     # 2️⃣ PRODUCT-SPECIFIC DETAILS
#     # --------------------------------------------------

#     if program_type == "BEDSHEET":
#         BedsheetProgramDetails.objects.create(
#             carton_program=carton_program,
#             **data.get("bedsheet_details", {})
#         )

#     elif program_type == "TERRY_TOWEL":
#         terry_data = data.get("terry_details", {}).copy()
#         terry_data.pop("remark", None)
#         TerryTowelProgramDetails.objects.create(
#             carton_program=carton_program,
#             **terry_data
#         )


#     elif program_type == "BATH_ROBE":
#         bathrobe_data = data.get("bathrobe_details", {}).copy()
#         bathrobe_data.pop("remark", None)
#         BathRobeProgramDetails.objects.create(
#             carton_program=carton_program,
#             **bathrobe_data
#         )

#     # --------------------------------------------------
#     # 3️⃣ CREATE ACTIVITY STATUS
#     # --------------------------------------------------

#     status_value = "Draft" if btn.lower() == "save as draft" else "Pending"

#     ActivityProgramStatus.objects.create(
#         activity=activity_name,
#         program=carton_program,
#         status=status_value,
#         sent_to_id=sent_to_user_id,
#         created_by=request.user
#     )

#     # --------------------------------------------------
#     # 4️⃣ CREATE SUBPROGRAMS (Explicit Mapping - Safe)
#     # --------------------------------------------------

#     for sp in subprograms:
#         CartonProgramSubProgram.objects.create(
#             carton_program=carton_program,
#             program_name=sp.get("program_name"),
#             style=sp.get("style"),
#             width_in=sp.get("width_in"),
#             length_in=sp.get("length_in"),
#             width_cm=sp.get("width_cm"),
#             length_cm=sp.get("length_cm"),
#             wt_per_unit=sp.get("wt_per_unit"),
#             gsm=sp.get("gsm"),
#             unit_per_carton=sp.get("unit_per_carton"),
#             inner_pack_unit_qty=sp.get("inner_pack_unit_qty"),
#             fold=sp.get("fold"),
#             pcs_per_set=sp.get("pcs_per_set"),
#             remark=sp.get("remark")
#         )

#     # --------------------------------------------------
#     # 5️⃣ CREATE SAMPLE PROGRAMS
#     # --------------------------------------------------

#     for sm in samples:
#         SampleProgram.objects.create(
#             carton_program=carton_program,
#             program_name=sm.get("program_name"),
#             size=sm.get("size"),
#             sample=sm.get("sample"),
#             quality=sm.get("quality"),
#             lbs_per_dz=sm.get("lbs_per_dz"),
#             gsm=sm.get("gsm"),
#             shade=sm.get("shade"),
#             width_in=sm.get("width_in"),
#             length_in=sm.get("length_in"),
#             width_cm=sm.get("width_cm"),
#             length_cm=sm.get("length_cm"),
#         )
        
        
#     User = get_user_model()

#     notification = NotificationService()

#     # Send confirmation to creator (Marketing)
#     try:
#         notification.send_request_created(carton_program)
#     except Exception as e:
#         print("Email failed:", str(e))
    
#     # If not draft → send to assigned user
#     if status_value != "Draft" and sent_to_user_id:
#         try:
#             assigned_user = User.objects.get(id=sent_to_user_id)
#             notification.send_tqm_notification(carton_program)
#         except User.DoesNotExist:
#             pass


#     # --------------------------------------------------
#     # 6️⃣ LOGGING
#     # --------------------------------------------------

#     create_log(
#         module_name="Carton Program",
#         record_id=carton_program.id,
#         action="Created",
#         message=f"{program_type} program created",
#         user=request.user
#     )

#     # --------------------------------------------------
#     # 7️⃣ NOTIFICATIONS (Your Original Logic Restored)
#     # --------------------------------------------------

#     User = get_user_model()
#     notification = NotificationService()

#     # Send confirmation to creator
#     try:
#         notification.send_request_created(carton_program)
#     except Exception as e:
#         print("Email failed:", str(e))

#     # Send to assigned user if not draft
#     if status_value != "Draft" and sent_to_user_id:
#         try:
#             assigned_user = User.objects.get(id=sent_to_user_id)
#             notification.send_tqm_notification(carton_program)
#         except User.DoesNotExist:
#             pass

#     # --------------------------------------------------
#     # 8️⃣ FINAL RESPONSE
#     # --------------------------------------------------

#     return Response(
#         {
#             "message": "Carton Program Saved Successfully",
#             "program_id": carton_program.id,
#             "program_type": program_type
#         },
#         status=201
#     )





# ------------------------------------------------------------------
# API: Get Activity Program Status List
# Description:
#   Returns all activity-program status records along with:
#   - Activity name
#   - Program ID
#   - Program Name
#   - Customer Name
#   - Status
#   - Created On (DD-MM-YYYY)
#   - Last Action Date (DD-MM-YYYY)
# ------------------------------------------------------------------


activity_status_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "activity": openapi.Schema(type=openapi.TYPE_STRING),
        "program_id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "program_name": openapi.Schema(type=openapi.TYPE_STRING),
        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
        "status": openapi.Schema(type=openapi.TYPE_STRING),
        "created_date": openapi.Schema(type=openapi.TYPE_STRING),
        "last_action_date": openapi.Schema(type=openapi.TYPE_STRING),
    }
)


@swagger_auto_schema(
    method="get",
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=activity_status_response_schema
        )
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_activity_program_status_list(request):
    """
    Fetch all activity-program status records (covers both CartonProgram
    and GussetProgram rows, since ActivityProgramStatus can point to either)
    """

    records = ActivityProgramStatus.objects.select_related(
        "program", "gusset_program"
    ).filter(created_by=request.user)

    response_data = []

    for obj in records:
        # Skip corrupted rows that point to neither type
        if not obj.program_id and not obj.gusset_program_id:
            continue

        response_data.append({
            "id": obj.id,
            "activity": obj.activity,

            "program_id": obj.gusset_program_id or obj.program_id,
            "program_name": obj.program_name,
            "customer_name": obj.customer_name,
            "program_type_group": obj.program_type_group,

            "status": obj.status,

            "created_date": obj.created_on.strftime("%d-%m-%Y %H:%M:%S")
            if obj.created_on else None,

            "last_action_date": obj.updated_on.strftime("%d-%m-%Y %H:%M:%S")
            if obj.updated_on else None,

            "rejection_reason": obj.rejection_reason

        })

    return Response(response_data)






# ------------------------------------------------------------------
# API: Copy Carton Program
# Description:
#   Creates a duplicate of an existing Carton Program along with:
#   - Sub Programs
#   - Sample Programs
#   - Activity Program Status
#
#   All new records will have NEW IDs.
#   Status of copied Activity Program will always be "Draft".
#
# Input:
#   activity_program_status_id
#
# Output:
#   new_program_id
#   new_activity_status_id
# ------------------------------------------------------------------

copy_carton_program_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={
        "activity_program_status_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="ActivityProgramStatus ID to copy"
        )
    }
)


copy_carton_program_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "message": openapi.Schema(type=openapi.TYPE_STRING),
        "new_program_id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "new_activity_status_id": openapi.Schema(type=openapi.TYPE_INTEGER),
    }
)


@swagger_auto_schema(
    method="post",
    operation_summary="Copy Carton Program",
    operation_description="""
    Creates a duplicate of an existing carton program.

    Copies:
    - Program-level boolean fields
    - Subprograms
    - Sample programs

    Notes:
    - New program is always created in Draft status
    - New IDs are generated
    """,
    request_body=copy_carton_program_schema,
    responses={
        201: copy_carton_program_response_schema,
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def copy_carton_program(request):

    aps_id = request.data.get("activity_program_status_id")

    if not aps_id:
        return Response(
            {"error": "activity_program_status_id is required"},
            status=400
        )

    try:
        old_aps = ActivityProgramStatus.objects.select_related(
            "program"
        ).get(id=aps_id)
    except ActivityProgramStatus.DoesNotExist:
        return Response(
            {"error": "Invalid activity_program_status_id"},
            status=404
        )

    old_program = old_aps.program

    # --------------------------------------------------
    # 1. CREATE NEW CARTON PROGRAM (UPDATED FIELDS)
    # --------------------------------------------------

    new_program = CartonProgram.objects.create(

        program_name=f"{old_program.program_name}_COPY",
        customer_name=old_program.customer_name,
        customer_protocol=old_program.customer_protocol,

        confirm_new_or_shifted_from_vapi=old_program.confirm_new_or_shifted_from_vapi,
        original_towel=old_program.original_towel,

        polybag_manual_or_automatic=old_program.polybag_manual_or_automatic,
        polybag_type=old_program.polybag_type,

        # -------- BOOLEAN FIELDS --------
        pallet_or_slipsheet_requirement=old_program.pallet_or_slipsheet_requirement,

        special_carton_required=old_program.special_carton_required,
        pdq_required=old_program.pdq_required,
        cdu_required=old_program.cdu_required,

        sample_arranged_for_special_carton=old_program.sample_arranged_for_special_carton,
        sample_arranged_for_special_carton_pdq=old_program.sample_arranged_for_special_carton_pdq,
        sample_arranged_for_special_carton_cdu=old_program.sample_arranged_for_special_carton_cdu,

        # -------- REMAINING FIELDS --------
        shipped_as_single_pdq_or_monster_pdq=old_program.shipped_as_single_pdq_or_monster_pdq,
        pdq_layers_stacking_details=old_program.pdq_layers_stacking_details,
        common_pdq_same_dimension_for_all_sizes=old_program.common_pdq_same_dimension_for_all_sizes,
        small_pdq_on_pallet_or_slipsheet=old_program.small_pdq_on_pallet_or_slipsheet,
        small_pdq_count_on_pallet_or_slipsheet=old_program.small_pdq_count_on_pallet_or_slipsheet,
        warehouse_store_handling_method=old_program.warehouse_store_handling_method,
        towel_folded_and_poly_packed_before_carton=old_program.towel_folded_and_poly_packed_before_carton,
        separator_protector_stiffener_required=old_program.separator_protector_stiffener_required,
        ribbon_packing_required=old_program.ribbon_packing_required,
        belly_band_packing_required=old_program.belly_band_packing_required,

        created_by=request.user
    )

    # --------------------------------------------------
    # 2. COPY SUBPROGRAMS
    # --------------------------------------------------

    for sp in CartonProgramSubProgram.objects.filter(carton_program=old_program):
        CartonProgramSubProgram.objects.create(
            carton_program=new_program,
            program_name=sp.program_name,
            style=sp.style,
            width_in=sp.width_in,
            length_in=sp.length_in,
            wt_per_unit=sp.wt_per_unit,
            gsm=sp.gsm,
            unit_per_carton=sp.unit_per_carton,
            inner_pack_unit_qty=sp.inner_pack_unit_qty,
            fold=sp.fold,
        )

    # --------------------------------------------------
    # 3. COPY SAMPLE PROGRAMS
    # --------------------------------------------------

    for sm in SampleProgram.objects.filter(carton_program=old_program):
        SampleProgram.objects.create(
            carton_program=new_program,
            program_name=sm.program_name,
            size=sm.size,
            sample=sm.sample,
            quality=sm.quality,
            lbs_per_dz=sm.lbs_per_dz,
            gsm=sm.gsm,
            shade=sm.shade,
            width_in=sm.width_in,
            length_in=sm.length_in
        )

    # --------------------------------------------------
    # 4. CREATE NEW ACTIVITY STATUS (DRAFT)
    # --------------------------------------------------

    new_aps = ActivityProgramStatus.objects.create(
        activity=old_aps.activity,
        program=new_program,
        status="Draft",
        sent_to=old_aps.sent_to,
        created_by=request.user
    )

    # --------------------------------------------------
    # 5. LOG
    # --------------------------------------------------

    create_log(
        module_name="Carton Program",
        record_id=new_program.id,
        action="Copied",
        message=f"Program {old_program.program_name} copied to {new_program.program_name}",
        user=request.user
    )

    return Response(
        {
            "message": "Program copied successfully",
            "new_program_id": new_program.id,
            "new_activity_status_id": new_aps.id
        },
        status=201
    )


# ------------------------------------------------------------------
# API: Recall Activity Program
# Description:
#   Resets the status of an Activity Program to "Draft".
#   Used when user clicks Recall button.
#
# Input:
#   activity_program_status_id
#
# Output:
#   Success message
# ------------------------------------------------------------------



recall_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={
        "activity_program_status_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="ID of Activity Program Status record"
        )
    }
)



@swagger_auto_schema(
    method="post",
    operation_summary="This API should be called on Recall button",
    operation_description="Sets activity program status back to Draft",
    request_body=recall_schema,
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "message": openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recall(request):

    aps_id = request.data.get("activity_program_status_id")

    if not aps_id:
        return Response(
            {"error": "activity_program_status_id is required"},
            status=400
        )

    try:
        aps = ActivityProgramStatus.objects.get(id=aps_id)
    except ActivityProgramStatus.DoesNotExist:
        return Response(
            {"error": "Invalid activity_program_status_id"},
            status=404
        )

    aps.status = "Draft"
    aps.save()

    create_log(
        module_name="Activity Status",
        record_id=aps.id,
        action="Recalled",
        message=f"Status reset to Draft for program {aps.program.program_name}",
        user=request.user
    )

    return Response(
        {"message": "Status changed to Draft"},
        status=200
    )


# ------------------------------------------------------------------
# API: Edit Carton Program
# ------------------------------------------------------------------
# Description:
#   Updates an existing Carton Program including:
#
#   - Common Carton Program fields
#   - Product-specific details (based on program_type)
#   - Sub Programs (replaced)
#   - Sample Programs (replaced)
#   - Activity Status (optional update)
#
#   Supports:
#   - TOWEL
#   - BEDSHEET
#   - TERRY_TOWEL
#   - BATH_ROBE
#
#   If program_type changes:
#   - Old product-specific model is deleted
#   - New product-specific model is created
# ------------------------------------------------------------------

edit_carton_program_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={

        "activity_program_status_id": openapi.Schema(type=openapi.TYPE_INTEGER),

        "program_type": openapi.Schema(
            type=openapi.TYPE_STRING,
            enum=["TOWEL", "BEDSHEET", "TERRY_TOWEL", "BATH_ROBE"]
        ),

        "btn": openapi.Schema(type=openapi.TYPE_STRING),
        "sent_to_user_id": openapi.Schema(type=openapi.TYPE_INTEGER),

        "carton_program": carton_program_schema,

        "subprograms": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=subprogram_schema
        ),

        "samples": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=sample_schema
        ),

        "bedsheet_details": bedsheet_details_schema,
        "terry_details": terry_details_schema,
        "bathrobe_details": bathrobe_details_schema,
    }
)


edit_carton_program_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "message": openapi.Schema(type=openapi.TYPE_STRING)
    }
)


@swagger_auto_schema(
    method="post",
    operation_summary="Edit Carton Program (All Product Types)",
    request_body=edit_carton_program_schema,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def edit_carton_program(request):

    data = request.data
    aps_id = data.get("activity_program_status_id")

    if not aps_id:
        return Response(
            {"error": "activity_program_status_id is required"},
            status=400
        )

    try:
        aps = ActivityProgramStatus.objects.select_related(
            "program"
        ).get(id=aps_id)
    except ActivityProgramStatus.DoesNotExist:
        return Response(
            {"error": "Invalid activity_program_status_id"},
            status=404
        )

    program = aps.program
    old_program_type = program.program_type
    new_program_type = data.get("program_type", old_program_type)

    carton_program_data = data.get("carton_program", {})
    subprograms = data.get("subprograms", [])
    samples = data.get("samples", [])

    # --------------------------------------------------
    # 1️⃣ UPDATE COMMON PROGRAM FIELDS
    # --------------------------------------------------

    program.program_type = new_program_type
    program.customer_name = carton_program_data.get("customer_name")
    program.customer_protocol = carton_program_data.get("customer_protocol")
    program.confirm_new_or_shifted_from_vapi = carton_program_data.get("confirm_new_or_shifted_from_vapi")
    program.original_towel = carton_program_data.get("original_towel")
    program.size = carton_program_data.get("size")
    program.polybag_manual_or_automatic = carton_program_data.get("polybag_manual_or_automatic")
    program.polybag_type = carton_program_data.get("polybag_type")

    program.pallet_or_slipsheet_requirement = carton_program_data.get("pallet_or_slipsheet_requirement")
    program.special_carton_required = carton_program_data.get("special_carton_required")
    program.pdq_required = carton_program_data.get("pdq_required")
    program.cdu_required = carton_program_data.get("cdu_required")

    program.sample_arranged_for_special_carton = carton_program_data.get("sample_carton_arranged")
    program.sample_arranged_for_special_carton_pdq = carton_program_data.get("pdq_arranged")
    program.sample_arranged_for_special_carton_cdu = carton_program_data.get("cdu_arranged")

    program.shipped_as_single_pdq_or_monster_pdq = carton_program_data.get("shipped_as_single_pdq_or_monster_pdq")
    program.pdq_layers_stacking_details = carton_program_data.get("pdq_layers_stacking_details")
    program.common_pdq_same_dimension_for_all_sizes = carton_program_data.get("common_pdq_same_dimension_for_all_sizes")

    program.small_pdq_on_pallet_or_slipsheet = carton_program_data.get("small_pdq_on_pallet_or_slipsheet")
    program.small_pdq_count_on_pallet_or_slipsheet = carton_program_data.get("small_pdq_count_on_pallet_or_slipsheet")
    program.warehouse_store_handling_method = carton_program_data.get("warehouse_store_handling_method")

    program.towel_folded_and_poly_packed_before_carton = carton_program_data.get("towel_folded_and_poly_packed_before_carton")
    program.separator_protector_stiffener_required = carton_program_data.get("separator_protector_stiffener_required")
    program.ribbon_packing_required = carton_program_data.get("ribbon_packing_required")
    program.belly_band_packing_required = carton_program_data.get("belly_band_packing_required")
    program.remark = carton_program_data.get("remark")   # NEW: save updated remark on edit

    program.updated_by = request.user
    program.save()

    # --------------------------------------------------
    # 2️⃣ HANDLE PRODUCT-SPECIFIC MODEL
    # --------------------------------------------------

    # If type changed → delete old detail model
    if old_program_type != new_program_type:

        if old_program_type == "BEDSHEET":
            BedsheetProgramDetails.objects.filter(carton_program=program).delete()

        elif old_program_type in ("TERRY_TOWEL", "TOWEL"):
            TerryTowelProgramDetails.objects.filter(carton_program=program).delete()

        elif old_program_type == "BATH_ROBE":
            BathRobeProgramDetails.objects.filter(carton_program=program).delete()

    # Update or Create new detail model

    if new_program_type == "BEDSHEET":

        details, created = BedsheetProgramDetails.objects.get_or_create(
            carton_program=program
        )

        bd = data.get("bedsheet_details", {})

        details.fabric_tc = bd.get("fabric_tc")
        details.folding_details = bd.get("folding_details")
        details.required_pcs_per_polybag = bd.get("required_pcs_per_polybag")
        details.polybag_size = bd.get("polybag_size")
        details.product_type = bd.get("product_type")
        details.special_packing_requirement = bd.get("special_packing_requirement")
        details.packing_type = bd.get("packing_type")
        details.product_dimension = bd.get("product_dimension")
        details.fold_size = bd.get("fold_size")
        details.fold_length = bd.get("fold_length")
        details.fold_width = bd.get("fold_width")
        details.blister_packing_required = bd.get("blister_packing_required")
        details.blister_packing_details = bd.get("blister_packing_details")
        details.bag_type = bd.get("bag_type")
        details.special_box_required = bd.get("special_box_required")
        details.required_sets_per_carton = bd.get("required_sets_per_carton")
        details.polyfold_condition = bd.get("polyfold_condition")
        details.filled_product_gsm = bd.get("filled_product_gsm")
        details.elastic_required = bd.get("elastic_required", False) 

        details.save()

    elif new_program_type in ("TERRY_TOWEL", "TOWEL"):

        details, created = TerryTowelProgramDetails.objects.get_or_create(
            carton_program=program
        )

        td = data.get("terry_details", {})

        details.towel_sizes = td.get("towel_sizes")
        details.required_pcs_carton_size = td.get("required_pcs_carton_size")
        details.required_polybags_carton_size = td.get("required_polybags_carton_size")
        details.towel_dimensions = td.get("towel_dimensions")
        details.towel_weight_per_piece = td.get("towel_weight_per_piece")
        details.folding_details = td.get("folding_details")
        details.required_pcs_per_polybag = td.get("required_pcs_per_polybag")
        details.special_carton_details = td.get("special_carton_details")

        details.save()

    elif new_program_type == "BATH_ROBE":

        details, created = BathRobeProgramDetails.objects.get_or_create(
            carton_program=program
        )

        br = data.get("bathrobe_details", {})

        details.original_bath_robe = br.get("original_bath_robe")
        details.bath_robe_sizes = br.get("bath_robe_sizes")
        details.bath_robe_dimensions = br.get("bath_robe_dimensions")
        details.bath_robe_weight = br.get("bath_robe_weight")
        details.folding_details = br.get("folding_details")
        details.required_pcs_per_polybag = br.get("required_pcs_per_polybag")
        details.required_pcs_per_carton = br.get("required_pcs_per_carton")
        details.polybag_type = br.get("polybag_type")
        details.polybag_size_carton = br.get("polybag_size_carton")

        details.save()

    # --------------------------------------------------
    # 3️⃣ UPDATE ACTIVITY STATUS (OPTIONAL)
    # --------------------------------------------------

    new_status = data.get("btn")
    new_sent_to = data.get("sent_to_user_id")

    if new_status:
        aps.status = new_status

    if new_sent_to:
        aps.sent_to_id = new_sent_to

    aps.save()

    # --------------------------------------------------
    # 4️⃣ REPLACE SUBPROGRAMS
    # --------------------------------------------------

    CartonProgramSubProgram.objects.filter(
        carton_program=program
    ).delete()

    for sp in subprograms:
        CartonProgramSubProgram.objects.create(
            carton_program=program,
            program_name=sp.get("program_name"),
            style=sp.get("style"),
            width_in=sp.get("width_in"),
            length_in=sp.get("length_in"),
            width_cm=sp.get("width_cm"),
            length_cm=sp.get("length_cm"),
            wt_per_unit=sp.get("wt_per_unit"),
            gsm=sp.get("gsm"),
            unit_per_carton=sp.get("unit_per_carton"),
            inner_pack_unit_qty=sp.get("inner_pack_unit_qty"),
            fold=sp.get("fold"),
        )

    # --------------------------------------------------
    # 5️⃣ REPLACE SAMPLE PROGRAMS
    # --------------------------------------------------

    SampleProgram.objects.filter(
        carton_program=program
    ).delete()

    for sm in samples:
        SampleProgram.objects.create(
            carton_program=program,
            program_name=sm.get("program_name"),
            size=sm.get("size"),
            sample=sm.get("sample"),
            quality=sm.get("quality"),
            lbs_per_dz=sm.get("lbs_per_dz"),
            gsm=sm.get("gsm"),
            shade=sm.get("shade"),
            width_in=sm.get("width_in"),
            length_in=sm.get("length_in"),
            width_cm=sm.get("width_cm"),
            length_cm=sm.get("length_cm"),
        )

    # --------------------------------------------------
    # 5.5️⃣ REPLACE FREEZING NOTE ROWS (Bedsheet only, Marketing-editable)
    # --------------------------------------------------

    freezing_note_rows = data.get("freezing_note_rows", [])

    if new_program_type == "BEDSHEET":
        BedsheetFreezingNoteRow.objects.filter(carton_program=program).delete()

        for fn in freezing_note_rows:
            BedsheetFreezingNoteRow.objects.create(
                carton_program=program,
                sr_no=fn.get("sr_no"),
                buyer=fn.get("buyer"),
                tc=fn.get("tc"),
                program=fn.get("program"),
                date_of_carton_dimension_finalization=fn.get("date_of_carton_dimension_finalization") or None,
                product=fn.get("product"),
                size=fn.get("size"),
                product_dimension=fn.get("product_dimension"),
                pcs_per_bag_or_inner_box=fn.get("pcs_per_bag_or_inner_box"),
                bag_or_innerbox_per_carton=fn.get("bag_or_innerbox_per_carton"),
                pcs_per_carton=fn.get("pcs_per_carton"),
                carton_type_paper=fn.get("carton_type_paper"),
                carton_length_cm=fn.get("carton_length_cm"),
                carton_width_cm=fn.get("carton_width_cm"),
                carton_height_cm=fn.get("carton_height_cm"),
                net_weight_kgs=fn.get("net_weight_kgs"),
                gross_weight_kgs=fn.get("gross_weight_kgs"),
                carton_ply_no=fn.get("carton_ply_no"),
                carton_min_bursting_strength=fn.get("carton_min_bursting_strength"),
                carton_min_edge_crush_test=fn.get("carton_min_edge_crush_test"),
                stiffener_dimension=fn.get("stiffener_dimension"),
                stiffener_no_of_ply=fn.get("stiffener_no_of_ply"),
                stiffener_type_cut=fn.get("stiffener_type_cut"),
                side_stiffener_dimension=fn.get("side_stiffener_dimension"),
                side_stiffener_no_of_ply=fn.get("side_stiffener_no_of_ply"),
                side_stiffener_type_cut=fn.get("side_stiffener_type_cut"),
                separator_dimension=fn.get("separator_dimension"),
                separator_no_of_ply=fn.get("separator_no_of_ply"),
                bag_or_innerbox_size=fn.get("bag_or_innerbox_size"),
                bag_type_or_box_type=fn.get("bag_type_or_box_type"),
                ld_polybag_length_cm=fn.get("ld_polybag_length_cm"),
                ld_polybag_width_cm=fn.get("ld_polybag_width_cm"),
                ld_polybag_flap_cm=fn.get("ld_polybag_flap_cm"),
                ld_polybag_thickness_micron=fn.get("ld_polybag_thickness_micron"),
                ld_polybag_quality=fn.get("ld_polybag_quality"),
                printing_matter_polybag=fn.get("printing_matter_polybag"),
                product_position_in_carton=fn.get("product_position_in_carton"),
                folded_product_length=fn.get("folded_product_length"),
                folded_product_width=fn.get("folded_product_width"),
                folded_product_height=fn.get("folded_product_height"),
                bellyband_ribbon_dimension=fn.get("bellyband_ribbon_dimension"),
                bellyband_ribbon_quality=fn.get("bellyband_ribbon_quality"),
                macys_tmcl_placement=fn.get("macys_tmcl_placement"),
                macys_carton_type=fn.get("macys_carton_type"),
                macys_tmcl_placement_type=fn.get("macys_tmcl_placement_type"),
                pdq_accessories_others=fn.get("pdq_accessories_others"),
                remarks=fn.get("remarks"),
            )
    elif old_program_type == "BEDSHEET" and new_program_type != "BEDSHEET":
        # Type changed away from Bedsheet — freezing note no longer applies
        BedsheetFreezingNoteRow.objects.filter(carton_program=program).delete()

    create_log(
        module_name="Carton Program",
        record_id=program.id,
        action="Updated",
        message=f"Program updated (Type: {new_program_type})",
        user=request.user
    )

    return Response(
        {"message": "Carton Program Updated Successfully"},
        status=200
    )




# ------------------------------------------------------------------
# API: Get Carton Program Full Details
# ------------------------------------------------------------------
# Description:
#   Returns complete data of a Carton Program including:
#
#   - Activity details
#   - Common Carton Program fields
#   - Product-specific details (based on program_type)
#   - Sub Programs
#   - Sample Programs
#   - Attachments
#
#   Supports:
#   - TOWEL
#   - BEDSHEET
#   - TERRY_TOWEL
#   - BATH_ROBE
#
#   Dynamically includes product-specific model data.
# ------------------------------------------------------------------


get_carton_program_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={
        "activity_program_status_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="ActivityProgramStatus ID"
        )
    }
)
get_carton_program_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "activity": openapi.Schema(type=openapi.TYPE_STRING),
        "status": openapi.Schema(type=openapi.TYPE_STRING),
        "program_type": openapi.Schema(type=openapi.TYPE_STRING),
        "sent_to_user_id": openapi.Schema(type=openapi.TYPE_INTEGER),

        "carton_program": openapi.Schema(type=openapi.TYPE_OBJECT),

        "bedsheet_details": openapi.Schema(type=openapi.TYPE_OBJECT),
        "terry_details": openapi.Schema(type=openapi.TYPE_OBJECT),
        "bathrobe_details": openapi.Schema(type=openapi.TYPE_OBJECT),

        "subprograms": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT)
        ),

        "samples": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT)
        ),

        "attachments": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT)
        ),
    }
)

@swagger_auto_schema(
    method="post",
    operation_summary="Get Carton Program Full Details",
    request_body=get_carton_program_schema,
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_carton_program_details(request):

    aps_id = request.data.get("activity_program_status_id")

    if not aps_id:
        return Response(
            {"error": "activity_program_status_id is required"},
            status=400
        )

    try:
        aps = ActivityProgramStatus.objects.select_related(
            "program"
        ).get(id=aps_id)
    except ActivityProgramStatus.DoesNotExist:
        return Response(
            {"error": "Invalid activity_program_status_id"},
            status=404
        )

    program = aps.program
    program_type = program.program_type
    

    # --------------------------------------------------
    # PRODUCT SPECIFIC DETAILS
    # --------------------------------------------------

    bedsheet_details = None
    terry_details = None
    bathrobe_details = None

    if program_type == "BEDSHEET":
        try:
            bd = program.bedsheet_details
            bedsheet_details = {
                "fabric_tc": bd.fabric_tc,
                "folding_details": bd.folding_details,
                "required_pcs_per_polybag": bd.required_pcs_per_polybag,
                "polybag_size": bd.polybag_size,
                "product_type": bd.product_type,
                "special_packing_requirement": bd.special_packing_requirement,
                "packing_type": bd.packing_type,
                "product_dimension": bd.product_dimension,
                "fold_size": bd.fold_size,
                "fold_length": bd.fold_length,
                "fold_width": bd.fold_width,
                "blister_packing_required": bd.blister_packing_required,
                "blister_packing_details": bd.blister_packing_details,
                "bag_type": bd.bag_type,
                "special_box_required": bd.special_box_required,
                "required_sets_per_carton": bd.required_sets_per_carton,
                "polyfold_condition": bd.polyfold_condition,
                "filled_product_gsm": bd.filled_product_gsm,
                "elastic_required": bd.elastic_required, 
            }
        except:
            bedsheet_details = {}

    elif program_type in ("TERRY_TOWEL", "TOWEL"):
        try:
            td = program.terry_details
            terry_details = {
                "towel_sizes": td.towel_sizes,
                "required_pcs_carton_size": td.required_pcs_carton_size,
                "required_polybags_carton_size": td.required_polybags_carton_size,
                "towel_dimensions": td.towel_dimensions,
                "towel_weight_per_piece": td.towel_weight_per_piece,
                "folding_details": td.folding_details,
                "required_pcs_per_polybag": td.required_pcs_per_polybag,
                "special_carton_details": td.special_carton_details,
            }
        except:
            terry_details = {}

    elif program_type == "BATH_ROBE":
        try:
            br = program.bathrobe_details
            bathrobe_details = {
                "original_bath_robe": br.original_bath_robe,
                "bath_robe_sizes": br.bath_robe_sizes,
                "bath_robe_dimensions": br.bath_robe_dimensions,
                "bath_robe_weight": br.bath_robe_weight,
                "folding_details": br.folding_details,
                "required_pcs_per_polybag": br.required_pcs_per_polybag,
                "required_pcs_per_carton": br.required_pcs_per_carton,
                "polybag_type": br.polybag_type,
                "polybag_size_carton": br.polybag_size_carton,
            }
        except:
            bathrobe_details = {}

    # --------------------------------------------------
    # SUBPROGRAMS
    # --------------------------------------------------

    subprogram_list = []

    subs = CartonProgramSubProgram.objects.filter(
        carton_program=program
    )

    for sp in subs:
        subprogram_list.append({
            "subprogram_id": sp.id,
            "program_name": sp.program_name,
            "style": sp.style,
            "pcs_per_set": sp.pcs_per_set,

            "width_in": sp.width_in,
            "length_in": sp.length_in,
            "width_cm": sp.width_cm,
            "length_cm": sp.length_cm,
            "wt_per_unit": sp.wt_per_unit,
            "gsm": sp.gsm,

            "unit_per_carton": sp.unit_per_carton,
            "inner_pack_unit_qty": sp.inner_pack_unit_qty,
            "fold": sp.fold,

            "carton_length": sp.carton_length,
            "carton_width": sp.carton_width,
            "carton_height": sp.carton_height,

            "ribbon": sp.ribbon,
            "belly_band": sp.belly_band,
            "remark": sp.remark,

            "pdq_length": sp.pdq_length,
            "pdq_width": sp.pdq_width,
            "pdq_height": sp.pdq_height,
            "net_wt_pdq": sp.net_wt_pdq,
            "pallet_wt_pdq": sp.pallet_wt_pdq,

            "pallet_length": sp.pallet_length,
            "pallet_width": sp.pallet_width,
            "pallet_height": sp.pallet_height,
            
            "packed_pb_length": sp.packed_pb_length,
            "packed_pb_width": sp.packed_pb_width,
            "packed_pb_height": sp.packed_pb_height,

            "calculated_net_wt_carton": sp.calculated_net_wt_carton,
            "calculated_cbm_per_carton": sp.calculated_cbm_per_carton,
            "calculated_cbm_per_pdq": sp.calculated_cbm_per_pdq,

            "cartons_per_20ft": sp.cartons_per_container("20FT"),
            "cartons_per_40ft": sp.cartons_per_container("40FT"),
            "pdq_per_20ft": sp.pdq_per_container("20FT"),
            "pdq_per_40ft": sp.pdq_per_container("40FT"),
            "pallet_per_20ft": sp.pallets_per_container("20FT"),
            "pallet_per_40ft": sp.pallets_per_container("40FT"),
            "saved_cartons_per_20ft": sp.saved_cartons_per_20ft,
            "saved_cartons_per_40ft": sp.saved_cartons_per_40ft,
            "saved_pdq_per_20ft": sp.saved_pdq_per_20ft,
            "saved_pdq_per_40ft": sp.saved_pdq_per_40ft,
            "saved_pallet_per_20ft": sp.saved_pallet_per_20ft,
            "saved_pallet_per_40ft": sp.saved_pallet_per_40ft,
            "saved_cbm_per_carton": sp.saved_cbm_per_carton,
    
        })

    # --------------------------------------------------
    # SAMPLE PROGRAMS
    # --------------------------------------------------

    sample_list = []

    samples = SampleProgram.objects.filter(
        carton_program=program
    )

    for sm in samples:
        sample_attachments = [
            {
                "id": att.id,
                "file_url": request.build_absolute_uri(att.file.url),
                "description": att.description,
                "uploaded_on": att.uploaded_on.strftime("%d-%m-%Y")
            }
            for att in sm.attachments.all()
        ]

        sample_list.append({
            "sample_id": sm.id,
            "program_name": sm.program_name,
            "sample_code": sm.sample_code,
            "size": sm.size,
            "sample": sm.sample,
            "quality": sm.quality,
            "lbs_per_dz": sm.lbs_per_dz,
            "gsm": sm.gsm,
            "shade": sm.shade,
            "width_in": sm.width_in,
            "length_in": sm.length_in,
            "width_cm": sm.width_cm,
            "length_cm": sm.length_cm,
            "attachments": sample_attachments,
        })

    # --------------------------------------------------
    # ATTACHMENTS
    # --------------------------------------------------

    attachments = []

    for att in program.attachments.all():
        attachments.append({
            "id": att.id,
            "file_url": request.build_absolute_uri(att.file.url),
            "description": att.description,
            "uploaded_on": att.uploaded_on.strftime("%d-%m-%Y")
        })

    # --------------------------------------------------
    # FREEZING NOTE ROWS (Bedsheet only)
    # --------------------------------------------------

    freezing_note_rows = []
    if program_type == "BEDSHEET":
        for fn in program.freezing_note_rows.all():
            freezing_note_rows.append({
                "freezing_note_id": fn.id,
                "sr_no": fn.sr_no,
                "buyer": fn.buyer,
                "tc": fn.tc,
                "program": fn.program,
                "date_of_carton_dimension_finalization": fn.date_of_carton_dimension_finalization,
                "product": fn.product,
                "size": fn.size,
                "product_dimension": fn.product_dimension,
                "pcs_per_bag_or_inner_box": fn.pcs_per_bag_or_inner_box,
                "bag_or_innerbox_per_carton": fn.bag_or_innerbox_per_carton,
                "pcs_per_carton": fn.pcs_per_carton,
                "carton_type_paper": fn.carton_type_paper,
                "carton_length_cm": fn.carton_length_cm,
                "carton_width_cm": fn.carton_width_cm,
                "carton_height_cm": fn.carton_height_cm,
                "cbm": fn.cbm,
                "max_outside_carton_dimension": fn.max_outside_carton_dimension,
                "net_weight_kgs": fn.net_weight_kgs,
                "gross_weight_kgs": fn.gross_weight_kgs,
                "carton_ply_no": fn.carton_ply_no,
                "carton_min_bursting_strength": fn.carton_min_bursting_strength,
                "carton_min_edge_crush_test": fn.carton_min_edge_crush_test,
                "stiffener_dimension": fn.stiffener_dimension,
                "stiffener_no_of_ply": fn.stiffener_no_of_ply,
                "stiffener_type_cut": fn.stiffener_type_cut,
                "side_stiffener_dimension": fn.side_stiffener_dimension,
                "side_stiffener_no_of_ply": fn.side_stiffener_no_of_ply,
                "side_stiffener_type_cut": fn.side_stiffener_type_cut,
                "separator_dimension": fn.separator_dimension,
                "separator_no_of_ply": fn.separator_no_of_ply,
                "bag_or_innerbox_size": fn.bag_or_innerbox_size,
                "bag_type_or_box_type": fn.bag_type_or_box_type,
                "ld_polybag_length_cm": fn.ld_polybag_length_cm,
                "ld_polybag_width_cm": fn.ld_polybag_width_cm,
                "ld_polybag_flap_cm": fn.ld_polybag_flap_cm,
                "ld_polybag_thickness_micron": fn.ld_polybag_thickness_micron,
                "ld_polybag_quality": fn.ld_polybag_quality,
                "printing_matter_polybag": fn.printing_matter_polybag,
                "product_position_in_carton": fn.product_position_in_carton,
                "folded_product_length": fn.folded_product_length,
                "folded_product_width": fn.folded_product_width,
                "folded_product_height": fn.folded_product_height,
                "bellyband_ribbon_dimension": fn.bellyband_ribbon_dimension,
                "bellyband_ribbon_quality": fn.bellyband_ribbon_quality,
                "macys_tmcl_placement": fn.macys_tmcl_placement,
                "macys_carton_type": fn.macys_carton_type,
                "macys_tmcl_placement_type": fn.macys_tmcl_placement_type,
                "pdq_accessories_others": fn.pdq_accessories_others,
                "remarks": fn.remarks,
            })

    # --------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------

    response_data = {
        "activity": aps.activity,
        "status": aps.status,
        "program_type": program_type,
        "sent_to_user_id": aps.sent_to_id,
        "program_id": aps.program_id,
        "activity_program_status_id": aps.id,


        "carton_program": {
            "program_name": program.program_name,
            "customer_name": program.customer_name,
            "customer_protocol": program.customer_protocol,
            "confirm_new_or_shifted_from_vapi": program.confirm_new_or_shifted_from_vapi,
            "original_towel": program.original_towel,
            "size": program.size,
            "polybag_manual_or_automatic": program.polybag_manual_or_automatic,
            "polybag_type": program.polybag_type,
            "pallet_or_slipsheet_requirement": program.pallet_or_slipsheet_requirement,
            "special_carton_required": program.special_carton_required,
            "pdq_required": program.pdq_required,
            "cdu_required": program.cdu_required,
            "sample_carton_arranged": program.sample_arranged_for_special_carton,
            "pdq_arranged": program.sample_arranged_for_special_carton_pdq,
            "cdu_arranged": program.sample_arranged_for_special_carton_cdu,
            "shipped_as_single_pdq_or_monster_pdq": program.shipped_as_single_pdq_or_monster_pdq,
            "pdq_layers_stacking_details": program.pdq_layers_stacking_details,
            "common_pdq_same_dimension_for_all_sizes": program.common_pdq_same_dimension_for_all_sizes,
            "small_pdq_on_pallet_or_slipsheet": program.small_pdq_on_pallet_or_slipsheet,
            "small_pdq_count_on_pallet_or_slipsheet": program.small_pdq_count_on_pallet_or_slipsheet,
            "warehouse_store_handling_method": program.warehouse_store_handling_method,
            "towel_folded_and_poly_packed_before_carton": program.towel_folded_and_poly_packed_before_carton,
            "separator_protector_stiffener_required": program.separator_protector_stiffener_required,
            "ribbon_packing_required": program.ribbon_packing_required,
            "belly_band_packing_required": program.belly_band_packing_required,
            "remark": program.remark
        },

        "bedsheet_details": bedsheet_details,
        "terry_details": terry_details,
        "bathrobe_details": bathrobe_details,

        "subprograms": subprogram_list,
        "samples": sample_list,
        "attachments": attachments,
        "freezing_note_rows": freezing_note_rows,
        "can_edit_freezing_note": request.user.role == "MARKETING",
    }

    return Response(response_data)
# # ------------------------------------------------------------------
# # API: Recalculate Preview
# # Description:
# #   TQM "Recalculate" button action.
# #
# #   - Accepts CURRENT typed dimensions from frontend
# #   - SAVES them immediately to DB (carton/pdq/pallet dims, ribbon,
# #     belly_band, self_fabric_bag, remark, weight, folded dims, saved
# #     net weight/CBM overrides)
# #   - Computes container-fit numbers from the just-saved values
# #   - Marks every subprogram in the request as is_recalculated=True,
# #     which unlocks Tentative/Final submit
# # ------------------------------------------------------------------

# recalculate_preview_schema = openapi.Schema(
#     type=openapi.TYPE_OBJECT,
#     required=["subprograms"],
#     properties={
#         "subprograms": openapi.Schema(
#             type=openapi.TYPE_ARRAY,
#             items=openapi.Schema(
#                 type=openapi.TYPE_OBJECT,
#                 required=["subprogram_id"],
#                 properties={
#                     "subprogram_id": openapi.Schema(type=openapi.TYPE_INTEGER),

#                     "carton_length": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "carton_width": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "carton_height": openapi.Schema(type=openapi.TYPE_NUMBER),

#                     "pdq_length": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "pdq_width": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "pdq_height": openapi.Schema(type=openapi.TYPE_NUMBER),

#                     "pallet_length": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "pallet_width": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "pallet_height": openapi.Schema(type=openapi.TYPE_NUMBER),

#                     "folded_length": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "folded_width": openapi.Schema(type=openapi.TYPE_NUMBER),

#                     "wt_per_unit": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "weight_uom": openapi.Schema(
#                         type=openapi.TYPE_STRING,
#                         enum=["GM", "KG", "LB"]
#                     ),

#                     "ribbon": openapi.Schema(type=openapi.TYPE_STRING, enum=["YES", "NO"]),
#                     "belly_band": openapi.Schema(type=openapi.TYPE_STRING, enum=["YES", "NO"]),
#                     "self_fabric_bag": openapi.Schema(type=openapi.TYPE_STRING, enum=["YES", "NO"]),
#                     "remark": openapi.Schema(type=openapi.TYPE_STRING),

#                     # Manual overrides (editable Net Weight / CBM cells)
#                     "saved_net_wt_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
#                     "saved_cbm_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
#                 }
#             )
#         )
#     }
# )

# recalculate_preview_response = openapi.Schema(
#     type=openapi.TYPE_OBJECT,
#     properties={
#         "results": openapi.Schema(
#             type=openapi.TYPE_ARRAY,
#             items=openapi.Schema(type=openapi.TYPE_OBJECT)
#         )
#     }
# )


# @swagger_auto_schema(
#     method="post",
#     operation_summary="Recalculate (saves dimensions immediately, unlocks submit)",
#     operation_description="""
#     This IS the "Recalculate" button action:

#     1. Saves whatever dimensions/fields the TQM user has currently typed
#        for each subprogram straight to the DB.
#     2. Computes container-fit numbers (cartons/pdq/pallet per 20FT & 40FT)
#        and CBM from those just-saved values.
#     3. Sets is_recalculated=True and last_recalculated_on=now on every
#        subprogram included in the request.

#     Tentative/Final submit (bulk_update_tqm_subprogram) will reject the
#     submission if any subprogram is still is_recalculated=False - so this
#     endpoint must be called, with the latest dimensions, before submit.

#     If dimensions are edited again after calling this, is_recalculated is
#     reset to False by bulk_update_tqm_subprogram's dims_changed check -
#     Recalculate must be called again before the next submit.
#     """,
#     request_body=recalculate_preview_schema,
#     responses={200: recalculate_preview_response},
# )
# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# @transaction.atomic
# def recalculate_preview(request):

#     items = request.data.get("subprograms", [])

#     if not items:
#         return Response(
#             {"error": "subprograms list is required"},
#             status=400
#         )

#     results = []
#     now = timezone.now()

#     for item in items:
#         sp_id = item.get("subprogram_id")

#         try:
#             sp = CartonProgramSubProgram.objects.get(id=sp_id)
#         except CartonProgramSubProgram.DoesNotExist:
#             continue

#         # -------- Yes/No dropdown validation --------
#         ribbon_val, err = _validate_yes_no(item.get("ribbon"), f"ribbon (subprogram {sp_id})")
#         if err:
#             return err

#         belly_band_val, err = _validate_yes_no(item.get("belly_band"), f"belly_band (subprogram {sp_id})")
#         if err:
#             return err

#         self_fabric_bag_val, err = _validate_yes_no(item.get("self_fabric_bag"), f"self_fabric_bag (subprogram {sp_id})")
#         if err:
#             return err

#         # -------- Save whatever was sent (partial-safe) --------

#         if item.get("carton_length") is not None:
#             sp.carton_length = item.get("carton_length")
#         if item.get("carton_width") is not None:
#             sp.carton_width = item.get("carton_width")
#         if item.get("carton_height") is not None:
#             sp.carton_height = item.get("carton_height")

#         if item.get("pdq_length") is not None:
#             sp.pdq_length = item.get("pdq_length")
#         if item.get("pdq_width") is not None:
#             sp.pdq_width = item.get("pdq_width")
#         if item.get("pdq_height") is not None:
#             sp.pdq_height = item.get("pdq_height")

#         if item.get("pallet_length") is not None:
#             sp.pallet_length = item.get("pallet_length")
#         if item.get("pallet_width") is not None:
#             sp.pallet_width = item.get("pallet_width")
#         if item.get("pallet_height") is not None:
#             sp.pallet_height = item.get("pallet_height")

#         if item.get("folded_length") is not None:
#             sp.folded_length = item.get("folded_length")
#         if item.get("folded_width") is not None:
#             sp.folded_width = item.get("folded_width")

#         if item.get("wt_per_unit") is not None:
#             sp.wt_per_unit = item.get("wt_per_unit")
#         if item.get("weight_uom"):
#             sp.weight_uom = item.get("weight_uom")

#         if item.get("ribbon") is not None:
#             sp.ribbon = ribbon_val
#         if item.get("belly_band") is not None:
#             sp.belly_band = belly_band_val
#         if item.get("self_fabric_bag") is not None:
#             sp.self_fabric_bag = self_fabric_bag_val
#         if item.get("remark") is not None:
#             sp.remark = item.get("remark")

#         # Manual overrides for editable Net Weight / CBM display cells
#         if item.get("saved_net_wt_carton") is not None:
#             sp.saved_net_wt_carton = item.get("saved_net_wt_carton")
#         if item.get("saved_cbm_per_carton") is not None:
#             sp.saved_cbm_per_carton = item.get("saved_cbm_per_carton")

#         # -------- Mark as recalculated --------
#         sp.is_recalculated = True
#         sp.last_recalculated_on = now

#         sp.save()

#         # -------- Build response using freshly-saved values --------
#         results.append({
#             "subprogram_id": sp_id,

#             "carton": {
#                 "length": sp.carton_length,
#                 "width": sp.carton_width,
#                 "height": sp.carton_height,
#                 "cbm": sp.saved_cbm_per_carton or sp.calculated_cbm_per_carton,
#             },

#             "folded_length": sp.folded_length,
#             "folded_width": sp.folded_width,

#             "net_wt_carton": sp.saved_net_wt_carton or sp.calculated_net_wt_carton,

#             "cartons_per_20ft": sp.cartons_per_container("20FT"),
#             "cartons_per_40ft": sp.cartons_per_container("40FT"),
#             "pdq_per_20ft": sp.pdq_per_container("20FT"),
#             "pdq_per_40ft": sp.pdq_per_container("40FT"),
#             "pallet_per_20ft": sp.pallets_per_container("20FT"),
#             "pallet_per_40ft": sp.pallets_per_container("40FT"),

#             "ribbon": sp.ribbon,
#             "belly_band": sp.belly_band,
#             "self_fabric_bag": sp.self_fabric_bag,
#             "remark": sp.remark,

#             "is_recalculated": True,
#             "last_recalculated_on": now.strftime("%d-%m-%Y %H:%M:%S"),
#         })

#         create_log(
#             module_name="Sub Program",
#             record_id=sp.id,
#             action="Recalculated",
#             message="TQM clicked Recalculate - dimensions saved and container-fit recomputed",
#             user=request.user
#         )

#     return Response({"results": results}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_carton_calculations_ai(request):

    program_id = request.data.get("program_id")

    if not program_id:
        return Response(
            {"error": "program_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        program = CartonProgram.objects.get(id=program_id)
    except CartonProgram.DoesNotExist:
        return Response(
            {"error": "Program not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    subprograms = program.subprograms.all()

    now = timezone.now()
    subprograms.update(is_recalculated=True, last_recalculated_on=now)

    data = []

    for sp in subprograms:
        data.append({
            "subprogram_id": sp.id,
            "program_name": sp.program_name,

            "fold": sp.fold,
            "folded_length": sp.folded_length,
            "folded_width": sp.folded_width,

            "carton": {
                "length": sp.carton_length,
                "width": sp.carton_width,
                "height": sp.carton_height,
                "cbm": sp.calculated_cbm_per_carton
            },

            "container": {
                "20FT": sp.cartons_per_container("20FT"),
                "40FT": sp.cartons_per_container("40FT"),
                "40HC": sp.cartons_per_container("40HC"),
            },

            "is_recalculated": True,
            "last_recalculated_on": now.strftime("%d-%m-%Y %H:%M:%S"),
        })

    return Response({
        "program_id": program.id,
        "program_name": program.program_name,
        "results": data
    }, status=status.HTTP_200_OK)

# ------------------------------------------------------------------
# API: My Assigned Activities
#
# Description:
#   Returns all non-draft activities assigned to logged-in user.
#
#   Includes:
#   - Program name
#   - Customer
#   - Program type (for dynamic form rendering)
#   - Status
#   - Created timestamp
#
# Excludes:
#   - Draft
#   - Save as Draft
#
# Method: GET
# ------------------------------------------------------------------


# ------------------------------------------------------------------
# Swagger Schema: My Assigned Activities Response
# ------------------------------------------------------------------

my_assigned_activities_response_schema = openapi.Schema(
    type=openapi.TYPE_ARRAY,
    items=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            "activity_program_status_id": openapi.Schema(
                type=openapi.TYPE_INTEGER
            ),
            "activity": openapi.Schema(
                type=openapi.TYPE_STRING
            ),
            "program_name": openapi.Schema(
                type=openapi.TYPE_STRING
            ),
            "customer_name": openapi.Schema(
                type=openapi.TYPE_STRING
            ),
            "program_type": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="TOWEL / BEDSHEET / TERRY TOWEL / BATH ROBE"
            ),
            "status": openapi.Schema(
                type=openapi.TYPE_STRING
            ),
            "created_on": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Formatted datetime: DD-MM-YYYY HH:MM:SS"
            ),
        }
    )
)


@swagger_auto_schema(
    method="get",
    operation_summary="Get My Assigned Activities",
    operation_description="Returns all non-draft activities assigned to logged-in user.",
    responses={
        200: my_assigned_activities_response_schema,
        401: "Unauthorized"
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_assigned_activities(request):

    records = ActivityProgramStatus.objects.select_related(
        "program", "gusset_program"
    ).filter(
        sent_to=request.user
    ).exclude(
        status__icontains="draft"
    )

    data = []

    for r in records:
        if not r.program_id and not r.gusset_program_id:
            continue

        data.append({
            "activity_program_status_id": r.id,
            "activity": r.activity,
            "program_name": r.program_name,
            "customer_name": r.customer_name,
            "program_type": r.program.program_type if r.program_id else "GUSSET",
            "program_type_group": r.program_type_group,
            "status": r.status,
            "created_on": r.created_on.strftime("%d-%m-%Y %H:%M:%S")
            if r.created_on else None,
        })

    return Response(data)




# ------------------------------------------------------------------
# API: Accept Carton Program
# Description:
#   Sets status to In Progress
# ------------------------------------------------------------------


accept_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={
        "activity_program_status_id": openapi.Schema(type=openapi.TYPE_INTEGER)
    }
)



@swagger_auto_schema(
    method="post",
    operation_summary="Accept assigned program",
    request_body=accept_schema,
    responses={200: "Accepted"}
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_program(request):

    aps_id = request.data.get("activity_program_status_id")

    try:
        aps = ActivityProgramStatus.objects.get(
            id=aps_id,
            sent_to=request.user
        )
    except ActivityProgramStatus.DoesNotExist:
        return Response({"error": "Invalid record"}, status=404)

    aps.status = "In Progress"
    aps.rejection_reason = None
    aps.save()

    create_log(
        module_name="Activity Status",
        record_id=aps.id,
        action="Accepted",
        message=f"Program {aps.program_name} accepted",
        user=request.user
    )

    return Response({"message": "Program Accepted"})



# ------------------------------------------------------------------
# API: Accept Carton Program PPC
# Description:
#   Sets status to In Progress and assign to tqm (id 3)
# ------------------------------------------------------------------


accept_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={
        "activity_program_status_id": openapi.Schema(type=openapi.TYPE_INTEGER)
    }
)



@swagger_auto_schema(
    method="post",
    operation_summary="PPC Accept assigned program",
    request_body=accept_schema,
    responses={200: "Accepted By PPC"}
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_program_ppc(request):
    User = get_user_model()

    aps_id = request.data.get("activity_program_status_id")

    try:
        aps = ActivityProgramStatus.objects.get(
            id=aps_id,
            sent_to=request.user
        )
    except ActivityProgramStatus.DoesNotExist:
        return Response({"error": "Invalid record"}, status=404)

    # Role-based lookup instead of hardcoded user id — picks any active
    # TTQM-role user. If multiple exist, the first one (by id) is used.
    tqm_user = User.objects.filter(role="TTQM", is_active=True).order_by("id").first()

    if not tqm_user:
        return Response({"error": "No active TTQM user found to forward this request to"}, status=404)

    aps.status = "In Progress"
    aps.sent_to = tqm_user
    aps.rejection_reason = None
    aps.save()

    notification = NotificationService()

    try:
        notification.send_tqm_notification(aps.program or aps.gusset_program)
    except Exception as e:
        print("Email failed:", str(e))

    create_log(
        module_name="Activity Status",
        record_id=aps.id,
        action="Accepted_PPC",
        message=f"Program {aps.program_name} accepted by ppc, forwarded to {tqm_user.username}",
        user=request.user
    )

    return Response({"message": f"Program Accepted By PPC and forwarded to {tqm_user.username}"})
 


# ------------------------------------------------------------------
# API: Reject Carton Program
# Description:
#   Sets status to Rejected with reason
# ------------------------------------------------------------------


reject_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id", "reason"],
    properties={
        "activity_program_status_id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "reason": openapi.Schema(type=openapi.TYPE_STRING)
    }
)

@swagger_auto_schema(
    method="post",
    operation_summary="Reject assigned program",
    request_body=reject_schema,
    responses={200: "Rejected"}
)




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_program(request):

    aps_id = request.data.get("activity_program_status_id")
    reason = request.data.get("reason")

    if not reason:
        return Response({"error": "reason is required"}, status=400)

    try:
        aps = ActivityProgramStatus.objects.get(
            id=aps_id,
            sent_to=request.user
        )
    except ActivityProgramStatus.DoesNotExist:
        return Response({"error": "Invalid record"}, status=404)

    aps.status = "Rejected"
    aps.rejection_reason = reason
    aps.save()
    

    notification = NotificationService()

    # Notify creator
    try:
        notification.send_rejection_notification(
            aps.program,
            reason
        )
    except Exception as e:
        print("Email failed:", str(e))

    create_log(
        module_name="Activity Status",
        record_id=aps.id,
        action="Rejected",
        message=f"Rejected: {reason}",
        user=request.user
    )

    return Response({"message": "Program Rejected"})



# ------------------------------------------------------------------
# API: Bulk Update TQM Subprogram Details
# Description:
#   Allows TQM user to update carton, PDQ and pallet details
#   for multiple subprograms in one request.
#
#   Updates:
#   - Carton dimensions
#   - PDQ dimensions
#   - Pallet dimensions
#   - Packing flags
#   - Activity status
#
#   Conditional Rules:
#   - If pdq_required = True → PDQ fields mandatory
#   - If pallet_or_slipsheet_requirement = True → Pallet size mandatory
#
#   Container calculations are automatically derived
#   from model properties after saving.
# ------------------------------------------------------------------
tqm_bulk_update_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id", "btn", "subprograms"],
    properties={

        "activity_program_status_id": openapi.Schema(
            type=openapi.TYPE_INTEGER
        ),

        "btn": openapi.Schema(
            type=openapi.TYPE_STRING,
            enum=["tentative_submit", "final_submit"]
        ),

        "request_sample": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "request_carton_sizing": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "purchase_sent_to": openapi.Schema(
            type=openapi.TYPE_INTEGER
        ),

        "subprograms": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                required=["subprogram_id"],
                properties={

                    "subprogram_id": openapi.Schema(type=openapi.TYPE_INTEGER),

                    # Carton
                    "carton_length": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "carton_width": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "carton_height": openapi.Schema(type=openapi.TYPE_NUMBER),

                    "ribbon": openapi.Schema(type=openapi.TYPE_STRING),
                    "belly_band": openapi.Schema(type=openapi.TYPE_STRING),
                    "remark": openapi.Schema(type=openapi.TYPE_STRING),

                    # PDQ
                    "pdq_length": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pdq_width": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pdq_height": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "net_wt_pdq": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pallet_wt_pdq": openapi.Schema(type=openapi.TYPE_NUMBER),

                    # Pallet
                    "pallet_length": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pallet_width": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pallet_height": openapi.Schema(type=openapi.TYPE_NUMBER),
                    
                    # Packed PB
                    "packed_pb_length": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "packed_pb_width": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "packed_pb_height": openapi.Schema(type=openapi.TYPE_NUMBER),
                }
            )
        )
    }
)

tqm_bulk_update_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "message": openapi.Schema(type=openapi.TYPE_STRING)
    }
)


tqm_bulk_update_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "message": openapi.Schema(
            type=openapi.TYPE_STRING,
            example="TQM subprogram details updated successfully"
        )
    }
)


# recalculation function

# ------------------------------------------------------------------
# API: Recalculate Preview (calculates using CURRENT typed values,
# does NOT save to DB — only returns computed numbers)
# ------------------------------------------------------------------

recalculate_preview_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["subprograms"],
    properties={
        "subprograms": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "subprogram_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "carton_length": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "carton_width": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "carton_height": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pdq_length": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pdq_width": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pdq_height": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pallet_length": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pallet_width": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "pallet_height": openapi.Schema(type=openapi.TYPE_NUMBER),
                }
            )
        )
    }
)

@swagger_auto_schema(
    method="post",
    operation_summary="Recalculate container fit (preview only, not saved)",
    request_body=recalculate_preview_schema,
)
# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def recalculate_preview(request):

#     items = request.data.get("subprograms", [])
#     results = []

#     for item in items:
#         sp_id = item.get("subprogram_id")

#         try:
#             sp = CartonProgramSubProgram.objects.get(id=sp_id)
#         except CartonProgramSubProgram.DoesNotExist:
#             continue

       
#         sp.carton_length = item.get("carton_length") or sp.carton_length
#         sp.carton_width = item.get("carton_width") or sp.carton_width
#         sp.carton_height = item.get("carton_height") or sp.carton_height
#         sp.pdq_length = item.get("pdq_length") or sp.pdq_length
#         sp.pdq_width = item.get("pdq_width") or sp.pdq_width
#         sp.pdq_height = item.get("pdq_height") or sp.pdq_height
#         sp.pallet_length = item.get("pallet_length") or sp.pallet_length
#         sp.pallet_width = item.get("pallet_width") or sp.pallet_width
#         sp.pallet_height = item.get("pallet_height") or sp.pallet_height

#         results.append({
#             "subprogram_id": sp_id,
#             "cartons_per_20ft": sp.cartons_per_container("20FT"),
#             "cartons_per_40ft": sp.cartons_per_container("40FT"),
#             "pdq_per_20ft": sp.pdq_per_container("20FT"),
#             "pdq_per_40ft": sp.pdq_per_container("40FT"),
#             "pallet_per_20ft": sp.pallets_per_container("20FT"),
#             "pallet_per_40ft": sp.pallets_per_container("40FT"),
#             "cbm_per_carton": sp.calculated_cbm_per_carton,
#             "net_wt_per_carton": sp.calculated_net_wt_carton,
#         })

#     return Response({"results": results})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def recalculate_preview(request):

    items = request.data.get("subprograms", [])
    results = []
    errors = []

    for item in items:
        sp_id = item.get("subprogram_id")

        try:
            sp = CartonProgramSubProgram.objects.get(id=sp_id)
        except CartonProgramSubProgram.DoesNotExist:
            continue

        # Update dimensions with whatever the user currently typed.
        # Guard against zero/blank overwriting good data, same as before.
        sp.carton_length = item.get("carton_length") or sp.carton_length
        sp.carton_width = item.get("carton_width") or sp.carton_width
        sp.carton_height = item.get("carton_height") or sp.carton_height
        sp.pdq_length = item.get("pdq_length") or sp.pdq_length
        sp.pdq_width = item.get("pdq_width") or sp.pdq_width
        sp.pdq_height = item.get("pdq_height") or sp.pdq_height
        sp.pallet_length = item.get("pallet_length") or sp.pallet_length
        sp.pallet_width = item.get("pallet_width") or sp.pallet_width
        sp.pallet_height = item.get("pallet_height") or sp.pallet_height

        # -------- SANITY CHECK: dimensions in cm should be reasonable --------
        # A carton bigger than 1000 cm (10 metres) in any dimension is
        # certainly a data-entry mistake (e.g. mm typed instead of cm),
        # and would overflow saved_cbm_per_carton's DB column anyway.
        MAX_REASONABLE_CM = 3000

        dims_to_check = {
            "carton_length": sp.carton_length,
            "carton_width": sp.carton_width,
            "carton_height": sp.carton_height,
            "pdq_length": sp.pdq_length,
            "pdq_width": sp.pdq_width,
            "pdq_height": sp.pdq_height,
            "pallet_length": sp.pallet_length,
            "pallet_width": sp.pallet_width,
            "pallet_height": sp.pallet_height,
        }

        bad_fields = [
            name for name, val in dims_to_check.items()
            if val is not None and val > MAX_REASONABLE_CM
        ]

        if bad_fields:
            errors.append({
                "subprogram_id": sp_id,
                "error": f"Unrealistic dimension(s) — check these fields (max {MAX_REASONABLE_CM} cm): {', '.join(bad_fields)}",
                "values": {k: str(dims_to_check[k]) for k in bad_fields}
            })
            continue  # skip saving/calculating this subprogram

        # Compute the container-fit numbers
        cartons_20 = sp.cartons_per_container("20FT")
        cartons_40 = sp.cartons_per_container("40FT")
        pdq_20 = sp.pdq_per_container("20FT")
        pdq_40 = sp.pdq_per_container("40FT")
        pallet_20 = sp.pallets_per_container("20FT")
        pallet_40 = sp.pallets_per_container("40FT")
        cbm = sp.calculated_cbm_per_carton

        # Extra safety net: even if dims passed the check above, cap CBM
        # so it can never exceed what the DB column can hold
        # (max_digits=10, decimal_places=4 -> max 999999.9999).
        if cbm is not None and cbm > Decimal("999999"):
            errors.append({
                "subprogram_id": sp_id,
                "error": "Calculated CBM is too large to save — check carton dimensions."
            })
            continue

        sp.saved_cartons_per_20ft = cartons_20
        sp.saved_cartons_per_40ft = cartons_40
        sp.saved_pdq_per_20ft = pdq_20
        sp.saved_pdq_per_40ft = pdq_40
        sp.saved_pallet_per_20ft = pallet_20
        sp.saved_pallet_per_40ft = pallet_40
        sp.saved_cbm_per_carton = cbm
        sp.is_recalculated = True
        sp.last_recalculated_on = timezone.now()

        sp.save()

        results.append({
            "subprogram_id": sp_id,
            "carton": {
                "length": sp.carton_length,
                "width": sp.carton_width,
                "height": sp.carton_height,
                "cbm": cbm,
            },
            "cartons_per_20ft": cartons_20,
            "cartons_per_40ft": cartons_40,
            "pdq_per_20ft": pdq_20,
            "pdq_per_40ft": pdq_40,
            "pallet_per_20ft": pallet_20,
            "pallet_per_40ft": pallet_40,
            "cbm_per_carton": cbm,
            "net_wt_per_carton": sp.calculated_net_wt_carton,
            "is_recalculated": True,
        })

    if errors and not results:
        return Response({"error": "Recalculation failed", "details": errors}, status=400)

    return Response({"results": results, "errors": errors})


@swagger_auto_schema(
    method="post",
    operation_summary="Bulk Update TQM Subprogram",
    request_body=tqm_bulk_update_schema,
    responses={200: tqm_bulk_update_response}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def bulk_update_tqm_subprogram(request):

    data = request.data

    aps_id = data.get("activity_program_status_id")
    btn = data.get("btn")
    request_sample = data.get("request_sample")
    request_carton_sizing = data.get("request_carton_sizing")
    purchase_sent_to = data.get("purchase_sent_to")
    subprograms = data.get("subprograms", [])
    
    inner_pack_unit_qty = data.get("inner_pack_unit_qty")

    if not aps_id:
        return Response(
            {"error": "activity_program_status_id is required"},
            status=400
        )

    if not subprograms:
        return Response(
            {"error": "subprograms list is required"},
            status=400
        )

    # --------------------------------------------------
    # FETCH ACTIVITY STATUS
    # --------------------------------------------------

    try:
        aps = ActivityProgramStatus.objects.select_related(
            "program"
        ).get(
            id=aps_id,
            sent_to=request.user
        )
    except ActivityProgramStatus.DoesNotExist:
        return Response(
            {"error": "Invalid record"},
            status=404
        )

    program = aps.program

    pallet_required = program.pallet_or_slipsheet_requirement
    pdq_required = program.pdq_required
    

    # --------------------------------------------------
    # UPDATE STATUS FLAGS
    # --------------------------------------------------

    if request_sample is not None:
        aps.request_sample = request_sample

    if request_carton_sizing is not None:
        aps.request_carton_sizing = request_carton_sizing

    if purchase_sent_to:
        aps.purchase_sent_to_id = purchase_sent_to

    if btn == "final_submit":
        aps.status = "Final Working Submitted"
    else:
        aps.status = "Tentative Working Submitted"

    aps.rejection_reason = None
    aps.save()

    # --------------------------------------------------
    # LOOP SUBPROGRAMS
    # --------------------------------------------------

    for item in subprograms:

        sp_id = item.get("subprogram_id")

        try:
            sp = CartonProgramSubProgram.objects.get(
                id=sp_id,
                carton_program=program
            )
        except CartonProgramSubProgram.DoesNotExist:
            return Response(
                {"error": f"Invalid subprogram_id {sp_id}"},
                status=404
            )

        # ------------------------------
        # CONDITIONAL VALIDATION
        # ------------------------------

        if pdq_required:
            if not item.get("pdq_length") or not item.get("pdq_width") or not item.get("pdq_height"):
                return Response(
                    {"error": f"PDQ details mandatory for subprogram {sp_id}"},
                    status=400
                )

        if pallet_required:
            if not item.get("pallet_length") or not item.get("pallet_width") or not item.get("pallet_height"):
                return Response(
                    {"error": f"Pallet size mandatory for subprogram {sp_id}"},
                    status=400
                )
                
                
        if inner_pack_unit_qty and inner_pack_unit_qty != 0:
            if not item.get("packed_pb_length") or not item.get("packed_pb_width") or not item.get("packed_pb_height"):
                return Response(
                    {"error": f"Packed pb size mandatory for subprogram {sp_id}"},
                    status=400
                )

        # ------------------------------
        # SAVE FIELDS
        # ------------------------------

        sp.carton_length = item.get("carton_length")
        sp.carton_width = item.get("carton_width")
        sp.carton_height = item.get("carton_height")

        sp.ribbon = item.get("ribbon")
        sp.belly_band = item.get("belly_band")
        sp.remark = item.get("remark")

        sp.pdq_length = item.get("pdq_length")
        sp.pdq_width = item.get("pdq_width")
        sp.pdq_height = item.get("pdq_height")

        sp.net_wt_pdq = item.get("net_wt_pdq")
        sp.pallet_wt_pdq = item.get("pallet_wt_pdq")

        sp.pallet_length = item.get("pallet_length")
        sp.pallet_width = item.get("pallet_width")
        sp.pallet_height = item.get("pallet_height")
        
        sp.packed_pb_length = item.get("packed_pb_length")
        sp.packed_pb_width = item.get("packed_pb_width")
        sp.packed_pb_height = item.get("packed_pb_height")

         # 🔽 Recalculate/edited final values here permanently saved 
        sp.saved_cartons_per_20ft = item.get("saved_cartons_per_20ft")
        sp.saved_cartons_per_40ft = item.get("saved_cartons_per_40ft")
        sp.saved_pdq_per_20ft = item.get("saved_pdq_per_20ft")
        sp.saved_pdq_per_40ft = item.get("saved_pdq_per_40ft")
        sp.saved_pallet_per_20ft = item.get("saved_pallet_per_20ft")
        sp.saved_pallet_per_40ft = item.get("saved_pallet_per_40ft")
        sp.saved_cbm_per_carton = item.get("saved_cbm_per_carton")

      

        sp.save()

        create_log(
            module_name="Sub Program",
            record_id=sp.id,
            action="TQM Updated",
            message="Carton/PDQ/Pallet updated",
            user=request.user
        )

    # --------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------
    
    notification = NotificationService()

    try:
        notification.send_purchase_notification(program)
    except Exception as e:
        print("Email failed:", str(e))

    return Response(
        {"message": "TQM subprogram details updated successfully"},
        status=200
    )


# ------------------------------------------------------------------
# API: Upload Carton Program Attachment
# Description:
#   Uploads file and links it to a carton program
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
    operation_summary="Upload Carton Program Attachment",
    operation_description="Uploads attachment file and links it to a carton program",
    manual_parameters=[
        openapi.Parameter(
            "program_id",
            openapi.IN_FORM,
            type=openapi.TYPE_INTEGER,
            required=True,
            description="CartonProgram ID"
        ),
        openapi.Parameter(
            "file",
            openapi.IN_FORM,
            type=openapi.TYPE_FILE,
            required=True,
            description="Attachment file"
        ),
        openapi.Parameter(
            "description",
            openapi.IN_FORM,
            type=openapi.TYPE_STRING,
            required=False,
            description="Optional description"
        )
    ],
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "message": openapi.Schema(type=openapi.TYPE_STRING)
            }
        )
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])   # ✅ THIS LINE
def upload_carton_program_attachment(request):


    program_id = request.data.get("program_id")
    file = request.FILES.get("file")
    description = request.data.get("description", "")

    if not program_id or not file:
        return Response(
            {"error": "program_id and file are required"},
            status=400
        )

    try:
        program = CartonProgram.objects.get(id=program_id)
    except CartonProgram.DoesNotExist:
        return Response(
            {"error": "Invalid program_id"},
            status=404
        )

    CartonProgramAttachment.objects.create(
        program=program,
        file=file,
        description=description
    )

    return Response({"message": "Attachment uploaded successfully"})





purchase_action_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={
        "activity_program_status_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="ActivityProgramStatus ID"
        )
    }
)


simple_message_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "message": openapi.Schema(type=openapi.TYPE_STRING)
    }
)


purchase_list_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "activity_program_status_id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "activity": openapi.Schema(type=openapi.TYPE_STRING),
        "program_name": openapi.Schema(type=openapi.TYPE_STRING),
        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
        "request_type": openapi.Schema(type=openapi.TYPE_STRING),
        "status": openapi.Schema(type=openapi.TYPE_STRING),
        "created_on": openapi.Schema(type=openapi.TYPE_STRING),
    }
)

# ------------------------------------------------------------------
# API: Purchase Assigned Activities
#
# Description:
#   Returns activities where logged-in purchase user
#   has action required.
#
# Includes:
#   - Activity details
#   - Program type (for dynamic rendering)
#   - Request type (Sample / Carton Sizing / Both)
#   - Status
#   - Created timestamp
#
# Method: GET
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="get",
    operation_summary="Purchase Assigned Activities",
    operation_description="Returns activities assigned to logged-in purchase user",
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=purchase_list_response_schema
        ),
        401: "Unauthorized"
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def purchase_assigned_activities(request):

    records = ActivityProgramStatus.objects.select_related(
        "program"
    ).filter(
        purchase_sent_to=request.user
    )

    data = []

    for r in records:

        request_type = []

        if r.request_sample:
            request_type.append("Sample")

        if r.request_carton_sizing:
            request_type.append("Carton Sizing")

        data.append({
            "activity_program_status_id": r.id,
            "activity": r.activity,
            "program_name": r.program.program_name,
            "customer_name": r.program.customer_name,
            "program_type": r.program.program_type,   # 🔥 IMPORTANT ADDITION
            "request_type": " + ".join(request_type),
            "status": r.status,
            "created_on": r.created_on.strftime("%d-%m-%Y %H:%M:%S")
            if r.created_on else None,
        })

    return Response(data)

# ------------------------------------------------------------------
# API: Purchase Submit Completion
# Description:
#   Marks request as final submitted
# ------------------------------------------------------------------


@swagger_auto_schema(
    method="post",
    operation_summary="Purchase Submit Completion",
    operation_description="Marks request as final submitted by purchase",
    request_body=purchase_action_schema,
    responses={
        200: simple_message_response,
        400: "Bad Request",
        404: "Not Found"
    }
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def purchase_submit_completion(request):

    aps_id = request.data.get("activity_program_status_id")

    try:
        aps = ActivityProgramStatus.objects.get(id=aps_id)
    except ActivityProgramStatus.DoesNotExist:
        return Response({"error": "Invalid id"}, status=404)

    aps.status = "Final Working Submitted"
    aps.save()

    try:
        notification = NotificationService()
        notification.send_warehouse_notification(aps.program)
    except Exception as e:
        print("Email failed:", str(e))
    
    create_log(
        module_name="Purchase",
        record_id=aps.id,
        action="Completed",
        message="Purchase completed request",
        user=request.user
    )

    return Response({"message": "Final submitted"})



# ------------------------------------------------------------------
# API: Purchase Accept Request
# Description:
#   Purchase user accepts the requested activity
# ------------------------------------------------------------------


@swagger_auto_schema(
    method="post",
    operation_summary="Purchase Accept Request",
    operation_description="Marks request as accepted by purchase user",
    request_body=purchase_action_schema,
    responses={
        200: simple_message_response,
        400: "Bad Request",
        404: "Not Found"
    }
)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def purchase_accept_request(request):

    aps_id = request.data.get("activity_program_status_id")

    if not aps_id:
        return Response(
            {"error": "activity_program_status_id is required"},
            status=400
        )

    try:
        aps = ActivityProgramStatus.objects.get(id=aps_id)
    except ActivityProgramStatus.DoesNotExist:
        return Response(
            {"error": "Invalid activity_program_status_id"},
            status=404
        )

    aps.status = "Sample Request Accepted"
    aps.save()

    create_log(
        module_name="Purchase",
        record_id=aps.id,
        action="Accepted",
        message="Purchase accepted the request",
        user=request.user
    )

    return Response({"message": "Request accepted successfully"})



# ------------------------------------------------------------------
# API: Warehouse Dashboard Data
#
# Description:
#   Returns all subprograms where activity status
#   is "Final Working Submitted".
#
#   Includes:
#   - Program information
#   - Product type
#   - Warehouse fields
#   - Calculated totals
#   - Container capacity
#
# Method: GET
# ------------------------------------------------------------------


# ------------------------------------------------------------------
# Swagger Schema: Warehouse Dashboard Response
# ------------------------------------------------------------------

warehouse_dashboard_response_schema = openapi.Schema(
    type=openapi.TYPE_ARRAY,
    items=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={

            "subprogram_id": openapi.Schema(type=openapi.TYPE_INTEGER),

            "program_name": openapi.Schema(type=openapi.TYPE_STRING),
            "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
            "program_type": openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=["TOWEL", "BEDSHEET", "TERRY TOWEL", "BATH ROBE"]
            ),

            "article_no": openapi.Schema(type=openapi.TYPE_STRING),
            "so_item_text": openapi.Schema(type=openapi.TYPE_STRING),
            "possible_ca": openapi.Schema(type=openapi.TYPE_INTEGER),
            "ship_qty": openapi.Schema(type=openapi.TYPE_INTEGER),

            "pieces_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
            "height": openapi.Schema(type=openapi.TYPE_NUMBER),
            "width": openapi.Schema(type=openapi.TYPE_NUMBER),
            "length": openapi.Schema(type=openapi.TYPE_NUMBER),

            "cbm_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
            "net_wt_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
            "gross_wt_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),

            "total_cbm": openapi.Schema(type=openapi.TYPE_NUMBER),
            "total_net_wt": openapi.Schema(type=openapi.TYPE_NUMBER),
            "total_gross_wt": openapi.Schema(type=openapi.TYPE_NUMBER),

            "cartons_per_20ft": openapi.Schema(type=openapi.TYPE_NUMBER),
            "cartons_per_40ft": openapi.Schema(type=openapi.TYPE_NUMBER),

            "upc": openapi.Schema(type=openapi.TYPE_STRING),
            "final_destination": openapi.Schema(type=openapi.TYPE_STRING),
        }
    )
)


@swagger_auto_schema(
    method="get",
    operation_summary="Warehouse Dashboard Data",
    operation_description="Returns finalized subprogram data for warehouse dashboard",
    responses={
        200: warehouse_dashboard_response_schema,
        401: "Unauthorized"
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def warehouse_dashboard(request):

    subprograms = CartonProgramSubProgram.objects.select_related(
        "carton_program"
    ).filter(
        carton_program__activity_statuses__status="Final Working Submitted"
    ).distinct()

    data = []

    for sp in subprograms:

        program = sp.carton_program

        data.append({
            "subprogram_id": sp.id,

            # Program Info
            "program_name": program.program_name,
            "customer_name": program.customer_name,
            "program_type": program.program_type,

            # Warehouse Fields
            "article_no": sp.article_no,
            "so_item_text": sp.so_item_text,
            "possible_ca": sp.possible_ca,
            "ship_qty": sp.ship_qty,

            # Carton Dimensions
            "pieces_per_carton": sp.pieces_per_carton,
            "height": sp.carton_height,
            "width": sp.carton_width,
            "length": sp.carton_length,

            # Calculations
            "cbm_per_carton": sp.cbm_per_carton,
            "net_wt_per_carton": sp.net_wt_per_carton,
            "gross_wt_per_carton": sp.gross_wt_per_carton,

            "total_cbm": sp.total_cbm,
            "total_net_wt": sp.total_net_wt,
            "total_gross_wt": sp.total_gross_wt,

            # Container
            "cartons_per_20ft": sp.cartons_per_container("20FT"),
            "cartons_per_40ft": sp.cartons_per_container("40FT"),

            "upc": sp.upc,
            "final_destination": sp.final_destination,
        })

    return Response(data)




# ------------------------------------------------------------------
# API: Update Warehouse Row
#
# Description:
#   Allows warehouse to update final shipment details.
#
#   Updates:
#   - possible_ca
#   - ship_qty
#   - gross_wt_per_carton
#   - upc
#   - final_destination
#
#   Only allowed for programs with status:
#   "Final Working Submitted"
#
#   Returns recalculated totals and container capacity.
#
# Method: POST
# ------------------------------------------------------------------



# ------------------------------------------------------------------
# Swagger Schema: Warehouse Update
# ------------------------------------------------------------------

warehouse_update_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["subprogram_id"],
    properties={
        "subprogram_id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "possible_ca": openapi.Schema(type=openapi.TYPE_INTEGER),
        "ship_qty": openapi.Schema(type=openapi.TYPE_INTEGER),
        "gross_wt_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
        "upc": openapi.Schema(type=openapi.TYPE_STRING),
        "final_destination": openapi.Schema(type=openapi.TYPE_STRING),
    }
)

warehouse_update_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "message": openapi.Schema(type=openapi.TYPE_STRING),

        "cbm_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
        "net_wt_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),

        "total_cbm": openapi.Schema(type=openapi.TYPE_NUMBER),
        "total_net_wt": openapi.Schema(type=openapi.TYPE_NUMBER),
        "total_gross_wt": openapi.Schema(type=openapi.TYPE_NUMBER),

        "cartons_per_20ft": openapi.Schema(type=openapi.TYPE_NUMBER),
        "cartons_per_40ft": openapi.Schema(type=openapi.TYPE_NUMBER),
    }
)



@swagger_auto_schema(
    method="post",
    operation_summary="Update Warehouse Row",
    request_body=warehouse_update_schema,
    responses={
        200: warehouse_update_response_schema,
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_warehouse_row(request):

    data = request.data
    subprogram_id = data.get("subprogram_id")

    if not subprogram_id:
        return Response(
            {"error": "subprogram_id is required"},
            status=400
        )

    try:
        sp = CartonProgramSubProgram.objects.select_related(
            "carton_program"
        ).get(id=subprogram_id)
    except CartonProgramSubProgram.DoesNotExist:
        return Response(
            {"error": "Invalid subprogram_id"},
            status=404
        )

    # --------------------------------------------------
    # VALIDATE STATUS
    # --------------------------------------------------

    if not sp.carton_program.activity_statuses.filter(
        status="Final Working Submitted"
    ).exists():
        return Response(
            {"error": "Only finalized programs can be updated"},
            status=400
        )

    # --------------------------------------------------
    # UPDATE FIELDS
    # --------------------------------------------------

    sp.possible_ca = data.get("possible_ca", sp.possible_ca)
    sp.ship_qty = data.get("ship_qty", sp.ship_qty)
    sp.gross_wt_per_carton = data.get("gross_wt_per_carton", sp.gross_wt_per_carton)
    sp.upc = data.get("upc", sp.upc)
    sp.final_destination = data.get("final_destination", sp.final_destination)

    sp.save()

    # --------------------------------------------------
    # LOG
    # --------------------------------------------------

    create_log(
        module_name="Warehouse",
        record_id=sp.id,
        action="Updated",
        message="Warehouse updated shipment details",
        user=request.user
    )

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return Response({
        "message": "Updated Successfully",

        "cbm_per_carton": sp.cbm_per_carton,
        "net_wt_per_carton": sp.net_wt_per_carton,

        "total_cbm": sp.total_cbm,
        "total_net_wt": sp.total_net_wt,
        "total_gross_wt": sp.total_gross_wt,

        "cartons_per_20ft": sp.cartons_per_container("20FT"),
        "cartons_per_40ft": sp.cartons_per_container("40FT"),
    })





# ------------------------------------------------------------------
# Swagger Schema: Gusset Program Specification
# ------------------------------------------------------------------

gusset_program_spec_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "program": openapi.Schema(type=openapi.TYPE_STRING),
        "style": openapi.Schema(type=openapi.TYPE_STRING),

        "width_in": openapi.Schema(type=openapi.TYPE_NUMBER),
        "width_cm": openapi.Schema(type=openapi.TYPE_NUMBER),

        "length_in": openapi.Schema(type=openapi.TYPE_NUMBER),
        "length_cm": openapi.Schema(type=openapi.TYPE_NUMBER),

        "wt_per_unit": openapi.Schema(type=openapi.TYPE_NUMBER),

        "gsm": openapi.Schema(type=openapi.TYPE_NUMBER),

        "unit_per_carton": openapi.Schema(type=openapi.TYPE_INTEGER),

        "inner_pack_unit_qty": openapi.Schema(type=openapi.TYPE_STRING),

        "fold": openapi.Schema(type=openapi.TYPE_STRING),
    }
)


# ------------------------------------------------------------------
# Swagger Schema: Gusset Sample Program
# ------------------------------------------------------------------

gusset_sample_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "program_name": openapi.Schema(type=openapi.TYPE_STRING),
        "size": openapi.Schema(type=openapi.TYPE_STRING),
        "sample": openapi.Schema(type=openapi.TYPE_STRING),
        "quality": openapi.Schema(type=openapi.TYPE_STRING),

        "lbs_per_dz": openapi.Schema(type=openapi.TYPE_NUMBER),

        "gsm": openapi.Schema(type=openapi.TYPE_NUMBER),

        "shade": openapi.Schema(type=openapi.TYPE_STRING),

        "width_in": openapi.Schema(type=openapi.TYPE_NUMBER),
        "length_in": openapi.Schema(type=openapi.TYPE_NUMBER),

        "width_cm": openapi.Schema(type=openapi.TYPE_NUMBER),
        "length_cm": openapi.Schema(type=openapi.TYPE_NUMBER),
    }
)


# ------------------------------------------------------------------
# Swagger Schema: Submit Gusset Program
# ------------------------------------------------------------------

submit_gusset_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["customer_name", "program_name"],
    properties={

        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),

        "program_name": openapi.Schema(type=openapi.TYPE_STRING),
        "other_size": openapi.Schema(type=openapi.TYPE_STRING),
        "fold_length": openapi.Schema(type=openapi.TYPE_STRING),
        "fold_width": openapi.Schema(type=openapi.TYPE_STRING),
        "gusset_bank": openapi.Schema(type=openapi.TYPE_STRING),

        "tc": openapi.Schema(type=openapi.TYPE_STRING),
        "weave": openapi.Schema(type=openapi.TYPE_STRING),
        "product_group": openapi.Schema(type=openapi.TYPE_STRING),

        "size": openapi.Schema(type=openapi.TYPE_STRING),

        "down": openapi.Schema(type=openapi.TYPE_STRING),

        "value_addition_flat_sheet": openapi.Schema(type=openapi.TYPE_STRING),
        "value_addition_duvet_cover": openapi.Schema(type=openapi.TYPE_STRING),
        "value_addition_fitted_sheet": openapi.Schema(type=openapi.TYPE_STRING),
        "value_addition_pillowcase": openapi.Schema(type=openapi.TYPE_STRING),

        "fold_size_inches": openapi.Schema(type=openapi.TYPE_STRING),

        "polybag_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "fold_type": openapi.Schema(type=openapi.TYPE_STRING),

        "ply": openapi.Schema(type=openapi.TYPE_STRING),

        "fold_on_side": openapi.Schema(type=openapi.TYPE_STRING),

        "reference_program": openapi.Schema(type=openapi.TYPE_STRING),

        "comments": openapi.Schema(type=openapi.TYPE_STRING),

        "polybag_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),

        "material_type": openapi.Schema(type=openapi.TYPE_STRING),

        "opening_type": openapi.Schema(type=openapi.TYPE_STRING),

        "opening_on_side": openapi.Schema(type=openapi.TYPE_STRING),

        "inlay_or_belly_band": openapi.Schema(type=openapi.TYPE_STRING),

        "polybag_type": openapi.Schema(type=openapi.TYPE_STRING),

        "program_specifications": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=gusset_program_spec_schema
        ),

        "samples": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=gusset_sample_schema
        )
    }
)


# ------------------------------------------------------------------
# API: Submit Gusset Program
#
# Description:
#   Creates a new Gusset program with:
#   - Product details
#   - Cardboard stiffener details
#   - Polybag details
#   - Program specifications
#   - Sample programs
#
# Method: POST
# ------------------------------------------------------------------


# @swagger_auto_schema(
#     method="post",
#     operation_summary="Submit Gusset Program",
#     request_body=submit_gusset_schema,
#     responses={
#         201: "Program Created",
#         400: "Bad Request"
#     }
# )

# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def submit_gusset_program(request):

#     data = request.data

#     specs = data.get("program_specifications", [])
#     samples = data.get("samples", [])

#     gusset = GussetProgram.objects.create(

#         customer_name=data.get("customer_name"),
#         program_name=data.get("program_name"),

#         tc=data.get("tc"),
#         weave=data.get("weave"),
#         product_group=data.get("product_group"),
#         size=data.get("size"),
#         down=data.get("down"),

#         value_addition_flat_sheet=data.get("value_addition_flat_sheet"),
#         value_addition_duvet_cover=data.get("value_addition_duvet_cover"),
#         value_addition_fitted_sheet=data.get("value_addition_fitted_sheet"),
#         value_addition_pillowcase=data.get("value_addition_pillowcase"),

#         fold_size_inches=data.get("fold_size_inches"),

#         cardboard_required=data.get("cardboard_required"),
#         fold_type=data.get("fold_type"),
#         ply=data.get("ply"),
#         fold_on_side=data.get("fold_on_side"),

#         reference_program=data.get("reference_program"),
#         comments=data.get("comments"),

#         polybag_required=data.get("polybag_required"),
#         material_type=data.get("material_type"),
#         opening_type=data.get("opening_type"),
#         opening_on_side=data.get("opening_on_side"),
#         inlay_or_belly_band=data.get("inlay_or_belly_band"),
#         polybag_type=data.get("polybag_type"),

#         created_by=request.user
#     )

#     # Program Specs

#     for sp in specs:

#         GussetProgramSpecification.objects.create(
#             gusset_program=gusset,
#             program=sp.get("program"),
#             style=sp.get("style"),
#             width_in=sp.get("width_in"),
#             width_cm=sp.get("width_cm"),
#             length_in=sp.get("length_in"),
#             length_cm=sp.get("length_cm"),
#             wt_per_unit=sp.get("wt_per_unit"),
#             gsm=sp.get("gsm"),
#             unit_per_carton=sp.get("unit_per_carton"),
#             inner_pack_unit_qty=sp.get("inner_pack_unit_qty"),
#             fold=sp.get("fold"),
#         )

#     # Sample Programs

#     for sm in samples:

#         GussetSampleProgram.objects.create(
#             gusset_program=gusset,
#             program_name=sm.get("program_name"),
#             size=sm.get("size"),
#             sample=sm.get("sample"),
#             quality=sm.get("quality"),
#             lbs_per_dz=sm.get("lbs_per_dz"),
#             gsm=sm.get("gsm"),
#             shade=sm.get("shade"),
#             width_in=sm.get("width_in"),
#             length_in=sm.get("length_in"),
#             width_cm=sm.get("width_cm"),
#             length_cm=sm.get("length_cm"),
#         )

#     return Response({
#         "message": "Gusset Program Created",
#         "program_id": gusset.id
#     })
    
@swagger_auto_schema(
    method="post",
    operation_summary="Submit Gusset Program",
    request_body=submit_gusset_schema,
    responses={
        201: "Program Created",
        400: "Bad Request"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def submit_gusset_program(request):

    data = request.data

    # Step 15a: Validate required fields
    customer_name = data.get("customer_name")
    program_name = data.get("program_name")
    activity_name = data.get("activity_name")
    sent_to_user_id = data.get("sent_to_user_id")
    btn = data.get("btn", "")

    if not customer_name:
        return Response({"error": "customer_name is required"}, status=400)
    if not program_name:
        return Response({"error": "program_name is required"}, status=400)
    if not activity_name:
        return Response({"error": "activity_name is required"}, status=400)

    specs = data.get("program_specifications", [])
    samples = data.get("samples", [])

    # Step 15b: Handle "Other" size logic
    gusset_size = data.get("size")
    other_size = data.get("other_size") if gusset_size == "Other" else None

    # Step 15c: Create main GussetProgram record
    gusset = GussetProgram.objects.create(
        customer_name=customer_name,
        program_name=program_name,

        tc=data.get("tc"),
        weave=data.get("weave"),
        product_group=data.get("product_group"),
        size=gusset_size,
        other_size=other_size,
        down=data.get("down"),

        value_addition_flat_sheet=data.get("value_addition_flat_sheet"),
        value_addition_duvet_cover=data.get("value_addition_duvet_cover"),
        value_addition_fitted_sheet=data.get("value_addition_fitted_sheet"),
        value_addition_pillowcase=data.get("value_addition_pillowcase"),

        fold_size_inches=data.get("fold_size_inches"),
        fold_length=data.get("fold_length"),
        fold_width=data.get("fold_width"),

        gusset_bank=data.get("gusset_bank"),

        cardboard_required=to_bool(data.get("cardboard_required")),
        fold_type=data.get("fold_type"),
        ply=data.get("ply"),
        fold_on_side=data.get("fold_on_side"),

        reference_program=data.get("reference_program"),
        comments=data.get("comments"),

        polybag_required=to_bool(data.get("polybag_required")),
        material_type=data.get("material_type"),
        opening_type=data.get("opening_type"),
        opening_on_side=data.get("opening_on_side"),
        inlay_or_belly_band=data.get("inlay_or_belly_band"),
        polybag_type=data.get("polybag_type"),

        created_by=request.user
    )

    # Step 15d: Save program specifications (loop)
    # New format: each spec row is {size, fold_length, fold_width, gusset_name, wt, gsm}
    for sp in specs:
        GussetProgramSpecification.objects.create(
            gusset_program=gusset,
            size=sp.get("size"),
            fold_length=sp.get("fold_length"),
            fold_width=sp.get("fold_width"),
            gusset_name=sp.get("gusset_name"),
            wt=sp.get("wt"),
            gsm=sp.get("gsm"),
        )

    # Step 15e: Save sample programs (loop)
    sample_ids = []
    for sm in samples:
        sample_obj = GussetSampleProgram.objects.create(
            gusset_program=gusset,
            program_name=sm.get("program_name"),
            size=sm.get("size"),
            sample=sm.get("sample"),
            quality=sm.get("quality"),
            lbs_per_dz=sm.get("lbs_per_dz"),
            gsm=sm.get("gsm"),
            shade=sm.get("shade"),
            width_in=sm.get("width_in"),
            length_in=sm.get("length_in"),
            width_cm=sm.get("width_cm"),
            length_cm=sm.get("length_cm"),
        )
        sample_ids.append(sample_obj.id)

    # Step 15f: Create ActivityProgramStatus row — this is what plugs the
    # gusset program into the same pipeline (assign/accept/reject/recall)
    # that CartonProgram already uses.
    status_value = "Draft" if btn.lower() == "save as draft" else "Pending"

    aps = ActivityProgramStatus.objects.create(
        activity=activity_name,
        gusset_program=gusset,
        program=None,
        status=status_value,
        sent_to_id=sent_to_user_id,
        created_by=request.user
    )

    # Step 15g: Create audit log entry
    create_log(
        module_name="GussetProgram",
        record_id=gusset.id,
        action="Created",
        message=f"Gusset program '{program_name}' created",
        user=request.user
    )

    # Step 15h: Notify assigned user (best-effort, same pattern as carton submit)
    User = get_user_model()
    notification = NotificationService()

    if status_value != "Draft" and sent_to_user_id:
        try:
            User.objects.get(id=sent_to_user_id)
            notification.send_tqm_notification(gusset)
        except User.DoesNotExist:
            logger.warning("sent_to_user_id %s not found for gusset program %s", sent_to_user_id, gusset.id)
        except Exception:
            logger.exception("Failed to send notification for gusset program %s", gusset.id)

    return Response(
        {
            "message": "Gusset Program Created",
            "program_id": gusset.id,
            "activity_program_status_id": aps.id,
            "sample_ids": sample_ids
        },
        status=201
    )


# ------------------------------------------------------------------
# Swagger Schema: Gusset List Response
# ------------------------------------------------------------------

gusset_list_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={

        "program_id": openapi.Schema(type=openapi.TYPE_INTEGER),

        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),

        "program_name": openapi.Schema(type=openapi.TYPE_STRING),

        "created_on": openapi.Schema(type=openapi.TYPE_STRING),
    }
)


# ------------------------------------------------------------------
# API: List Gusset Programs
#
# Description:
#   Returns all Gusset programs for dashboard listing.
#
# Method: GET
# ------------------------------------------------------------------


@swagger_auto_schema(
    method="get",
    operation_summary="List Gusset Programs",
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=gusset_list_schema
        )
    }
)

    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_gusset_program(request):

    records = GussetProgram.objects.all()

    data = []

    for r in records:

        data.append({
            "program_id": r.id,
            "customer_name": r.customer_name,
            "program_name": r.program_name,
            "created_on": r.created_on.strftime("%d-%m-%Y"),
            "expected_date_program": r.expected_date_confirmation
        })

    return Response(data)




# ------------------------------------------------------------------
# Swagger Schema: Gusset Details Request
# ------------------------------------------------------------------

gusset_details_request_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["program_id"],
    properties={
        "program_id": openapi.Schema(
            type=openapi.TYPE_INTEGER
        )
    }
)


# ------------------------------------------------------------------
# API: Get Gusset Program Details
#
# Description:
#   Returns complete Gusset program including:
#   - Product section
#   - Cardboard stiffener section
#   - Polybag section
#   - Program specifications
#   - Sample programs
#
# Used when user clicks "View" on the list page.
#
# Method: POST
# ------------------------------------------------------------------


# @swagger_auto_schema(
#     method="post",
#     operation_summary="Get Gusset Program Details",
#     request_body=gusset_details_request_schema,
# )


# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def get_gusset_program_details(request):

#     program_id = request.data.get("program_id")

#     gusset = GussetProgram.objects.get(id=program_id)

#     specs = []
#     samples = []

#     for s in gusset.program_specifications.all():

#         specs.append({
#             "program": s.program,
#             "style": s.style,
#             "width_in": s.width_in,
#             "width_cm": s.width_cm,
#             "length_in": s.length_in,
#             "length_cm": s.length_cm,
#             "wt_per_unit": s.wt_per_unit,
#             "gsm": s.gsm,
#             "unit_per_carton": s.unit_per_carton,
#             "inner_pack_unit_qty": s.inner_pack_unit_qty,
#             "fold": s.fold,
            

#         })

#     for sm in gusset.samples.all():

#         samples.append({
#             "program_name": sm.program_name,
#             "size": sm.size,
#             "sample": sm.sample,
#             "quality": sm.quality,
#             "gsm": sm.gsm,
#             "shade": sm.shade
#         })

#     return Response({

#         "program_id": gusset.id,

#         "customer_name": gusset.customer_name,
#         "program_name": gusset.program_name,

#         "tc": gusset.tc,
#         "weave": gusset.weave,
#         "product_group": gusset.product_group,
#         "size": gusset.size,
#         "expected_date_program": gusset.expected_date_confirmation,

#         "program_specifications": specs,

#         "samples": samples
#     })
    
@swagger_auto_schema(
    method="post",
    operation_summary="Get Gusset Program Details",
    request_body=gusset_details_request_schema,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_gusset_program_details(request):

    # Step 24: Accept activity_program_status_id (same key used everywhere
    # else in the pipeline) instead of a raw gusset program_id.
    aps_id = request.data.get("activity_program_status_id")

    if not aps_id:
        return Response({"error": "activity_program_status_id is required"}, status=400)

    try:
        aps = ActivityProgramStatus.objects.select_related("gusset_program").get(id=aps_id)
    except ActivityProgramStatus.DoesNotExist:
        return Response({"error": "Invalid activity_program_status_id"}, status=404)

    if not aps.gusset_program_id:
        return Response({"error": "This activity is not a gusset program"}, status=400)

    gusset = aps.gusset_program

    specs = []
    for s in gusset.program_specifications.all():
        specs.append({
            "spec_id": s.id,
            "size": s.size,
            "fold_length": s.fold_length,
            "fold_width": s.fold_width,
            "gusset_name": s.gusset_name,
            "wt": s.wt,
            "gsm": s.gsm,
            "is_finalized_by_tqm": s.is_finalized_by_tqm,
        })

    samples = []
    for sm in gusset.samples.all():
        sample_attachments = [
            {
                "id": att.id,
                "file_url": request.build_absolute_uri(att.file.url),
                "description": att.description,
                "uploaded_on": att.uploaded_on.strftime("%d-%m-%Y")
            }
            for att in sm.attachments.all()
        ]
        samples.append({
            "sample_id": sm.id,
            "program_name": sm.program_name,
            "size": sm.size,
            "sample": sm.sample,
            "quality": sm.quality,
            "gsm": sm.gsm,
            "shade": sm.shade,
            "lbs_per_dz": sm.lbs_per_dz,
            "width_in": sm.width_in,
            "width_cm": sm.width_cm,
            "length_in": sm.length_in,
            "length_cm": sm.length_cm,
            "attachments": sample_attachments,
        })

    # Program-level attachments
    attachments = []
    for att in gusset.attachments.all():
        attachments.append({
            "id": att.id,
            "file_url": request.build_absolute_uri(att.file.url),
            "description": att.description,
            "uploaded_on": att.uploaded_on.strftime("%d-%m-%Y")
        })

    return Response({
        "activity_program_status_id": aps.id,
        "activity": aps.activity,
        "status": aps.status,               # pipeline status now lives on ActivityProgramStatus
        "rejection_reason": aps.rejection_reason,
        "sent_to_user_id": aps.sent_to_id,

        "program_id": gusset.id,
        "customer_name": gusset.customer_name,
        "program_name": gusset.program_name,

        "tc": gusset.tc,
        "weave": gusset.weave,
        "product_group": gusset.product_group,
        "size": gusset.size,
        "other_size": gusset.other_size,

        "fold_length": gusset.fold_length,
        "fold_width": gusset.fold_width,
        "gusset_bank": gusset.gusset_bank,

        "cardboard_required": gusset.cardboard_required,
        "fold_type": gusset.fold_type,
        "ply": gusset.ply,
        "fold_on_side": gusset.fold_on_side,

        "polybag_required": gusset.polybag_required,
        "material_type": gusset.material_type,
        "opening_type": gusset.opening_type,
        "opening_on_side": gusset.opening_on_side,
        "inlay_or_belly_band": gusset.inlay_or_belly_band,
        "polybag_type": gusset.polybag_type,

        "reference_program": gusset.reference_program,
        "comments": gusset.comments,

        "expected_date_program": gusset.expected_date_confirmation,

        "program_specifications": specs,
        "samples": samples,
        "attachments": attachments
    })

# ------------------------------------------------------------------
# Swagger Schema: Edit Gusset Program
# ------------------------------------------------------------------

gusset_edit_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["program_id"],
    properties={

        "program_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Gusset Program ID"
        ),

        "expected_date_confirmation": openapi.Schema(
            type=openapi.TYPE_STRING,
            format="date",
            description="Expected date confirmation"
        )
    }
)

gusset_edit_response_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "message": openapi.Schema(type=openapi.TYPE_STRING)
    }
)

# ------------------------------------------------------------------
# API: Edit Gusset Program
#
# Description:
#   Updates specific fields of Gusset Program.
#
#   Currently supports:
#   - expected_date_confirmation
#
# Method: POST
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
    operation_summary="Edit Gusset Program",
    request_body=gusset_edit_schema,
    responses={
        200: gusset_edit_response_schema,
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def edit_gusset_program(request):

    data = request.data
    program_id = data.get("program_id")

    if not program_id:
        return Response(
            {"error": "program_id is required"},
            status=400
        )

    try:
        sp = GussetProgram.objects.get(id=program_id)
    except GussetProgram.DoesNotExist:
        return Response(
            {"error": "Invalid program_id"},
            status=404
        )

    sp.expected_date_confirmation = data.get(
        "expected_date_confirmation",
        sp.expected_date_confirmation
    )

    sp.save()

    create_log(
        module_name="GussetProgram",
        record_id=sp.id,
        action="Updated",
        message="Gusset Program Expected Date Updated",
        user=request.user
    )

    return Response(
        {"message": "Gusset Expected Date Updated Successfully"},
        status=200
    )
    
    
# ------------------------------------------------------------------
# Swagger Schema: Accept Gusset Program
# ------------------------------------------------------------------

gusset_accept_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["program_id"],
    properties={
        "program_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="Gusset Program ID"
        )
    }
)


# ------------------------------------------------------------------
# API: Accept Gusset Program
#
# Description:
#   Marks the Gusset Program as Accepted.
#
# Method: POST
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
    operation_summary="Accept Gusset Program",
    request_body=gusset_accept_schema,
    responses={
        200: "Accepted Successfully",
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_gusset_program(request):

    program_id = request.data.get("program_id")

    if not program_id:
        return Response(
            {"error": "program_id is required"},
            status=400
        )

    try:
        sp = GussetProgram.objects.get(id=program_id)
    except GussetProgram.DoesNotExist:
        return Response(
            {"error": "Invalid program_id"},
            status=404
        )

    sp.status = "Accepted"
    sp.rejection_reason = None
    sp.save()

    create_log(
        module_name="GussetProgram",
        record_id=sp.id,
        action="Accepted",
        message="Gusset Program Accepted",
        user=request.user
    )

    return Response(
        {"message": "Gusset Program Accepted Successfully"},
        status=200
    )
    
    
# ------------------------------------------------------------------
# Swagger Schema: Reject Gusset Program
# ------------------------------------------------------------------

gusset_reject_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["program_id", "rejection_reason"],
    properties={
        "program_id": openapi.Schema(
            type=openapi.TYPE_INTEGER
        ),
        "rejection_reason": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Reason for rejection"
        )
    }
)


# ------------------------------------------------------------------
# API: Reject Gusset Program
#
# Description:
#   Rejects the Gusset Program with a reason.
#
# Method: POST
# ------------------------------------------------------------------

@swagger_auto_schema(
    method="post",
    operation_summary="Reject Gusset Program",
    request_body=gusset_reject_schema,
    responses={
        200: "Rejected Successfully",
        400: "Bad Request",
        404: "Not Found"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_gusset_program(request):

    program_id = request.data.get("program_id")
    rejection_reason = request.data.get("rejection_reason")

    if not program_id:
        return Response(
            {"error": "program_id is required"},
            status=400
        )

    if not rejection_reason:
        return Response(
            {"error": "rejection_reason is required"},
            status=400
        )

    try:
        sp = GussetProgram.objects.get(id=program_id)
    except GussetProgram.DoesNotExist:
        return Response(
            {"error": "Invalid program_id"},
            status=404
        )

    sp.status = "Rejected"
    sp.rejection_reason = rejection_reason
    sp.save()

    create_log(
        module_name="GussetProgram",
        record_id=sp.id,
        action="Rejected",
        message=f"Gusset Program Rejected: {rejection_reason}",
        user=request.user
    )

    return Response(
        {"message": "Gusset Program Rejected Successfully"},
        status=200
    )


@swagger_auto_schema(
    method="post",
    operation_summary="Upload Sample Attachment",
    operation_description="Uploads an email/PDF/image attachment and links it to a sample row",
    manual_parameters=[
        openapi.Parameter(
            "sample_id", openapi.IN_FORM,
            type=openapi.TYPE_INTEGER, required=True,
            description="SampleProgram ID"
        ),
        openapi.Parameter(
            "file", openapi.IN_FORM,
            type=openapi.TYPE_FILE, required=True,
            description="Attachment file (.pdf, .eml, .msg, .png, .jpg, .jpeg, .webp)"
        ),
        openapi.Parameter(
            "description", openapi.IN_FORM,
            type=openapi.TYPE_STRING, required=False
        ),
    ],
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={"message": openapi.Schema(type=openapi.TYPE_STRING)}
        )
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_sample_attachment(request):

    sample_id = request.data.get("sample_id")
    file = request.FILES.get("file")
    description = request.data.get("description", "")

    if not sample_id or not file:
        return Response(
            {"error": "sample_id and file are required"},
            status=400
        )

    # 👇 YE NAYA VALIDATION BLOCK ADD KARO
    allowed_extensions = {".pdf", ".eml", ".msg", ".png", ".jpg", ".jpeg", ".gif", ".webp"}
    ext = os.path.splitext(file.name)[1].lower()

    if ext not in allowed_extensions:
        return Response(
            {"error": f"Unsupported file type '{ext}'. Allowed: PDF, email (.eml/.msg), image"},
            status=400
        )

    try:
        sample = SampleProgram.objects.get(id=sample_id)
    except SampleProgram.DoesNotExist:
        return Response({"error": "Invalid sample_id"}, status=404)

    SampleProgramAttachment.objects.create(
        sample=sample,
        file=file,
        description=description
    )

    return Response({"message": "Sample attachment uploaded successfully"})



gusset_submit_final_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={
        "activity_program_status_id": openapi.Schema(type=openapi.TYPE_INTEGER),
    }
)


@swagger_auto_schema(
    method="post",
    operation_summary="Submit Gusset Program as Final (TQM)",
    request_body=gusset_submit_final_schema,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_gusset_final(request):

    aps_id = request.data.get("activity_program_status_id")

    if not aps_id:
        return Response({"error": "activity_program_status_id is required"}, status=400)

    try:
        aps = ActivityProgramStatus.objects.get(
            id=aps_id,
            sent_to=request.user
        )
    except ActivityProgramStatus.DoesNotExist:
        return Response({"error": "Invalid record"}, status=404)

    if not aps.gusset_program_id:
        return Response({"error": "This activity is not a gusset program"}, status=400)

    aps.status = "Final Working Submitted"
    aps.rejection_reason = None
    aps.save()

    create_log(
        module_name="GussetProgram",
        record_id=aps.gusset_program_id,
        action="Final Submitted",
        message=f"Gusset program '{aps.program_name}' marked as Final Working Submitted",
        user=request.user
    )

    return Response({"message": "Gusset Program Final Working Submitted"})

@swagger_auto_schema(
    method="post",
    operation_summary="Upload Gusset Program Attachment",
    manual_parameters=[
        openapi.Parameter("program_id", openapi.IN_FORM, type=openapi.TYPE_INTEGER, required=True),
        openapi.Parameter("file", openapi.IN_FORM, type=openapi.TYPE_FILE, required=True),
        openapi.Parameter("description", openapi.IN_FORM, type=openapi.TYPE_STRING, required=False),
    ],
    responses={200: openapi.Schema(type=openapi.TYPE_OBJECT, properties={"message": openapi.Schema(type=openapi.TYPE_STRING)})}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_gusset_program_attachment(request):

    program_id = request.data.get("program_id")
    file = request.FILES.get("file")
    description = request.data.get("description", "")

    if not program_id or not file:
        return Response({"error": "program_id and file are required"}, status=400)

    try:
        program = GussetProgram.objects.get(id=program_id)
    except GussetProgram.DoesNotExist:
        return Response({"error": "Invalid program_id"}, status=404)

    GussetProgramAttachment.objects.create(
        program=program,
        file=file,
        description=description
    )

    return Response({"message": "Attachment uploaded successfully"})


@swagger_auto_schema(
    method="post",
    operation_summary="Upload Gusset Sample Attachment",
    manual_parameters=[
        openapi.Parameter("sample_id", openapi.IN_FORM, type=openapi.TYPE_INTEGER, required=True),
        openapi.Parameter("file", openapi.IN_FORM, type=openapi.TYPE_FILE, required=True),
        openapi.Parameter("description", openapi.IN_FORM, type=openapi.TYPE_STRING, required=False),
    ],
    responses={200: openapi.Schema(type=openapi.TYPE_OBJECT, properties={"message": openapi.Schema(type=openapi.TYPE_STRING)})}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_gusset_sample_attachment(request):

    sample_id = request.data.get("sample_id")
    file = request.FILES.get("file")
    description = request.data.get("description", "")

    if not sample_id or not file:
        return Response({"error": "sample_id and file are required"}, status=400)

    allowed_extensions = {".pdf", ".eml", ".msg", ".png", ".jpg", ".jpeg", ".gif", ".webp"}
    ext = os.path.splitext(file.name)[1].lower()

    if ext not in allowed_extensions:
        return Response(
            {"error": f"Unsupported file type '{ext}'. Allowed: PDF, email (.eml/.msg), image"},
            status=400
        )

    try:
        sample = GussetSampleProgram.objects.get(id=sample_id)
    except GussetSampleProgram.DoesNotExist:
        return Response({"error": "Invalid sample_id"}, status=404)

    GussetSampleAttachment.objects.create(
        sample=sample,
        file=file,
        description=description
    )

    return Response({"message": "Sample attachment uploaded successfully"})


gusset_specs_update_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["specs"],
    properties={
        "specs": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                required=["spec_id"],
                properties={
                    "spec_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "size": openapi.Schema(type=openapi.TYPE_STRING),
                    "fold_length": openapi.Schema(type=openapi.TYPE_STRING),
                    "fold_width": openapi.Schema(type=openapi.TYPE_STRING),
                    "wt": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "gsm": openapi.Schema(type=openapi.TYPE_NUMBER),
                }
            )
        )
    }
)


@swagger_auto_schema(
    method="post",
    operation_summary="Update Gusset Program Specifications (TQM/PPC editable fields)",
    request_body=gusset_specs_update_schema,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def update_gusset_specs(request):

    specs = request.data.get("specs", [])

    if not specs:
        return Response({"error": "specs list is required"}, status=400)

    updated_count = 0

    for item in specs:
        spec_id = item.get("spec_id")
        if not spec_id:
            continue

        try:
            spec = GussetProgramSpecification.objects.get(id=spec_id)
        except GussetProgramSpecification.DoesNotExist:
            continue

        spec.size = item.get("size")
        spec.fold_length = item.get("fold_length")
        spec.fold_width = item.get("fold_width")
        spec.gusset_name = item.get("gusset_name")
        spec.wt = item.get("wt")
        spec.gsm = item.get("gsm")
        spec.is_finalized_by_tqm = True
        spec.save()

        updated_count += 1

    create_log(
        module_name="GussetProgramSpecification",
        record_id=0,
        action="Updated",
        message=f"{updated_count} gusset specification row(s) updated",
        user=request.user
    )

    return Response({"message": "Specifications updated successfully", "updated_count": updated_count})


# ------------------------------------------------------------------
# SUPERADMIN APIs
# Description:
#   Dashboard for SUPER_ADMIN role — lists ALL Carton + Gusset programs
#   (regardless of who created/is assigned to them) and allows permanent
#   deletion with a dedicated audit log entry.
# ------------------------------------------------------------------

def _is_super_admin(user):
    return getattr(user, "role", None) == "SUPER_ADMIN"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def superadmin_list_all_programs(request):

    if not _is_super_admin(request.user):
        return Response({"error": "Access restricted to Super Admin"}, status=403)

    records = ActivityProgramStatus.objects.select_related(
        "program", "gusset_program", "created_by", "sent_to"
    ).all().order_by("-created_on")

    data = []
    for obj in records:
        if not obj.program_id and not obj.gusset_program_id:
            continue

        data.append({
            "activity_program_status_id": obj.id,
            "activity": obj.activity,
            "program_id": obj.gusset_program_id or obj.program_id,
            "program_name": obj.program_name,
            "customer_name": obj.customer_name,
            "program_type_group": obj.program_type_group,
            "program_type": obj.program.program_type if obj.program_id else "GUSSET",
            "status": obj.status,
            "created_by": obj.created_by.username if obj.created_by else None,
            "sent_to": obj.sent_to.username if obj.sent_to else None,
            "created_on": obj.created_on.strftime("%d-%m-%Y %H:%M:%S") if obj.created_on else None,
        })

    return Response(data)


superadmin_delete_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["activity_program_status_id"],
    properties={
        "activity_program_status_id": openapi.Schema(type=openapi.TYPE_INTEGER),
    }
)


@swagger_auto_schema(
    method="post",
    operation_summary="Super Admin: Permanently delete a Carton or Gusset program",
    request_body=superadmin_delete_schema,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def superadmin_delete_program(request):

    if not _is_super_admin(request.user):
        return Response({"error": "Access restricted to Super Admin"}, status=403)

    aps_id = request.data.get("activity_program_status_id")

    if not aps_id:
        return Response({"error": "activity_program_status_id is required"}, status=400)

    try:
        aps = ActivityProgramStatus.objects.select_related("program", "gusset_program").get(id=aps_id)
    except ActivityProgramStatus.DoesNotExist:
        return Response({"error": "Invalid activity_program_status_id"}, status=404)

    if not aps.program_id and not aps.gusset_program_id:
        return Response({"error": "This activity is not linked to any program"}, status=400)

    program_type = "GUSSET" if aps.gusset_program_id else "CARTON"
    program_obj = aps.gusset_program if aps.gusset_program_id else aps.program
    program_id = program_obj.id
    program_name = obj_name = getattr(program_obj, "program_name", None)
    customer_name = getattr(program_obj, "customer_name", None)

    snapshot = {
        "activity": aps.activity,
        "status": aps.status,
        "program_type": program_type,
        "program_id": program_id,
        "program_name": program_name,
        "customer_name": customer_name,
    }

    # Create the log BEFORE deleting, so we have a record even if delete
    # cascades cause issues.
    SuperAdminDeleteLog.objects.create(
        program_type=program_type,
        program_id=program_id,
        program_name=program_name,
        customer_name=customer_name,
        activity_program_status_id=aps.id,
        deleted_by=request.user,
        snapshot=snapshot,
    )

    # Delete the ActivityProgramStatus row first (it has FK to the program)
    aps.delete()

    # Delete the actual program (CASCADE will clean up subprograms/samples/
    # attachments/specifications automatically via on_delete=models.CASCADE)
    program_obj.delete()

    return Response({"message": f"{program_type} program '{program_name}' permanently deleted"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def superadmin_delete_logs(request):

    if not _is_super_admin(request.user):
        return Response({"error": "Access restricted to Super Admin"}, status=403)

    logs = SuperAdminDeleteLog.objects.select_related("deleted_by").all()

    data = []
    for log in logs:
        data.append({
            "id": log.id,
            "program_type": log.program_type,
            "program_id": log.program_id,
            "program_name": log.program_name,
            "customer_name": log.customer_name,
            "activity_program_status_id": log.activity_program_status_id,
            "deleted_by": log.deleted_by.username if log.deleted_by else "Unknown",
            "deleted_on": to_ist_str(log.deleted_on),
        })

    return Response(data)