from django.urls import path
from .views import get_user_list

urlpatterns = [
    # Sent-To User Dropdown
    path(
        "users/list/",
        get_user_list,
        name="get_user_list"
    ),
]
