from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Admin configuration for Custom User model
    """

    model = User

    # -------------------------------
    # Table View (List Page)
    # -------------------------------

    list_display = (
        "username",
        "email",
        "emp_code",
        "company_name",
        "role",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "role",
        "company_name",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "email",
        "emp_code",
        "company_name",
    )

    ordering = ("username",)

    # -------------------------------
    # Detail Page Layout
    # -------------------------------

    fieldsets = (
        ("Login Credentials", {
            "fields": ("username", "password")
        }),

        ("Personal Info", {
            "fields": ("first_name", "last_name", "email")
        }),

        ("Organization Info", {
            "fields": ("emp_code", "company_name", "role")
        }),

        ("Page Access Control", {
            "fields": ("allowed_pages",)
        }),

        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),

        ("Important Dates", {
            "fields": ("last_login", "date_joined")
        }),
    )

    readonly_fields = ("last_login", "date_joined")

    # -------------------------------
    # Create User Page
    # -------------------------------

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username",
                "password1",
                "password2",
                "email",
                "emp_code",
                "company_name",
                "role",
                "is_active",
                "is_staff",
            ),
        }),
    )

