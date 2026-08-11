from django.urls import path
from .views import (submit_carton_program, get_activity_program_status_list, 
                    copy_carton_program, recall, edit_carton_program, get_carton_program_details,
                    my_assigned_activities, accept_program, reject_program,
                    bulk_update_tqm_subprogram, upload_carton_program_attachment,
                    purchase_assigned_activities, purchase_submit_completion, purchase_accept_request,
                    accept_program_ppc,
                    warehouse_dashboard, update_warehouse_row,
                    submit_gusset_program, list_gusset_program, get_gusset_program_details,
                    list_gusset_program, edit_gusset_program, edit_gusset_program, accept_gusset_program, reject_gusset_program,recalculate_preview,get_carton_calculations_ai
                    )

urlpatterns = [
    path(
        "carton-program/submit/",
        submit_carton_program,
        name="submit_carton_program"
    ),
    
    
    path(
        "activity-program-status/list/",
        get_activity_program_status_list,
        name="activity_program_status_list"
    ),
    
    
        
    path(
        "carton-program/copy/",
        copy_carton_program,
        name="copy_carton_program"
    ),
    
    
    # Recall Activity Program
    path(
        "activity-program/recall/",
        recall,
        name="recall_activity_program"
    ),


    path(
        "carton-program/edit/",
        edit_carton_program,
        name="edit_carton_program"
    ),
    
    path(
        "carton-program/details/",
        get_carton_program_details,
        name="get_carton_program_details"
    ),
    
    
    
    path(
        "activities/my-assigned/",
        my_assigned_activities,
        name="my_assigned_activities"
    ),


    path(
        "activity-program/accept/",
        accept_program,
        name="accept_program"
    ),
    
    path(
        "activity-program/accept-ppc/",
        accept_program_ppc,
        name="accept_program"
    ),
    
    path(
        "activity-program/reject/",
        reject_program,
        name="reject_program"
    ),
    
    
    path(
        "subprogram/tqm-update/",
        bulk_update_tqm_subprogram,
        name="update_tqm_subprogram"
    ),
    path(
    "carton-program/calculations-ai/",
    get_carton_calculations_ai,
    name="get_carton_calculations_ai"
),

      path(
        "subprogram/recalculate-preview/",
        recalculate_preview,
        name="recalculate_preview"
    ),
    
    
    path(
        "carton-program/attachment/upload/",
        upload_carton_program_attachment,
        name="upload_carton_program_attachment"
    ),
    
    
    path(
        "purchase/assigned-activities/",
        purchase_assigned_activities
    ),
    
    
    path(
        "purchase/submit-completion/",
        purchase_submit_completion
    ),
    

    path(
        "purchase/accept-request/",
        purchase_accept_request
    ),
    
    
    path(
        "warehouse/dashboard/", 
        warehouse_dashboard
    ),
    
    path("warehouse/update/", 
         update_warehouse_row
    ),


    path("submit/", submit_gusset_program),

    path("list/", list_gusset_program),

    path("details/", get_gusset_program_details),
    
    # --------------------------------------------------
    # Submit Gusset Program
    # --------------------------------------------------
    path(
        "submit/",
        submit_gusset_program,
        name="submit_gusset_program"
    ),

    # --------------------------------------------------
    # Get Gusset Program Details
    # --------------------------------------------------
    path(
        "details/",
        get_gusset_program_details,
        name="get_gusset_program_details"
    ),

    # --------------------------------------------------
    # List Gusset Programs
    # --------------------------------------------------
    path(
        "list/",
        list_gusset_program,
        name="list_gusset_programs"
    ),

    # --------------------------------------------------
    # Edit Gusset Program
    # --------------------------------------------------
    path(
        "edit/",
        edit_gusset_program,
        name="edit_gusset_program"
    ),

    # --------------------------------------------------
    # Accept Gusset Program
    # --------------------------------------------------
    path(
        "accept/",
        accept_gusset_program,
        name="accept_gusset_program"
    ),

    # --------------------------------------------------
    # Reject Gusset Program
    # --------------------------------------------------
    path(
        "reject/",
        reject_gusset_program,
        name="reject_gusset_program"
    ),
]


    

