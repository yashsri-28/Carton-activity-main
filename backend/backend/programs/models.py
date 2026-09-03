from django.db import models
from django.conf import settings
from decimal import Decimal, InvalidOperation
from math import floor
from programs.utils.container_config import CONTAINER_SPECS




class CartonProgram(models.Model):
    
    PROGRAM_TYPE_CHOICES = (
        ("TOWEL", "Towel"),
        ("BEDSHEET", "Bedsheet"),
        ("TERRY TOWEL", "Terry Towel"),
        ("BATH ROBE", "Bath Robe"),
    )

    program_type = models.CharField(
        max_length=50,
        choices=PROGRAM_TYPE_CHOICES,
        default="TOWEL"
    )


    customer_name = models.TextField()
    program_name = models.TextField()
    customer_protocol = models.TextField()

    confirm_new_or_shifted_from_vapi = models.TextField()
    original_towel = models.TextField()

    polybag_manual_or_automatic = models.TextField()
    polybag_type = models.TextField()

    pallet_or_slipsheet_requirement = models.BooleanField(default=False)


    special_carton_required = models.BooleanField(default=False)
    pdq_required = models.BooleanField(default=False)
    cdu_required = models.BooleanField(default=False)
    
    # sample_arranged_for_special_carton_pdq_cdu = models.TextField()
    
    sample_arranged_for_special_carton = models.BooleanField(default=False)
    sample_arranged_for_special_carton_pdq = models.BooleanField(default=False)
    sample_arranged_for_special_carton_cdu= models.BooleanField(default=False)

    shipped_as_single_pdq_or_monster_pdq = models.TextField()

    pdq_layers_stacking_details = models.TextField()

    common_pdq_same_dimension_for_all_sizes = models.TextField()

    small_pdq_on_pallet_or_slipsheet = models.TextField()
    small_pdq_count_on_pallet_or_slipsheet = models.TextField()

    warehouse_store_handling_method = models.TextField()

    towel_folded_and_poly_packed_before_carton = models.TextField()

    separator_protector_stiffener_required = models.TextField()

    ribbon_packing_required = models.TextField()
    belly_band_packing_required = models.TextField()

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="carton_program_created"
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="carton_program_updated"
    )

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)
    
    
    remark = models.TextField(
    null=True,
    blank=True
    )

    

    class Meta:
        db_table = "carton_program"

    def __str__(self):
        return self.program_name
    


class BedsheetProgramDetails(models.Model):

    carton_program = models.OneToOneField(
        "CartonProgram",
        on_delete=models.CASCADE,
        related_name="bedsheet_details"
    )

    fabric_tc = models.CharField(max_length=100, null=True, blank=True)

    folding_details = models.TextField(null=True, blank=True)

    required_pcs_per_polybag = models.IntegerField(null=True, blank=True)

    polybag_size = models.CharField(max_length=100, null=True, blank=True)

    product_type = models.CharField(max_length=150, null=True, blank=True)

    special_packing_requirement = models.CharField(max_length=150, null=True, blank=True)

    packing_type = models.CharField(max_length=150, null=True, blank=True)

    product_dimension = models.CharField(max_length=200, null=True, blank=True)

    fold_size = models.CharField(max_length=150, null=True, blank=True)

    blister_packing_required = models.BooleanField(default=False)

    blister_packing_details = models.CharField(max_length=150, null=True, blank=True)

    bag_type = models.CharField(max_length=150, null=True, blank=True)

    special_box_required = models.CharField(max_length=150, null=True, blank=True)

    required_sets_per_carton = models.IntegerField(null=True, blank=True)

    polyfold_condition = models.CharField(max_length=150, null=True, blank=True)

    filled_product_gsm = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True
    )

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bedsheet_program_details"



