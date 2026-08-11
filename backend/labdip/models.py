from django.db import models
from django.conf import settings


class LabDipRequest(models.Model):

    CATEGORY_CHOICES = (
        ("SOLID_TOWEL", "Solid Towel"),
        ("YD_JQ_TOWEL", "YD JQ Towel"),
        ("TERRY_TT", "Terry TT"),
        ("RUGS", "Rugs"),
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )

    no_of_shade = models.CharField(max_length=100)

    customer_name = models.CharField(max_length=255)

    enquiry = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    design_name = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    greige_mat_code = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    towel_type = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    yarn_type = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    border_type = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    mix_match = models.BooleanField(default=False)

    light_source = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    party_protocol_attached = models.BooleanField(default=False)

    shade_match_with = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    approval = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    special_features = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    # workflow

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="labdip_created"
    )

    created_on = models.DateTimeField(auto_now_add=True)

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="labdip_updated"
    )

    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "labdip_request"
        ordering = ["-created_on"]

    def __str__(self):
        return f"{self.customer_name} - {self.no_of_shade}"
    
    
    
    from django.db import models
from django.conf import settings


class LabDipRequest(models.Model):

    CATEGORY_CHOICES = (
        ("SOLID_TOWEL", "Solid Towel"),
        ("YD_JQ_TOWEL", "YD JQ Towel"),
        ("TERRY_TT", "Terry TT"),
        ("RUGS", "Rugs"),
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )

    no_of_shade = models.CharField(max_length=100)

    customer_name = models.CharField(max_length=255)

    enquiry = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    design_name = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    greige_mat_code = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    towel_type = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    yarn_type = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    border_type = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    mix_match = models.BooleanField(default=False)

    light_source = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    party_protocol_attached = models.BooleanField(default=False)

    shade_match_with = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    approval = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    special_features = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    # workflow

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="labdip_created"
    )

    created_on = models.DateTimeField(auto_now_add=True)

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="labdip_updated"
    )

    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "labdip_request"
        ordering = ["-created_on"]

    def __str__(self):
        return f"{self.customer_name} - {self.no_of_shade}"
    
    
    
    
    
class LabDipRugsDetails(models.Model):

    labdip = models.OneToOneField(
        LabDipRequest,
        on_delete=models.CASCADE,
        related_name="rugs_details"
    )

    programme_name = models.CharField(max_length=255)

    standard_type = models.CharField(max_length=255)

    material_description = models.TextField()

    piece_dyeing = models.CharField(max_length=255)

    yarn_dyeing = models.CharField(max_length=255)

    product_route_quality = models.CharField(max_length=255)

    coordinate_with_towel = models.BooleanField(default=False)

    class Meta:
        db_table = "labdip_rugs_details"
        
        
class LabDipShade(models.Model):

    labdip = models.ForeignKey(
        LabDipRequest,
        on_delete=models.CASCADE,
        related_name="shades"
    )

    shade_name = models.CharField(max_length=255)

    archroma_name = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    pantone_reference = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    shade_details = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    remark = models.TextField(
        null=True,
        blank=True
    )

    class Meta:
        db_table = "labdip_shades"
        
        
class LabDipTerryDetails(models.Model):

    labdip = models.OneToOneField(
        LabDipRequest,
        on_delete=models.CASCADE,
        related_name="terry_details"
    )

    contact_person = models.CharField(max_length=255)

    washing_type = models.CharField(max_length=255)

    special_instructions = models.TextField(
        null=True,
        blank=True
    )

    lab_dip_status = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    lab_dip_format = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    class Meta:
        db_table = "labdip_terry_details"