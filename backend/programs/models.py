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
    size = models.TextField(null=True, blank=True)

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

    fold_length = models.CharField(max_length=50, null=True, blank=True)
    fold_width = models.CharField(max_length=50, null=True, blank=True)

    folding_details = models.TextField(null=True, blank=True)

    required_pcs_per_polybag = models.IntegerField(null=True, blank=True)
    elastic_required = models.BooleanField(default=False)   # 👈 NEW

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

    carton_program = models.ForeignKey(
        "CartonProgram",
        on_delete=models.CASCADE,
        related_name="subprograms"
    )

    program_name = models.TextField()
    is_recalculated = models.BooleanField(default=False)
    last_recalculated_on = models.DateTimeField(null=True, blank=True)

    pcs_per_set = models.PositiveIntegerField(null=True, blank=True)
    
    style = models.CharField(max_length=500)

    width_in = models.DecimalField(max_digits=10, decimal_places=2)
    length_in = models.DecimalField(max_digits=10, decimal_places=2)

    width_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=10, decimal_places=2,  null=True, blank=True)

    wt_per_unit = models.DecimalField(max_digits=10, decimal_places=2)

    gsm = models.DecimalField(max_digits=10, decimal_places=2)

    unit_per_carton = models.PositiveIntegerField()

    inner_pack_unit_qty = models.CharField(
        max_length=500,
        help_text="Unit per polybag"
    )

    # NEW: how many polybags go into one carton
    polybags_per_carton = models.PositiveIntegerField(null=True, blank=True)

    fold = models.CharField(max_length=500)

    # Folded product dimensions - used by get_carton_calculations_ai to
    # display alongside carton specs.
    folded_length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    folded_width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    
    
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

    ribbon = models.CharField(max_length=3,
        null=True,
        blank=True
    )

    belly_band = models.CharField(max_length=3,
        null=True,
        blank=True
    )

    remark = models.TextField(
        null=True,
        blank=True
    )
    
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

    saved_cartons_per_20ft = models.PositiveIntegerField(null=True, blank=True)
    saved_cartons_per_40ft = models.PositiveIntegerField(null=True, blank=True)
    saved_pdq_per_20ft = models.PositiveIntegerField(null=True, blank=True)
    saved_pdq_per_40ft = models.PositiveIntegerField(null=True, blank=True)
    saved_pallet_per_20ft = models.PositiveIntegerField(null=True, blank=True)
    saved_pallet_per_40ft = models.PositiveIntegerField(null=True, blank=True)
    saved_cbm_per_carton = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    saved_net_wt_carton = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    


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
    sample_code = models.CharField(max_length=255, null=True, blank=True)

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