class TerryTowelProgramDetails(models.Model):

    carton_program = models.OneToOneField(
        "CartonProgram",
        on_delete=models.CASCADE,
        related_name="terry_details"
    )

    towel_sizes = models.CharField(max_length=200, null=True, blank=True)

    required_pcs_carton_size = models.CharField(max_length=200, null=True, blank=True)

    required_polybags_carton_size = models.CharField(max_length=200, null=True, blank=True)

    towel_dimensions = models.CharField(max_length=200, null=True, blank=True)

    towel_weight_per_piece = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True
    )

    folding_details = models.TextField(null=True, blank=True)

    required_pcs_per_polybag = models.IntegerField(null=True, blank=True)

    special_carton_details = models.TextField(null=True, blank=True)

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "terry_towel_program_details"


class BathRobeProgramDetails(models.Model):

    carton_program = models.OneToOneField(
        "CartonProgram",
        on_delete=models.CASCADE,
        related_name="bathrobe_details"
    )

    original_bath_robe = models.TextField(null=True, blank=True)

    bath_robe_sizes = models.CharField(
        max_length=200,
        null=True,
        blank=True
    )

    bath_robe_dimensions = models.CharField(
        max_length=200,
        null=True,
        blank=True
    )

    bath_robe_weight = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True
    )

    folding_details = models.TextField(null=True, blank=True)

    required_pcs_per_polybag = models.IntegerField(null=True, blank=True)

    required_pcs_per_carton = models.IntegerField(null=True, blank=True)

    polybag_type = models.CharField(
        max_length=150,
        null=True,
        blank=True
    )

    polybag_size_carton = models.CharField(
        max_length=150,
        null=True,
        blank=True
    )

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bath_robe_program_details"



