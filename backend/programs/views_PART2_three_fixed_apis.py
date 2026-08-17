"""
COMPLETE FIXED VIEWS.PY - PART 2
Three Fixed APIs with Full Logging

Copy this code and paste it after the schemas from PART1
"""

# ════════════════════════════════════════════════════════════════════════════
# API #1: Submit Carton Program (WITH LOGGING)
# ════════════════════════════════════════════════════════════════════════════

@swagger_auto_schema(
    method="post",
    operation_summary="Submit Carton Program (All Product Types)",
    request_body=submit_carton_program_schema,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def submit_carton_program(request):
    
    log = APILogger(
        api_name="submit_carton_program",
        user=request.user,
        request_data={
            "activity_name": request.data.get("activity_name"),
            "program_name": request.data.get("program_name")
        }
    )
    log.start()
    
    try:
        data = request.data
        activity_name = data.get("activity_name")
        program_name = data.get("program_name")
        program_type = data.get("program_type", "TOWEL")
        sent_to_user_id = data.get("sent_to_user_id")
        btn = data.get("btn", "")
        
        log.section("VALIDATE", "Checking required fields")
        
        if not activity_name:
            log.error("activity_name is required")
            log.end(status_code=400, message="BAD_REQUEST")
            return Response({"error": "activity_name is required"}, status=400)
        
        if not program_name:
            log.error("program_name is required")
            log.end(status_code=400, message="BAD_REQUEST")
            return Response({"error": "program_name is required"}, status=400)
        
        log.debug("Input validation passed")
        
        carton_program_data = data.get("carton_program", {})
        subprograms = data.get("subprograms", [])
        samples = data.get("samples", [])
        
        log.section("PROCESS", "Creating carton program")
        
        carton_program = CartonProgram.objects.create(
            program_type=program_type,
            program_name=program_name,
            created_by=request.user,
            remark=carton_program_data.get("remark"),
            customer_name=carton_program_data.get("customer_name"),
            customer_protocol=carton_program_data.get("customer_protocol"),
            confirm_new_or_shifted_from_vapi=carton_program_data.get("confirm_new_or_shifted_from_vapi"),
            original_towel=carton_program_data.get("original_towel"),
            size=carton_program_data.get("size"),
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
        
        log.debug("Carton program created", {"program_id": carton_program.id})
        
        if program_type == "BEDSHEET":
            BedsheetProgramDetails.objects.create(
                carton_program=carton_program,
                **data.get("bedsheet_details", {})
            )
        elif program_type == "TERRY_TOWEL":
            terry_data = data.get("terry_details", {}).copy()
            terry_data.pop("remark", None)
            TerryTowelProgramDetails.objects.create(
                carton_program=carton_program,
                **terry_data
            )
        elif program_type == "BATH_ROBE":
            bathrobe_data = data.get("bathrobe_details", {}).copy()
            bathrobe_data.pop("remark", None)
            BathRobeProgramDetails.objects.create(
                carton_program=carton_program,
                **bathrobe_data
            )
        
        status_value = "Draft" if btn.lower() == "save as draft" else "Pending"
        
        ActivityProgramStatus.objects.create(
            activity=activity_name,
            program=carton_program,
            status=status_value,
            sent_to_id=sent_to_user_id,
            created_by=request.user
        )
        
        log.debug("Activity status created", {"status": status_value})
        
        for sp in subprograms:
            CartonProgramSubProgram.objects.create(
                carton_program=carton_program,
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
                pcs_per_set=sp.get("pcs_per_set"),
                remark=sp.get("remark")
            )
        
        log.debug("Subprograms created", {"count": len(subprograms)})
        
        for sm in samples:
            SampleProgram.objects.create(
                carton_program=carton_program,
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
        
        log.debug("Sample programs created", {"count": len(samples)})
        
        log.section("NOTIFY", "Sending notifications")
        
        User = get_user_model()
        notification = NotificationService()
        
        try:
            notification.send_request_created(carton_program)
            log.debug("Request created notification sent")
        except Exception as e:
            log.warning("Failed to send request created notification", {"error": str(e)})
        
        if status_value != "Draft" and sent_to_user_id:
            try:
                assigned_user = User.objects.get(id=sent_to_user_id)
                notification.send_tqm_notification(carton_program)
                log.debug("TQM notification sent")
            except User.DoesNotExist:
                log.warning("TQM user not found", {"user_id": sent_to_user_id})
        
        create_log(
            module_name="Carton Program",
            record_id=carton_program.id,
            action="Created",
            message=f"{program_type} program created",
            user=request.user
        )
        
        log.section("RESPONSE", "Program created successfully")
        log.end(status_code=201, message="CREATED")
        
        return Response(
            {
                "message": "Carton Program Saved Successfully",
                "program_id": carton_program.id,
                "program_type": program_type
            },
            status=201
        )
    
    except Exception as e:
        log.error("Unexpected error", {"error": str(e)}, exception=e)
        log.end(status_code=500, message="INTERNAL_SERVER_ERROR")
        return Response(
            {"error": "Internal server error", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ════════════════════════════════════════════════════════════════════════════
# API #2: Get Carton Calculations AI (✅ CRITICAL FIX)
# ════════════════════════════════════════════════════════════════════════════

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_carton_calculations_ai(request):
    """
    ✅ FIXED VERSION - Validates dimensions before calculating
    """
    
    log = APILogger(
        api_name="get_carton_calculations_ai",
        user=request.user,
        request_data={"program_id": request.data.get("program_id")}
    )
    log.start()
    
    try:
        program_id = request.data.get("program_id")
        
        log.section("VALIDATE", "Checking input parameters")
        
        if not program_id:
            log.error("program_id is required", {"provided": request.data})
            log.end(status_code=400, message="BAD_REQUEST - Missing program_id")
            return Response(
                {"error": "program_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        log.debug("program_id validation passed", {"program_id": program_id})
        
        log.section("FETCH", f"Fetching program {program_id}")
        
        try:
            program = CartonProgram.objects.prefetch_related('subprograms').get(
                id=program_id
            )
            log.debug("Program fetched", {
                "program_id": program.id,
                "program_name": program.program_name
            })
        except CartonProgram.DoesNotExist:
            log.error(f"Program not found", {"program_id": program_id})
            log.end(status_code=404, message="NOT_FOUND")
            return Response(
                {"error": "Program not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        log.section("FETCH", "Fetching subprograms")
        
        subprograms = program.subprograms.all()
        subprogram_count = subprograms.count()
        
        log.debug("Subprograms fetched", {"count": subprogram_count})
        
        if subprogram_count == 0:
            log.warning("No subprograms found", {"program_id": program_id})
            log.end(status_code=200, message="OK (empty)")
            return Response({
                "program_id": program.id,
                "program_name": program.program_name,
                "results": [],
                "warning": "No subprograms found"
            }, status=status.HTTP_200_OK)
        
        log.section("VALIDATE", "Checking if all subprograms are recalculated")
        
        unrecalculated = subprograms.filter(is_recalculated=False)
        
        if unrecalculated.exists():
            unrecalc_ids = list(unrecalculated.values_list('id', flat=True))
            log.error(
                "Cannot calculate - subprograms not recalculated",
                {"unrecalculated_ids": unrecalc_ids}
            )
            log.end(status_code=400, message="BAD_REQUEST - Not recalculated")
            return Response({
                "error": "TQM must call Recalculate first for all subprograms",
                "unrecalculated_subprograms": unrecalc_ids,
                "instructions": "1. TQM fills carton/PDQ/pallet dimensions 2. TQM clicks Recalculate 3. Then call this API"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        log.debug("All subprograms are recalculated", {"count": subprogram_count})
        
        log.section("VALIDATE", "Checking for missing dimensions")
        
        missing_dims = []
        
        for sp in subprograms:
            errors = []
            
            if not sp.carton_length:
                errors.append("carton_length")
            if not sp.carton_width:
                errors.append("carton_width")
            if not sp.carton_height:
                errors.append("carton_height")
            
            if errors:
                missing_dims.append({
                    "subprogram_id": sp.id,
                    "program_name": sp.program_name,
                    "missing_fields": errors
                })
                log.warning(
                    f"Subprogram {sp.id} has missing dimensions",
                    {"missing": errors}
                )
        
        if missing_dims:
            log.error(
                "Cannot calculate - dimensions are NULL",
                {"subprograms_with_missing_dims": len(missing_dims)}
            )
            log.end(status_code=400, message="BAD_REQUEST - Missing dimensions")
            return Response({
                "error": "Cannot calculate - some subprograms have missing dimensions",
                "subprograms_with_missing_dims": missing_dims,
                "fix": "TQM must fill carton/PDQ/pallet dimensions and click Recalculate"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        log.debug("All dimensions are populated", {"subprograms_checked": subprogram_count})
        
        log.section("PROCESS", "Building calculation results")
        
        data = []
        now = timezone.now()
        
        for sp in subprograms:
            try:
                cartons_20ft = sp.cartons_per_container("20FT")
                cartons_40ft = sp.cartons_per_container("40FT")
                cartons_40hc = sp.cartons_per_container("40HC")
                cbm_per_carton = sp.calculated_cbm_per_carton
                
                log.debug(
                    f"Calculated containers for subprogram {sp.id}",
                    {
                        "20FT": cartons_20ft,
                        "40FT": cartons_40ft,
                        "40HC": cartons_40hc,
                        "CBM": cbm_per_carton
                    }
                )
                
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
                        "cbm": cbm_per_carton
                    },
                    
                    "container": {
                        "20FT": cartons_20ft,
                        "40FT": cartons_40ft,
                        "40HC": cartons_40hc,
                    },
                    
                    "is_recalculated": True,
                    "last_recalculated_on": now.strftime("%d-%m-%Y %H:%M:%S"),
                })
                
            except Exception as e:
                log.error(
                    f"Error calculating for subprogram {sp.id}",
                    {"error": str(e)},
                    exception=e
                )
                continue
        
        log.debug("Calculation complete", {"subprograms_processed": len(data)})
        
        log.section("UPDATE", "Marking subprograms as recalculated")
        
        subprograms.update(
            is_recalculated=True,
            last_recalculated_on=now
        )
        
        log.debug("is_recalculated flag updated", {
            "count": subprogram_count,
            "timestamp": now.isoformat()
        })
        
        log.section("RESPONSE", f"Returning {len(data)} subprogram calculations")
        
        response_body = {
            "program_id": program.id,
            "program_name": program.program_name,
            "subprogram_count": len(data),
            "results": data
        }
        
        log.end(status_code=200, message="OK")
        
        return Response(response_body, status=status.HTTP_200_OK)
    
    except Exception as e:
        log.error(
            "Unexpected error in get_carton_calculations_ai",
            {"error": str(e)},
            exception=e
        )
        log.end(status_code=500, message="INTERNAL_SERVER_ERROR")
        return Response(
            {"error": "Internal server error", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ════════════════════════════════════════════════════════════════════════════
# API #3: Recalculate Preview (✅ CRITICAL FIX)
# ════════════════════════════════════════════════════════════════════════════

@swagger_auto_schema(
    method="post",
    operation_summary="Recalculate (saves dimensions immediately, unlocks submit)",
    request_body=recalculate_preview_schema,
    responses={200: recalculate_preview_response},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def recalculate_preview(request):
    """
    ✅ FIXED VERSION - Validates and tracks each subprogram
    """
    
    log = APILogger(
        api_name="recalculate_preview",
        user=request.user,
        request_data={
            "subprogram_count": len(request.data.get("subprograms", []))
        }
    )
    log.start()
    
    try:
        
        log.section("VALIDATE", "Checking input")
        
        items = request.data.get("subprograms", [])
        
        if not items:
            log.error("subprograms list is empty", {"provided": request.data})
            log.end(status_code=400, message="BAD_REQUEST - Empty list")
            return Response(
                {"error": "subprograms list is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        log.debug("Input validation passed", {"item_count": len(items)})
        
        results = []
        now = timezone.now()
        failed_items = []
        
        for idx, item in enumerate(items):
            
            sp_id = item.get("subprogram_id")
            log.section("PROCESS", f"Processing subprogram {sp_id} ({idx+1}/{len(items)})")
            
            try:
                sp = CartonProgramSubProgram.objects.get(id=sp_id)
                log.debug(f"Subprogram {sp_id} fetched", {
                    "current_carton_length": sp.carton_length
                })
            except CartonProgramSubProgram.DoesNotExist:
                log.error(f"Subprogram not found", {"subprogram_id": sp_id})
                failed_items.append({
                    "subprogram_id": sp_id,
                    "error": "Subprogram not found in database"
                })
                continue
            
            log.debug(f"Validating YES/NO fields for {sp_id}")
            
            ribbon_val, err = _validate_yes_no(
                item.get("ribbon"), 
                f"ribbon (subprogram {sp_id})"
            )
            if err:
                log.error(f"ribbon validation failed for {sp_id}")
                return err
            
            belly_band_val, err = _validate_yes_no(
                item.get("belly_band"),
                f"belly_band (subprogram {sp_id})"
            )
            if err:
                log.error(f"belly_band validation failed for {sp_id}")
                return err
            
            self_fabric_bag_val, err = _validate_yes_no(
                item.get("self_fabric_bag"),
                f"self_fabric_bag (subprogram {sp_id})"
            )
            if err:
                log.error(f"self_fabric_bag validation failed for {sp_id}")
                return err
            
            log.debug(f"YES/NO fields validated for {sp_id}")
            
            log.debug(f"Saving dimensions for {sp_id}")
            
            if item.get("carton_length") is not None:
                sp.carton_length = item.get("carton_length")
            if item.get("carton_width") is not None:
                sp.carton_width = item.get("carton_width")
            if item.get("carton_height") is not None:
                sp.carton_height = item.get("carton_height")
            
            if item.get("pdq_length") is not None:
                sp.pdq_length = item.get("pdq_length")
            if item.get("pdq_width") is not None:
                sp.pdq_width = item.get("pdq_width")
            if item.get("pdq_height") is not None:
                sp.pdq_height = item.get("pdq_height")
            
            if item.get("pallet_length") is not None:
                sp.pallet_length = item.get("pallet_length")
            if item.get("pallet_width") is not None:
                sp.pallet_width = item.get("pallet_width")
            if item.get("pallet_height") is not None:
                sp.pallet_height = item.get("pallet_height")
            
            if item.get("folded_length") is not None:
                sp.folded_length = item.get("folded_length")
            if item.get("folded_width") is not None:
                sp.folded_width = item.get("folded_width")
            
            if item.get("wt_per_unit") is not None:
                sp.wt_per_unit = item.get("wt_per_unit")
            if item.get("weight_uom"):
                sp.weight_uom = item.get("weight_uom")
            
            if item.get("ribbon") is not None:
                sp.ribbon = ribbon_val
            if item.get("belly_band") is not None:
                sp.belly_band = belly_band_val
            if item.get("self_fabric_bag") is not None:
                sp.self_fabric_bag = self_fabric_bag_val
            
            if item.get("remark") is not None:
                sp.remark = item.get("remark")
            
            if item.get("saved_net_wt_carton") is not None:
                sp.saved_net_wt_carton = item.get("saved_net_wt_carton")
            if item.get("saved_cbm_per_carton") is not None:
                sp.saved_cbm_per_carton = item.get("saved_cbm_per_carton")
            
            log.debug(f"Carton dimensions saved", {
                "length": sp.carton_length,
                "width": sp.carton_width,
                "height": sp.carton_height
            })
            
            sp.is_recalculated = True
            sp.last_recalculated_on = now
            
            try:
                sp.save()
                log.debug(f"Subprogram {sp_id} saved to database")
            except Exception as e:
                log.error(f"Failed to save subprogram {sp_id}", {
                    "error": str(e)
                }, exception=e)
                failed_items.append({
                    "subprogram_id": sp_id,
                    "error": f"Database save failed: {str(e)}"
                })
                continue
            
            log.debug(f"Computing container fits for {sp_id}")
            
            try:
                cartons_20 = sp.cartons_per_container("20FT")
                cartons_40 = sp.cartons_per_container("40FT")
                pdq_20 = sp.pdq_per_container("20FT")
                pdq_40 = sp.pdq_per_container("40FT")
                pallet_20 = sp.pallets_per_container("20FT")
                pallet_40 = sp.pallets_per_container("40FT")
                cbm = sp.calculated_cbm_per_carton
                net_wt = sp.calculated_net_wt_carton
                
                log.debug(f"Container calculations done for {sp_id}", {
                    "cartons_20FT": cartons_20,
                    "cartons_40FT": cartons_40,
                    "CBM": cbm,
                    "net_wt": net_wt
                })
                
            except Exception as e:
                log.error(f"Calculation error for {sp_id}", {
                    "error": str(e)
                }, exception=e)
                cartons_20 = None
                cartons_40 = None
                pdq_20 = None
                pdq_40 = None
                pallet_20 = None
                pallet_40 = None
                cbm = None
                net_wt = None
            
            results.append({
                "subprogram_id": sp_id,
                
                "carton": {
                    "length": sp.carton_length,
                    "width": sp.carton_width,
                    "height": sp.carton_height,
                    "cbm": cbm,
                },
                
                "folded_length": sp.folded_length,
                "folded_width": sp.folded_width,
                
                "net_wt_carton": net_wt,
                
                "cartons_per_20ft": cartons_20,
                "cartons_per_40ft": cartons_40,
                "pdq_per_20ft": pdq_20,
                "pdq_per_40ft": pdq_40,
                "pallet_per_20ft": pallet_20,
                "pallet_per_40ft": pallet_40,
                
                "ribbon": sp.ribbon,
                "belly_band": sp.belly_band,
                "self_fabric_bag": sp.self_fabric_bag,
                "remark": sp.remark,
                
                "is_recalculated": True,
                "last_recalculated_on": now.strftime("%d-%m-%Y %H:%M:%S"),
            })
            
            try:
                create_log(
                    module_name="Sub Program",
                    record_id=sp.id,
                    action="Recalculated",
                    message="TQM clicked Recalculate - dimensions saved",
                    user=request.user
                )
                log.debug(f"Activity log created for {sp_id}")
            except Exception as e:
                log.warning(f"Failed to create activity log for {sp_id}", {
                    "error": str(e)
                })
        
        log.section("RESPONSE", f"Returning {len(results)} successful results")
        
        response_data = {"results": results}
        
        if failed_items:
            log.warning(f"Some items failed to process", {
                "failed_count": len(failed_items)
            })
            response_data["failed_items"] = failed_items
            response_data["partial_success"] = True
        
        log.debug("Response built", {
            "successful": len(results),
            "failed": len(failed_items)
        })
        
        log.end(status_code=200, message="OK")
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        log.error("Unexpected error in recalculate_preview", {
            "error": str(e)
        }, exception=e)
        log.end(status_code=500, message="INTERNAL_SERVER_ERROR")
        return Response(
            {"error": "Internal server error", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ════════════════════════════════════════════════════════════════════════════
# END OF PART 2
# 
# NEXT STEP: Copy the REST of your original views.py starting from:
# - get_activity_program_status_list
# - copy_carton_program
# - recall
# - edit_carton_program
# - ... and all other APIs (they don't need fixes)
#
# Paste them after this line
# ════════════════════════════════════════════════════════════════════════════