class SampleProgramAttachment(models.Model):

    sample = models.ForeignKey(
        SampleProgram,
        on_delete=models.CASCADE,
        related_name="attachments"
    )

    file = models.FileField(upload_to="sample_program_attachments/")
    description = models.TextField(blank=True)
    uploaded_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sample_program_attachment" 
    
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
        related_name="activity_statuses",
        null=True,
        blank=True
    )
    
    sent_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_programs"
    )
    gusset_program = models.ForeignKey(
        "GussetProgram",
        on_delete=models.CASCADE,
        related_name="activity_statuses",
        null=True,
        blank=True
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

    def __str__(self):
        prog = self.program or self.gusset_program
        prog_name = prog.program_name if prog else "Unknown"
        return f"{self.activity} - {prog_name} - {self.status}"

    @property
    def program_name(self):
        if self.program:
            return self.program.program_name
        if self.gusset_program:
            return self.gusset_program.program_name
        return None

    @property
    def customer_name(self):
        if self.program:
            return self.program.customer_name
        if self.gusset_program:
            return self.gusset_program.customer_name
        return None

    @property
    def program_type_group(self):
        return "gusset" if self.gusset_program_id else "carton"



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

    size = models.CharField(max_length=100, null=True, blank=True) 
    # New field added to store custom size when user selects "Other"
    other_size = models.CharField(max_length=100, null=True, blank=True)

    fold_length = models.CharField(max_length=50, null=True, blank=True)
    fold_width = models.CharField(max_length=50, null=True, blank=True)
    gusset_bank = models.CharField(max_length=255, null=True, blank=True) 
    
    fold_length = models.CharField(max_length=50, null=True, blank=True)   
    fold_width = models.CharField(max_length=50, null=True, blank=True)  

    gusset_bank = models.CharField(max_length=255, null=True, blank=True)

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

    # Kept for backward compatibility with old rows / other code paths.
    # No longer required for the new Gusset spec-row flow.
    program = models.CharField(max_length=255, null=True, blank=True)
    style = models.CharField(max_length=255, null=True, blank=True)

    width_in = models.FloatField(null=True, blank=True)
    width_cm = models.FloatField(null=True, blank=True)
    length_in = models.FloatField(null=True, blank=True)
    length_cm = models.FloatField(null=True, blank=True)

    unit_per_carton = models.IntegerField(null=True, blank=True)
    inner_pack_unit_qty = models.CharField(max_length=100, null=True, blank=True)

    # NEW fields for the size-checkbox driven spec rows
    size = models.CharField(max_length=100, null=True, blank=True)
    fold_length = models.CharField(max_length=50, null=True, blank=True)
    fold_width = models.CharField(max_length=50, null=True, blank=True)
    gusset_name = models.CharField(max_length=255, null=True, blank=True)
    wt = models.FloatField(null=True, blank=True)
    gsm = models.FloatField(null=True, blank=True)

    # Editable later by TQM/PPC (after accept) — same concept as
    # CartonProgramSubProgram's TQM-filled fields.
    is_finalized_by_tqm = models.BooleanField(default=False)

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




class GussetProgramAttachment(models.Model):
    program = models.ForeignKey(
        GussetProgram,
        on_delete=models.CASCADE,
        related_name="attachments"
    )
    file = models.FileField(upload_to="gusset_program_attachments/")
    description = models.TextField(blank=True)
    uploaded_on = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "gusset_program_attachment"


class GussetSampleAttachment(models.Model):
    sample = models.ForeignKey(
        GussetSampleProgram,
        on_delete=models.CASCADE,
        related_name="attachments"
    )
    file = models.FileField(upload_to="gusset_sample_attachments/")
    description = models.TextField(blank=True)
    uploaded_on = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "gusset_sample_attachment"


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

    snapshot = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "superadmin_delete_log"
        ordering = ["-deleted_on"]

    def __str__(self):
        return f"{self.program_type} #{self.program_id} deleted by {self.deleted_by} on {self.deleted_on}"
    
    
class BedsheetFreezingNoteRow(models.Model):
    """
    "Freezing Note" — Carton and Packing Details table for Bedsheet/Fashion
    Bedding programs. One row per Sr.No / Size-Style variant, matching the
    client's standard Excel format exactly.

    Visible only for BEDSHEET program_type, and only when the Standard
    Bedsheet section is filled (not shown for Gusset-only submissions).

    Editable only by MARKETING role (enforced in the view). TQM/PPC can
    view but never edit.
    """

    carton_program = models.ForeignKey(
        "CartonProgram",
        on_delete=models.CASCADE,
        related_name="freezing_note_rows"
    )

    sr_no = models.IntegerField(null=True, blank=True)

    # ---------------- GENERAL INFORMATION ----------------
    # (Buyer/TC/Program/Date removed — already captured at the top-level
    # Bedsheet program, no need to repeat per Freezing Note row)
    size = models.CharField(max_length=100, null=True, blank=True)
    product_dimension = models.CharField(max_length=255, null=True, blank=True)

    # ---------------- PACKING STATUS ----------------
    pcs_per_bag_or_inner_box = models.CharField(max_length=100, null=True, blank=True)
    bag_or_innerbox_per_carton = models.CharField(max_length=100, null=True, blank=True)
    pcs_per_carton = models.CharField(max_length=100, null=True, blank=True)

    # ---------------- CARTON DETAILS (PART # 1) ----------------
    carton_type_paper = models.CharField(max_length=255, null=True, blank=True)
    carton_length_cm = models.FloatField(null=True, blank=True)
    carton_width_cm = models.FloatField(null=True, blank=True)
    carton_height_cm = models.FloatField(null=True, blank=True)

    # NEW: Carton Length/Width/Height are filled by TQM (after PPC accepts),
    # not by Marketing — same "Recalculate" pattern as CartonProgramSubProgram.
    is_recalculated = models.BooleanField(default=False)
    last_recalculated_on = models.DateTimeField(null=True, blank=True)

    # ---------------- CARTON WEIGHT DETAILS ----------------
    net_weight_kgs = models.FloatField(null=True, blank=True)
    gross_weight_kgs = models.FloatField(null=True, blank=True)

    # ---------------- CARTON DETAILS (PART # 2) ----------------
    carton_ply_no = models.CharField(max_length=50, null=True, blank=True)
    carton_min_bursting_strength = models.CharField(max_length=100, null=True, blank=True)
    carton_min_edge_crush_test = models.CharField(max_length=100, null=True, blank=True)

    # ---------------- STIFFENER DETAILS ----------------
    stiffener_dimension = models.CharField(max_length=255, null=True, blank=True)
    stiffener_no_of_ply = models.CharField(max_length=50, null=True, blank=True)
    stiffener_type_cut = models.CharField(max_length=255, null=True, blank=True)

    # ---------------- SIDE STIFFENERS DETAILS ----------------
    side_stiffener_dimension = models.CharField(max_length=255, null=True, blank=True)
    side_stiffener_no_of_ply = models.CharField(max_length=50, null=True, blank=True)
    side_stiffener_type_cut = models.CharField(max_length=255, null=True, blank=True)

    # ---------------- SEPARATOR DETAILS ----------------
    separator_dimension = models.CharField(max_length=255, null=True, blank=True)
    separator_no_of_ply = models.CharField(max_length=50, null=True, blank=True)

    # ---------------- PVC BAG / SELF BAG / INNER BOX DETAILS ----------------
    bag_or_innerbox_size = models.CharField(max_length=255, null=True, blank=True)
    bag_type_or_box_type = models.CharField(max_length=255, null=True, blank=True)

    # ---------------- LD POLYBAG DETAILS ----------------
    ld_polybag_length_cm = models.FloatField(null=True, blank=True)
    ld_polybag_width_cm = models.FloatField(null=True, blank=True)
    ld_polybag_flap_cm = models.FloatField(null=True, blank=True)
    ld_polybag_thickness_micron = models.CharField(max_length=100, null=True, blank=True)
    ld_polybag_quality = models.CharField(max_length=100, null=True, blank=True)

    # ---------------- LD POLYBAG PRINTING MATTER ----------------
    printing_matter_polybag = models.TextField(null=True, blank=True)

    # ---------------- OTHER INFORMATION ----------------
    product_position_in_carton = models.CharField(max_length=255, null=True, blank=True)
    product_dim_length = models.CharField(max_length=100, null=True, blank=True)
    product_dim_width = models.CharField(max_length=100, null=True, blank=True)
    product_dim_height = models.CharField(max_length=100, null=True, blank=True)
    bellyband_ribbon_dimension = models.CharField(max_length=255, null=True, blank=True)
    bellyband_ribbon_quality = models.CharField(max_length=255, null=True, blank=True)

    # ---------------- FOR MACY'S ONLY ----------------
    macys_tmcl_placement = models.CharField(max_length=255, null=True, blank=True)
    macys_carton_type = models.CharField(max_length=255, null=True, blank=True)
    macys_tmcl_placement_type = models.CharField(max_length=255, null=True, blank=True)

    # ---------------- ADDITIONAL INFORMATION ----------------
    pdq_accessories_others = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bedsheet_freezing_note_row"
        ordering = ["sr_no", "id"]

    def __str__(self):
        return f"Freezing Note #{self.sr_no or self.id} - {self.carton_program.program_name}"

    # ---------------- CALCULATED FIELDS (Excel formulas, not stored) ----------------
    @property
    def cbm(self):
        """CBM = (L x W x H) / 1,000,000 — matches Excel formula =M*N*O/1000000"""
        if self.carton_length_cm and self.carton_width_cm and self.carton_height_cm:
            return round(
                (self.carton_length_cm * self.carton_width_cm * self.carton_height_cm) / 1000000,
                6
            )
        return None

    @property
    def max_outside_carton_dimension(self):
        """L + W + H total — matches Excel formula =SUM(M:O)"""
        vals = [self.carton_length_cm, self.carton_width_cm, self.carton_height_cm]
        if all(v is not None for v in vals):
            return sum(vals)
        return None