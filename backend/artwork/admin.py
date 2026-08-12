from django.contrib import admin
from .models import ArtworkRequest, ArtworkVersion, ArtworkApproval, ArtworkIDSequence


@admin.register(ArtworkRequest)
class ArtworkRequestAdmin(admin.ModelAdmin):
    list_display = ("artwork_id", "title", "sku_code", "status", "assigned_vendor", "created_on")
    list_filter = ("status", "customer_approval_required")
    search_fields = ("artwork_id", "title", "sku_code", "brand_name", "customer_name", "material_code", "po_number")


@admin.register(ArtworkVersion)
class ArtworkVersionAdmin(admin.ModelAdmin):
    list_display = ("artwork", "version_number", "is_active_version", "is_locked", "uploaded_on")
    list_filter = ("is_active_version", "is_locked")


@admin.register(ArtworkApproval)
class ArtworkApprovalAdmin(admin.ModelAdmin):
    list_display = ("artwork", "stage", "sequence", "decision", "acted_by", "acted_on")
    list_filter = ("stage", "decision")


admin.site.register(ArtworkIDSequence)