class CartonProgramSubProgram(models.Model):

    # --------------------------------------------------
    # SIZE (King / Queen / etc.)
    # --------------------------------------------------
    SIZE_CHOICES = (
        ("SINGLE", "Single"),
        ("TWIN", "Twin"),
        ("TWIN XL", "Twin XL"),
        ("FULL", "Full/Double"),
        ("QUEEN", "Queen"),
        ("KING", "King"),
        ("CALIFORNIA KING", "California King"),
        ("OTHER", "Other"),
    )

    # --------------------------------------------------
    # PRODUCT TYPE (what the size applies to)
    # --------------------------------------------------
    PRODUCT_TYPE_CHOICES = (
        ("SHEET_SET", "Sheet Set"),
        ("FLAT_SHEET", "Flat Sheet"),
        ("FITTED_SHEET", "Fitted Sheet"),
        ("PILLOWCASE", "Pillowcase"),
        ("DUVET_COVER", "Duvet Cover"),
        ("OTHER", "Other"),
    )

    WEIGHT_UOM_CHOICES = (
        ("GM", "Grams"),
        ("KG", "Kilograms"),
        ("LB", "Pounds"),
    )

    YES_NO_CHOICES = (
        ("YES", "Yes"),
        ("NO", "No"),
    )

    carton_program = models.ForeignKey(
        "CartonProgram",
        on_delete=models.CASCADE,
        related_name="subprograms"
    )

    program_name = models.TextField()

    pcs_per_set = models.PositiveIntegerField(null=True, blank=True)

    # NEW: Size + Product Type (e.g. "King" + "Sheet Set" -> "King Sheet Set")
    size = models.CharField(
        max_length=30,
        choices=SIZE_CHOICES,
        null=True,
        blank=True
    )

    product_type = models.CharField(
        max_length=30,
        choices=PRODUCT_TYPE_CHOICES,
        null=True,
        blank=True
    )

    style = models.CharField(max_length=500)

    width_in = models.DecimalField(max_digits=10, decimal_places=2)
    length_in = models.DecimalField(max_digits=10, decimal_places=2)

    width_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=10, decimal_places=2,  null=True, blank=True)

    wt_per_unit = models.DecimalField(max_digits=10, decimal_places=2)

    # NEW: UOM for wt_per_unit. Weight itself was already editable; this makes
    # the unit explicit instead of being an implicit assumption (grams).
    weight_uom = models.CharField(
        max_length=5,
        choices=WEIGHT_UOM_CHOICES,
        default="GM"
    )

    gsm = models.DecimalField(max_digits=10, decimal_places=2)

    unit_per_carton = models.PositiveIntegerField()

    inner_pack_unit_qty = models.CharField(
        max_length=500,
        help_text="Unit per polybag"
    )

    # NEW FIELDS

    FOLD_CHOICES = (
        ("FULL", "Full"),
        ("HALF", "Half Fold"),
        ("TRI", "Tri Fold"),
        ("QUARTER", "Quarter Fold"),
    )

    fold = models.CharField(max_length=20, choices=FOLD_CHOICES)

    folded_length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    folded_width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    

    # fold = models.CharField(max_length=500)
    
    
    
    # -----------------------------
    # TQM FILLED FIELDS
    # -----------------------------

    carton_length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    carton_width = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    carton_height = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Ribbon / Belly Band / Self Fabric Bag - now constrained to Yes/No via
    # choices=. Note: since these views write directly with .create()/manual
    # attribute assignment (no serializer), choices= alone only enforces at
    # admin/full_clean() level - the views also validate this explicitly
    # against YES_NO_CHOICES (see programs/views.py: _validate_yes_no()).
    ribbon = models.CharField(
        max_length=3,
        choices=YES_NO_CHOICES,
        null=True,
        blank=True
    )

    belly_band = models.CharField(
        max_length=3,
        choices=YES_NO_CHOICES,
        null=True,
        blank=True
    )

    # NEW FIELD
    self_fabric_bag = models.CharField(
        max_length=3,
        choices=YES_NO_CHOICES,
        null=True,
        blank=True
    )

    remark = models.TextField(
        null=True,
        blank=True
    )

    # --------------------------------------------------
    # RECALCULATE GATING
    # --------------------------------------------------
    # Set True whenever TQM calls the "Recalculate" action
    # (programs/views.py: get_carton_calculations_ai). Reset to False the
    # moment carton/PDQ/pallet dimensions are edited again in
    # bulk_update_tqm_subprogram, so Tentative/Final submit is blocked until
    # Recalculate is pressed again with the latest values.
    is_recalculated = models.BooleanField(default=False)
    last_recalculated_on = models.DateTimeField(null=True, blank=True)

    # net_wt_carton = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # cbm_per_carton = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    
    # -----------------------------
    #  NEW – TQM PDQ DETAILS
    # -----------------------------

    pdq_length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pdq_width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pdq_height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # unit_per_pdq = models.PositiveIntegerField()


    net_wt_pdq = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # cbm_per_pdq = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    pallet_wt_pdq = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)


    # -----------------------------
    #  NEW – PALLET SIZE (IF PDQ YES)
    # -----------------------------

    pallet_length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pallet_width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pallet_height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    


    # -----------------------------
    #  NEW – PACKED PB (IF PDQ YES)
    # -----------------------------

    packed_pb_length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    packed_pb_width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    packed_pb_height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    
    # --------------------------------------
    # CALCULATED FIELDS (DO NOT STORE IN DB)
    # --------------------------------------

    @property
    def calculated_net_wt_carton(self):
        """
        Net weight of carton = wt_per_unit × unit_per_carton
        """
        try:
            return Decimal(self.wt_per_unit) * Decimal(self.unit_per_carton)
        except (TypeError, InvalidOperation):
            return None


    @property
    def calculated_cbm_per_carton(self):
        """
        CBM = (L × W × H) / 1,000,000 (if dimensions in cm)
        """
        if self.carton_length and self.carton_width and self.carton_height:
            try:
                return (
                    Decimal(self.carton_length)
                    * Decimal(self.carton_width)
                    * Decimal(self.carton_height)
                ) / Decimal("1000000")
            except (TypeError, InvalidOperation):
                return None
        return None


    @property
    def calculated_cbm_per_pdq(self):
        """
        PDQ CBM = (L × W × H) / 1,000,000
        """
        if self.pdq_length and self.pdq_width and self.pdq_height:
            try:
                return (
                    Decimal(self.pdq_length)
                    * Decimal(self.pdq_width)
                    * Decimal(self.pdq_height)
                ) / Decimal("1000000")
            except (TypeError, InvalidOperation):
                return None
        return None


    @property
    def calculated_total_cbm(self):
        """
        Total CBM = CBM per carton × unit_per_carton
        (Modify if you later add ship_qty or possible_ca)
        """
        cbm = self.calculated_cbm_per_carton
        if cbm:
            return cbm * Decimal(self.unit_per_carton)
        return None



    # -----------------------------
    # WAREHOUSE FIELDS
    # -----------------------------

    article_no = models.CharField(max_length=100, null=True, blank=True)
    so_item_text = models.TextField(null=True, blank=True)

    possible_ca = models.PositiveIntegerField(null=True, blank=True)
    ship_qty = models.PositiveIntegerField(null=True, blank=True)

    gross_wt_per_carton = models.DecimalField(
        max_digits=10, decimal_places=3,
        null=True, blank=True
    )

    upc = models.CharField(max_length=50, null=True, blank=True)
    final_destination = models.CharField(max_length=255, null=True, blank=True)
    
    
    # Pieces per carton
    @property
    def pieces_per_carton(self):
        return self.unit_per_carton


    # CBM per carton (already exists)
    @property
    def cbm_per_carton(self):
        return self.calculated_cbm_per_carton


    # Net weight per carton
    @property
    def net_wt_per_carton(self):
        return self.calculated_net_wt_carton


    # Total CBM
    @property
    def total_cbm(self):
        if self.cbm_per_carton and self.possible_ca:
            return self.cbm_per_carton * Decimal(self.possible_ca)
        return None


    # Total Net Weight
    @property
    def total_net_wt(self):
        if self.net_wt_per_carton and self.possible_ca:
            return self.net_wt_per_carton * Decimal(self.possible_ca)
        return None


    # Total Gross Weight
    @property
    def total_gross_wt(self):
        if self.gross_wt_per_carton and self.possible_ca:
            return Decimal(self.gross_wt_per_carton) * Decimal(self.possible_ca)
        return None




    # --------------------------------------
    # CONTAINER CALCULATIONS
    # --------------------------------------

    def cartons_per_container(self, container_type="20FT"):
        spec = CONTAINER_SPECS.get(container_type)
        if not spec:
            return None

        if not (self.carton_length and self.carton_width and self.carton_height):
            return None

        try:
            length_fit = floor(spec["length_cm"] / self.carton_length)
            width_fit = floor(spec["width_cm"] / self.carton_width)
            height_fit = floor(spec["height_cm"] / self.carton_height)

            volume_based = length_fit * width_fit * height_fit

            net_wt = self.calculated_net_wt_carton
            if not net_wt:
                return volume_based

            weight_based = floor(spec["max_payload_kg"] / net_wt)

            return min(volume_based, weight_based)

        except Exception:
            return None


    def pdq_per_container(self, container_type="20FT"):
        spec = CONTAINER_SPECS.get(container_type)
        if not spec:
            return None

        if not (self.pdq_length and self.pdq_width and self.pdq_height):
            return None

        try:
            length_fit = floor(spec["length_cm"] / self.pdq_length)
            width_fit = floor(spec["width_cm"] / self.pdq_width)
            height_fit = floor(spec["height_cm"] / self.pdq_height)

            return length_fit * width_fit * height_fit
        except Exception:
            return None


    def pallets_per_container(self, container_type="20FT"):
        spec = CONTAINER_SPECS.get(container_type)
        if not spec:
            return None

        if not (self.pallet_length and self.pallet_width and self.pallet_height):
            return None

        try:
            length_fit = floor(spec["length_cm"] / self.pallet_length)
            width_fit = floor(spec["width_cm"] / self.pallet_width)
            height_fit = floor(spec["height_cm"] / self.pallet_height)

            return length_fit * width_fit * height_fit
        except Exception:
            return None



    @property
    def size_display_label(self):
        """
        e.g. "King Sheet Set" - combines product_type + size for display.
        """
        if self.size and self.product_type:
            return f"{self.get_size_display()} {self.get_product_type_display()}"
        return self.get_size_display() if self.size else None

    class Meta:
        db_table = "carton_program_subprogram"

    def __str__(self):
        return self.program_name


    
