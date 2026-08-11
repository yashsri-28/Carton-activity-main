from django.urls import path
from . import views


urlpatterns = [

    # --------------------------------------------------
    # Submit PP Sample (Marketing)
    # --------------------------------------------------
    path(
        "submit/",
        views.submit_pp_sample,
        name="submit_pp_sample"
    ),

    # --------------------------------------------------
    # Get PP Sample Details
    # --------------------------------------------------
    path(
        "details/",
        views.get_pp_sample_details,
        name="get_pp_sample_details"
    ),

    # --------------------------------------------------
    # Update Requirement (PPC / QA)
    # --------------------------------------------------
    path(
        "update-requirement/",
        views.update_pp_sample_requirement,
        name="update_pp_sample_requirement"
    ),
    
    
    # --------------------------------------------------
    # Update Requirement (PPC / QA)
    # --------------------------------------------------
    path(
        "update-requirement-date/",
        views.update_pp_sample_requirement_actual_date,
        name="update_pp_sample_requirement_actual_date"
    ),
    
    
    # --------------------------------------------------
    # PP Sample List (Dashboard)
    # --------------------------------------------------
    path(
        "list/",
        views.list_pp_samples,
        name="list_pp_samples"
    ),
    
    path(
        "complete_pp_sample/",
        views.complete_pp_sample,
        name="complete_pp_sample"
    ),
    
    
    path(
        "top_required_pp_samples/",
        views.top_required_pp_samples,
        name="top_required_pp_samples"
    ),
    
    path(
        "testing_required_pp_samples/",
        views.testing_required_pp_samples,
        name="testing_required_pp_samples"
    ),

]