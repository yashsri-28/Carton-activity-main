from django.contrib import admin
from .models import (
    CartonProgram,
    CartonProgramSubProgram,
    SampleProgram,
    ActivityProgramStatus,
    CartonProgramAttachment
)

# -------------------------------------------------
# Inline Attachments inside Carton Program
# -------------------------------------------------

class CartonProgramAttachmentInline(admin.TabularInline):
    model = CartonProgramAttachment
    extra = 1


# -------------------------------------------------
# Inline Subprograms inside Carton Program
# -------------------------------------------------

class CartonProgramSubProgramInline(admin.TabularInline):
    model = CartonProgramSubProgram
    extra = 1


# -------------------------------------------------
# Inline Samples inside Carton Program
# -------------------------------------------------

class SampleProgramInline(admin.TabularInline):
    model = SampleProgram
    extra = 1


# -------------------------------------------------
# Carton Program Admin
# -------------------------------------------------

@admin.register(CartonProgram)
class CartonProgramAdmin(admin.ModelAdmin):

    list_display = (
        "program_name",
        "customer_name",
        "created_by",
        "created_on",
        "updated_on",
    )

    search_fields = (
        "program_name",
        "customer_name",
    )

    list_filter = (
        "created_on",
    )

    inlines = [
        CartonProgramSubProgramInline,
        SampleProgramInline,
        CartonProgramAttachmentInline
    ]


# -------------------------------------------------
# Sub Program Admin
# -------------------------------------------------

@admin.register(CartonProgramSubProgram)
class CartonProgramSubProgramAdmin(admin.ModelAdmin):

    list_display = (
        "program_name",
        "carton_program",
        "style",
        "gsm",
    )

    search_fields = (
        "program_name",
        "style",
    )

    list_filter = (
        "carton_program",
    )


# -------------------------------------------------
# Sample Program Admin
# -------------------------------------------------

@admin.register(SampleProgram)
class SampleProgramAdmin(admin.ModelAdmin):

    list_display = (
        "program_name",
        "carton_program",
        "size",
        "quality",
        "gsm",
    )

    search_fields = (
        "program_name",
        "size",
        "quality",
    )

    list_filter = (
        "carton_program",
    )


# -------------------------------------------------
# Activity Program Status Admin
# -------------------------------------------------

@admin.register(ActivityProgramStatus)
class ActivityProgramStatusAdmin(admin.ModelAdmin):

    list_display = (
        "activity",
        "program",
        "status",
        "created_on",
        "updated_on",
    )

    search_fields = (
        "activity",
        "program__program_name",
        "status",
    )

    list_filter = (
        "activity",
        "status",
    )


# -------------------------------------------------
# Attachment Standalone Admin
# -------------------------------------------------

@admin.register(CartonProgramAttachment)
class CartonProgramAttachmentAdmin(admin.ModelAdmin):

    list_display = (
        "program",
        "file",
        "uploaded_on",
    )

    search_fields = (
        "program__program_name",
    )