class SampleProgram(models.Model):

    carton_program = models.ForeignKey(
        "CartonProgram",
        on_delete=models.CASCADE,
        related_name="sample_programs"
    )

    program_name = models.TextField()

    size = models.CharField(max_length=500)

    sample = models.CharField(max_length=500)

    quality = models.CharField(max_length=500)

    lbs_per_dz = models.DecimalField(max_digits=10, decimal_places=2)

    gsm = models.DecimalField(max_digits=10, decimal_places=2)

    shade = models.CharField(max_length=500)

    width_in = models.DecimalField(max_digits=10, decimal_places=2)
    length_in = models.DecimalField(max_digits=10, decimal_places=2)

    width_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = "carton_program_sample_program"

    def __str__(self):
        return self.program_name

  
    
class ActivityProgramStatus(models.Model):

    # activity = models.ForeignKey(
    #     Activity,
    #     on_delete=models.CASCADE,
    #     related_name="program_statuses"
    # )

    activity = models.CharField(max_length=255)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_activity_programs"
    )


    program = models.ForeignKey(
        CartonProgram,
        on_delete=models.CASCADE,
        related_name="activity_statuses"
    )
    
    sent_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_programs"
    )
    
    
    request_sample = models.BooleanField(default=False)
    request_carton_sizing = models.BooleanField(default=False)

    purchase_sent_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_assigned_programs"
    )


    rejection_reason = models.TextField(null=True, blank=True)


    status = models.TextField(default='Pending')   # Draft / In Progress / Completed / Rejected

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "activity_program_status"
        # managed = False
        unique_together = ("activity", "program")

    def __str__(self):
        return f"{self.activity} - {self.program.program_name} - {self.status}"



