from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.create_artwork_request, name="create_artwork_request"),
    path("create-with-spec/", views.create_artwork_with_spec, name="create_artwork_with_spec"),
    path("list/", views.list_artwork_requests, name="list_artwork_requests"),
    path("procurement-team/", views.list_procurement_team, name="list_procurement_team"),
    path("performance-stats/", views.artwork_performance_stats, name="artwork_performance_stats"),
    path("notifications/", views.list_artwork_notifications, name="list_artwork_notifications"),
    path("notifications/<int:notification_id>/read/", views.mark_notification_read, name="mark_notification_read"),
    path("notifications/mark-all-read/", views.mark_all_notifications_read, name="mark_all_notifications_read"),
    path("<str:artwork_id>/", views.get_artwork_details, name="get_artwork_details"),
    path("<str:artwork_id>/upload-version/", views.upload_artwork_version, name="upload_artwork_version"),
    path("<str:artwork_id>/act-approval/", views.act_on_artwork_approval, name="act_on_artwork_approval"),
    path("<str:artwork_id>/release/", views.release_artwork, name="release_artwork"),
    path("<str:artwork_id>/archive/", views.archive_artwork, name="archive_artwork"),
    path("<str:artwork_id>/comments/", views.list_artwork_comments, name="list_artwork_comments"),
    path("<str:artwork_id>/comments/add/", views.add_artwork_comment, name="add_artwork_comment"),
    path("<str:artwork_id>/spec/", views.get_packaging_spec, name="get_packaging_spec"),
    path("<str:artwork_id>/assign-procurement/", views.assign_procurement, name="assign_procurement"),
    path("<str:artwork_id>/export-excel/", views.export_artwork_excel, name="export_artwork_excel"),
]