"""
COMPLETE FIXED VIEWS.PY - PART 1
Imports, Logger Utility, and Swagger Schemas
"""

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

import logging
import json

from activity_logs.utils import create_log
from programs.services.notification_service import NotificationService

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
    GussetSampleProgram
)

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════════════
# LOGGING UTILITY (Integrated into this file)
# ════════════════════════════════════════════════════════════════════════════

class APILogger:
    """
    Structured logging for Django REST APIs with visual markers.
    """
    
    def __init__(self, api_name: str, user, request_data: dict = None):
        self.api_name = api_name
        self.user = user
        self.request_data = request_data or {}
        self.start_time = timezone.now()
        self.sections = []
        
    def start(self):
        """Log API start"""
        msg = f"""
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🟢 START: {self.api_name:<45}║
║  📅 Timestamp: {self.start_time.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]:<32}║
║  👤 User: {str(self.user):<50}║
║  📦 Request: {str(self.request_data):<45}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"""
        logger.info(msg)
        print(msg)
        
    def section(self, section_name: str, message: str, data: dict = None):
        """Log a processing section"""
        msg = f"[{section_name}] {message}"
        if data:
            msg += f" | {json.dumps(data)}"
        logger.info(msg)
        print(f"  {msg}")
        self.sections.append((section_name, message))
        
    def error(self, message: str, context: dict = None, exception=None):
        """Log an error"""
        msg = f"[ERROR] {message}"
        if context:
            msg += f" | Context: {json.dumps(context)}"
        if exception:
            msg += f" | Exception: {str(exception)}"
        logger.error(msg)
        print(f"  ❌ {msg}")
        
    def warning(self, message: str, context: dict = None):
        """Log a warning"""
        msg = f"[WARNING] {message}"
        if context:
            msg += f" | {json.dumps(context)}"
        logger.warning(msg)
        print(f"  ⚠️  {msg}")
        
    def debug(self, message: str, data: dict = None):
        """Log debug info"""
        msg = f"[DEBUG] {message}"
        if data:
            msg += f" | {json.dumps(data)}"
        logger.debug(msg)
        print(f"  🔍 {msg}")
        
    def end(self, status_code: int, message: str = ""):
        """Log API end"""
        duration = (timezone.now() - self.start_time).total_seconds() * 1000
        status_emoji = "✅" if 200 <= status_code < 300 else "❌"
        
        msg = f"""
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  {status_emoji} END: {self.api_name:<48}║
║  ⏱️  Duration: {duration:.2f}ms{'':<35}║
║  📊 Status: {status_code} {message:<36}║
║  🔗 Sections: {len(self.sections):<40}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"""
        logger.info(msg)
        print(msg)


# ════════════════════════════════════════════════════════════════════════════
# SWAGGER SCHEMAS
# ════════════════════════════════════════════════════════════════════════════

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
        "blister_packing_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
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
        "customer_name": openapi.Schema(type=openapi.TYPE_STRING),
        "program_name": openapi.Schema(type=openapi.TYPE_STRING),
        "customer_protocol": openapi.Schema(type=openapi.TYPE_STRING),
        "confirm_new_or_shifted_from_vapi": openapi.Schema(type=openapi.TYPE_STRING),
        "original_towel": openapi.Schema(type=openapi.TYPE_STRING),
        "polybag_manual_or_automatic": openapi.Schema(type=openapi.TYPE_STRING),
        "polybag_type": openapi.Schema(type=openapi.TYPE_STRING),
        "pallet_or_slipsheet_requirement": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "special_carton_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "pdq_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "cdu_required": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "sample_carton_arranged": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "pdq_arranged": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "cdu_arranged": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "shipped_as_single_pdq_or_monster_pdq": openapi.Schema(type=openapi.TYPE_STRING),
        "pdq_layers_stacking_details": openapi.Schema(type=openapi.TYPE_STRING),
        "common_pdq_same_dimension_for_all_sizes": openapi.Schema(type=openapi.TYPE_STRING),
        "small_pdq_on_pallet_or_slipsheet": openapi.Schema(type=openapi.TYPE_STRING),
        "small_pdq_count_on_pallet_or_slipsheet": openapi.Schema(type=openapi.TYPE_STRING),
        "warehouse_store_handling_method": openapi.Schema(type=openapi.TYPE_STRING),
        "towel_folded_and_poly_packed_before_carton": openapi.Schema(type=openapi.TYPE_STRING),
        "separator_protector_stiffener_required": openapi.Schema(type=openapi.TYPE_STRING),
        "ribbon_packing_required": openapi.Schema(type=openapi.TYPE_STRING),
        "belly_band_packing_required": openapi.Schema(type=openapi.TYPE_STRING),
    }
)

subprogram_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
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
        "carton_length": openapi.Schema(type=openapi.TYPE_NUMBER),
        "carton_width": openapi.Schema(type=openapi.TYPE_NUMBER),
        "carton_height": openapi.Schema(type=openapi.TYPE_NUMBER),
        "ribbon": openapi.Schema(type=openapi.TYPE_STRING),
        "belly_band": openapi.Schema(type=openapi.TYPE_STRING),
        "remark": openapi.Schema(type=openapi.TYPE_STRING),
        "pdq_length": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pdq_width": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pdq_height": openapi.Schema(type=openapi.TYPE_NUMBER),
        "net_wt_pdq": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pallet_wt_pdq": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pallet_length": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pallet_width": openapi.Schema(type=openapi.TYPE_NUMBER),
        "pallet_height": openapi.Schema(type=openapi.TYPE_NUMBER),
        "packed_pb_length": openapi.Schema(type=openapi.TYPE_NUMBER),
        "packed_pb_width": openapi.Schema(type=openapi.TYPE_NUMBER),
        "packed_pb_height": openapi.Schema(type=openapi.TYPE_NUMBER),
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
        "subprograms": openapi.Schema(type=openapi.TYPE_ARRAY, items=subprogram_schema),
        "samples": openapi.Schema(type=openapi.TYPE_ARRAY, items=sample_schema),
        "bedsheet_details": bedsheet_details_schema,
        "terry_details": terry_details_schema,
        "bathrobe_details": bathrobe_details_schema,
    }
)

recalculate_preview_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["subprograms"],
    properties={
        "subprograms": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                required=["subprogram_id"],
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
                    "folded_length": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "folded_width": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "wt_per_unit": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "weight_uom": openapi.Schema(type=openapi.TYPE_STRING, enum=["GM", "KG", "LB"]),
                    "ribbon": openapi.Schema(type=openapi.TYPE_STRING, enum=["YES", "NO"]),
                    "belly_band": openapi.Schema(type=openapi.TYPE_STRING, enum=["YES", "NO"]),
                    "self_fabric_bag": openapi.Schema(type=openapi.TYPE_STRING, enum=["YES", "NO"]),
                    "remark": openapi.Schema(type=openapi.TYPE_STRING),
                    "saved_net_wt_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
                    "saved_cbm_per_carton": openapi.Schema(type=openapi.TYPE_NUMBER),
                }
            )
        )
    }
)

recalculate_preview_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "results": openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(type=openapi.TYPE_OBJECT)
        )
    }
)


# ════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTION
# ════════════════════════════════════════════════════════════════════════════

def _validate_yes_no(value, field_name):
    """Validate YES/NO dropdown fields"""
    if value is None:
        return None, None
    
    if value.upper() not in ["YES", "NO"]:
        return None, (
            Response(
                {"error": f"{field_name} must be YES or NO"},
                status=status.HTTP_400_BAD_REQUEST
            )
        )
    
    return value.upper(), None