class CartonProgramAttachment(models.Model):

    program = models.ForeignKey(
        CartonProgram,
        on_delete=models.CASCADE,
        related_name="attachments"
    )

    file = models.FileField(upload_to="carton_program_attachments/")
    description = models.TextField(blank=True)

    uploaded_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "carton_program_attachment"



from django.db import models
from django.conf import settings


class GussetProgram(models.Model):

    customer_name = models.CharField(max_length=255)

    program_name = models.CharField(max_length=255)
    
    expected_date_confirmation = models.DateField(null=True, blank=True)

    # ---------------- PRODUCT ----------------

    tc = models.CharField(max_length=100, null=True, blank=True)

    weave = models.CharField(max_length=100, null=True, blank=True)

    product_group = models.CharField(max_length=100, null=True, blank=True)

    size = models.CharField(max_length=100, null=True, blank=True)

    down = models.CharField(max_length=100, null=True, blank=True)

    value_addition_flat_sheet = models.CharField(max_length=255, null=True, blank=True)

    value_addition_duvet_cover = models.CharField(max_length=255, null=True, blank=True)

    value_addition_fitted_sheet = models.CharField(max_length=255, null=True, blank=True)

    value_addition_pillowcase = models.CharField(max_length=255, null=True, blank=True)

    fold_size_inches = models.CharField(max_length=100, null=True, blank=True)

    # ---------------- CARDBOARD STIFFENER ----------------

    cardboard_required = models.BooleanField(default=False)

    fold_type = models.CharField(max_length=100, null=True, blank=True)

    ply = models.CharField(max_length=100, null=True, blank=True)

    fold_on_side = models.CharField(max_length=100, null=True, blank=True)

    reference_program = models.CharField(max_length=255, null=True, blank=True)

    comments = models.TextField(null=True, blank=True)

    # ---------------- POLYBAG ----------------

    polybag_required = models.BooleanField(default=False)

    material_type = models.CharField(max_length=100, null=True, blank=True)

    opening_type = models.CharField(max_length=100, null=True, blank=True)

    opening_on_side = models.CharField(max_length=100, null=True, blank=True)

    inlay_or_belly_band = models.CharField(max_length=100, null=True, blank=True)

    polybag_type = models.CharField(max_length=100, null=True, blank=True)

    # ---------------- WORKFLOW ----------------

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="gusset_created"
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="gusset_updated"
    )

    created_on = models.DateTimeField(auto_now_add=True)

    updated_on = models.DateTimeField(auto_now=True)
    
    rejection_reason = models.TextField(null=True, blank=True)

    status = models.CharField(
        max_length=100,
        default="Pending"
    )

    class Meta:
        db_table = "gusset_program"
        ordering = ["-created_on"]

    def __str__(self):
        return self.program_name
    
    
