from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.create_artwork_request, name="create_artwork_request"),
    path("list/", views.list_artwork_requests, name="list_artwork_requests"),
    path("vendors/", views.list_vendors, name="list_vendors"),
    path("<str:artwork_id>/", views.get_artwork_details, name="get_artwork_details"),
    path("<str:artwork_id>/upload-version/", views.upload_artwork_version, name="upload_artwork_version"),
    path("<str:artwork_id>/act-approval/", views.act_on_artwork_approval, name="act_on_artwork_approval"),
    path("<str:artwork_id>/release/", views.release_artwork, name="release_artwork"),
    path("<str:artwork_id>/archive/", views.archive_artwork, name="archive_artwork"),
    path("<str:artwork_id>/comments/", views.list_artwork_comments, name="list_artwork_comments"),
    path("<str:artwork_id>/comments/add/", views.add_artwork_comment, name="add_artwork_comment"),
]
