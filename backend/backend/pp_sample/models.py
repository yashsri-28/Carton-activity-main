from django.db import models
from django.conf import settings


class PPSampleOrder(models.Model):

    sample_sale_order_no = models.CharField(max_length=255, unique=True)

    existing_customer = models.BooleanField(default=True)

    customer_name = models.CharField(max_length=255)
    brand_name = models.CharField(max_length=255)

    sale_order_number = models.CharField(max_length=255)

    # Requirement Estimated Dates
    ppc_sample_requirement_date = models.DateField(null=True, blank=True)
    top_sample_requirement_date = models.DateField(null=True, blank=True)
    testing_requirement_date = models.DateField(null=True, blank=True)
    adv_photoshoot_requirement_date = models.DateField(null=True, blank=True)
    anyother_requirement_date = models.DateField(null=True, blank=True)

        
    # Requirement Estimated Actual Dates
    ppc_actual_requirement_date = models.DateField(null=True, blank=True)
    top_actual_requirement_date = models.DateField(null=True, blank=True)
    testing_actual_requirement_date = models.DateField(null=True, blank=True)
    adv_photoshoot_actual_requirement_date = models.DateField(null=True, blank=True)
    anyother_actual_requirement_date = models.DateField(null=True, blank=True)

    
    # Requirement Yes No
    top_required = models.BooleanField(default=False)
    testing_required = models.BooleanField(default=False)
    pp_required = models.BooleanField(default=False)
    adv_photoshoot_required = models.BooleanField(default=False)
    anyother_requirement = models.TextField(null=True, blank=True)
    

    # Requirement Remarks
    pp_remarks = models.TextField(null=True, blank=True)
    top_remarks = models.TextField(null=True, blank=True)
    testing_remarks = models.TextField(null=True, blank=True)
    adv_photoshoot_remarks = models.TextField(null=True, blank=True)
    anyother_remarks = models.TextField(null=True, blank=True)


    remarks = models.TextField(null=True, blank=True)

    # Workflow Fields
    status = models.CharField(
        max_length=100,
        default="Draft"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="pp_sample_created"
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="pp_sample_updated"
    )

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)
    
    no_of_samples = models.PositiveIntegerField()


    class Meta:
        db_table = "pp_sample_order"
        ordering = ["-created_on"]

    def __str__(self):
        return self.sample_sale_order_no
    
    