class GussetProgramSpecification(models.Model):

    gusset_program = models.ForeignKey(
        GussetProgram,
        on_delete=models.CASCADE,
        related_name="program_specifications"
    )

    program = models.CharField(max_length=255)

    style = models.CharField(max_length=255)

    width_in = models.FloatField(null=True, blank=True)

    width_cm = models.FloatField(null=True, blank=True)

    length_in = models.FloatField(null=True, blank=True)

    length_cm = models.FloatField(null=True, blank=True)

    wt_per_unit = models.FloatField(null=True, blank=True)

    gsm = models.FloatField(null=True, blank=True)

    unit_per_carton = models.IntegerField(null=True, blank=True)

    inner_pack_unit_qty = models.CharField(max_length=100, null=True, blank=True)

    fold = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "gusset_program_specifications"
        
        
class GussetSampleProgram(models.Model):

    gusset_program = models.ForeignKey(
        GussetProgram,
        on_delete=models.CASCADE,
        related_name="samples"
    )

    program_name = models.CharField(max_length=255)

    size = models.CharField(max_length=100)

    sample = models.CharField(max_length=100)

    quality = models.CharField(max_length=100)

    lbs_per_dz = models.FloatField(null=True, blank=True)

    gsm = models.FloatField(null=True, blank=True)

    shade = models.CharField(max_length=100)

    width_in = models.FloatField(null=True, blank=True)

    length_in = models.FloatField(null=True, blank=True)

    width_cm = models.FloatField(null=True, blank=True)

    length_cm = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "gusset_sample_program"


class SuperAdminDeleteLog(models.Model):
    """
    Dedicated audit log for SuperAdmin delete actions — separate from the
    general activity_logs app, specifically for tracking permanent
    deletions of Carton/Gusset programs.
    """

    PROGRAM_TYPE_CHOICES = (
        ("CARTON", "Carton Program"),
        ("GUSSET", "Gusset Program"),
    )

    program_type = models.CharField(max_length=20, choices=PROGRAM_TYPE_CHOICES)
    program_id = models.IntegerField(help_text="ID of the deleted CartonProgram or GussetProgram")
    program_name = models.CharField(max_length=255, null=True, blank=True)
    customer_name = models.CharField(max_length=255, null=True, blank=True)
    activity_program_status_id = models.IntegerField(null=True, blank=True)

    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="superadmin_deletions"
    )
    deleted_on = models.DateTimeField(auto_now_add=True)

    # Snapshot of key details at time of deletion, for reference since the
    # actual record will no longer exist.
    snapshot = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "superadmin_delete_log"
        ordering = ["-deleted_on"]

    def __str__(self):
        return f"{self.program_type} #{self.program_id} deleted by {self.deleted_by} on {self.deleted_on}"