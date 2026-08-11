from django.contrib import admin
from .models import PPSampleOrder


# --------------------------------------------------
# PP Sample Order Admin
# --------------------------------------------------

@admin.register(PPSampleOrder)
class PPSampleOrderAdmin(admin.ModelAdmin):

    # Columns shown in list page
    list_display = (
        "id",
        "sample_sale_order_no",
        "customer_name",
        "brand_name",
        "no_of_samples",
        "top_required",
        "testing_required",
        "status",
        "created_by",
        "created_on",
    )

    # Sidebar filters
    list_filter = (
        "status",
        "existing_customer",
        "top_required",
        "testing_required",
        "created_on",
    )

    # Search bar
    search_fields = (
        "sample_sale_order_no",
        "customer_name",
        "brand_name",
        "sale_order_number",
    )

    # Default ordering
    ordering = ("-created_on",)

    # Read-only audit fields
    readonly_fields = (
        "created_by",
        "updated_by",
        "created_on",
        "updated_on",
    )

    # Better form grouping
    fieldsets = (

        ("Basic Information", {
            "fields": (
                "sample_sale_order_no",
                "existing_customer",
                "customer_name",
                "brand_name",
                "sale_order_number",
                "no_of_samples",
                "remarks",
            )
        }),

        ("Requirement Details", {
            "fields": (
                "ppc_sample_requirement_date",
                "top_sample_requirement_date",
                "top_required",
                "testing_required",
            )
        }),

        ("Workflow", {
            "fields": (
                "status",
            )
        }),

        ("Audit Information", {
            "fields": (
                "created_by",
                "updated_by",
                "created_on",
                "updated_on",
            )
        }),
    )

    # Automatically set created_by & updated_by
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)