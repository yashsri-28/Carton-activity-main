from django.urls import path
from . import views


urlpatterns = [

    # --------------------------------------------------
    # Submit LabDip Request
    # --------------------------------------------------
    path(
        "submit-labdip/",
        views.submit_labdip,
        name="submit_labdip"
    ),
    
    # --------------------------------------------------
    # List LabDip
    # --------------------------------------------------
    path(
        "list-labdip/",
        views.list_labdip,
        name="list_labdip"
    ),

    # --------------------------------------------------
    # Get LabDip Details
    # --------------------------------------------------

    path(
        "details/",
        views.get_labdip_details,
        name="get_labdip_details"
    ),

]