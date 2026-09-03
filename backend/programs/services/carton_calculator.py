# from decimal import Decimal
# from math import floor

# from programs.utils.container_config import CONTAINER_SPECS


# class CartonCalculator:

#     # ----------------------------------------
#     # 1. APPLY FOLD
#     # ----------------------------------------
#     def apply_fold(self, length, width, fold_type):

#         if not length or not width:
#             return None, None

#         fold_type = (fold_type or "").upper().strip()

#         if fold_type == "FULL":
#             return Decimal(length), Decimal(width)

#         elif fold_type == "HALF":
#             return Decimal(length) / 2, Decimal(width)

#         elif fold_type == "TRI":
#             return Decimal(length) / 3, Decimal(width)

#         elif fold_type == "QUARTER":
#             return Decimal(length) / 2, Decimal(width) / 2

#         return Decimal(length), Decimal(width)

#     # ----------------------------------------
#     # 2. WEIGHT
#     # ----------------------------------------
#     def calculate_weight(self, length, width, gsm):

#         try:
#             area_m2 = (Decimal(length) * Decimal(width)) / Decimal(1550)
#             return round(area_m2 * Decimal(gsm), 2)
#         except:
#             return Decimal("0")

#     # ----------------------------------------
#     # 3. PACKING LOGIC (REAL)
#     # ----------------------------------------
#     def packing(self, folded_l, folded_w, thickness, pcs):

#         # assume carton base ~ folded size multiples
#         max_length = folded_l * 4
#         max_width = folded_w * 4

#         row_fit = floor(max_length / folded_l)
#         col_fit = floor(max_width / folded_w)

#         per_layer = row_fit * col_fit

#         if per_layer == 0:
#             per_layer = 1

#         layers = floor(pcs / per_layer)

#         if layers == 0:
#             layers = 1

#         total_packed = per_layer * layers

#         return {
#             "rows": row_fit,
#             "cols": col_fit,
#             "layers": layers,
#             "total": total_packed
#         }

#     # ----------------------------------------
#     # 4. CARTON SIZE
#     # ----------------------------------------
#     def carton_size(self, folded_l, folded_w, thickness, packing):

#         length = folded_l * packing["rows"] + 2
#         width = folded_w * packing["cols"] + 2
#         height = thickness * packing["layers"] + 2

#         return {
#             "length": round(length, 2),
#             "width": round(width, 2),
#             "height": round(height, 2)
#         }

#     # ----------------------------------------
#     # 5. CBM
#     # ----------------------------------------
#     def cbm(self, l, w, h):
#         return (Decimal(l) * Decimal(w) * Decimal(h)) / Decimal(1000000)

#     # ----------------------------------------
#     # 6. CONTAINER LOGIC
#     # ----------------------------------------

#     def container_calc(self, carton):

#         results = {}

#         for ctype, spec in CONTAINER_SPECS.items():

#             # 1. Fit along each dimension
#             length_fit = floor(spec["length_cm"] / carton["length"])
#             width_fit  = floor(spec["width_cm"]  / carton["width"])
#             height_fit = floor(spec["height_cm"] / carton["height"])

#             # 2. Volume-based cartons (3D packing)
#             volume_based = length_fit * width_fit * height_fit

#             # 3. Weight constraint
#             if carton.get("weight"):
#                 weight_based = floor(spec["max_payload_kg"] / carton["weight"])
#                 cartons = min(volume_based, weight_based)
#             else:
#                 cartons = volume_based

#             # 4. Utilization (optional but useful)
#             container_cbm = (
#                 Decimal(spec["length_cm"]) *
#                 Decimal(spec["width_cm"]) *
#                 Decimal(spec["height_cm"])
#             ) / Decimal(1000000)

#             carton_cbm = self.cbm(
#                 carton["length"],
#                 carton["width"],
#                 carton["height"]
#             )

#             used_cbm = cartons * carton_cbm
#             utilization = (used_cbm / container_cbm) * 100 if container_cbm else 0

#             results[ctype] = {
#                 "cartons": cartons,
#                 "utilization": round(utilization, 2)
#             }

#         best = max(results.items(), key=lambda x: x[1]["utilization"])

#         return {
#             "all": results,
#             "recommended": best[0]
#         }


#     # ----------------------------------------
#     # 7. MAIN COMPUTE
#     # ----------------------------------------
#     def compute(self, sp):

#         length = Decimal(sp.get("length_in"))
#         width = Decimal(sp.get("width_in"))
#         gsm = Decimal(sp.get("gsm"))
#         pcs = int(sp.get("unit_per_carton"))
#         fold = sp.get("fold")

#         # 1. Fold
#         folded_l, folded_w = self.apply_fold(length, width, fold)

#         if not folded_l or not folded_w:
#             raise ValueError("Invalid folded dimensions")

#         # 2. Weight
#         weight = sp.get("wt_per_unit")
#         if not weight:
#             weight = self.calculate_weight(length, width, gsm)
#         else:
#             weight = Decimal(weight)

#         # 3. Thickness
#         thickness = round((Decimal(gsm) / Decimal(1000)) * Decimal("0.8"), 3)

#         # 4. Packing
#         pack = self.packing(folded_l, folded_w, thickness, pcs)

#         # 5. Carton
#         carton = self.carton_size(folded_l, folded_w, thickness, pack)

#         # 6. CBM
#         cbm_val = self.cbm(carton["length"], carton["width"], carton["height"])

#         # 🔥 IMPORTANT: convert to cm
#         carton_data = {
#             "length": carton["length"] * Decimal("2.54"),
#             "width": carton["width"] * Decimal("2.54"),
#             "height": carton["height"] * Decimal("2.54"),
#             "weight": weight
#         }

#         # 7. Container
#         container = self.container_calc(carton_data)

#         return {
#             "folded_length": folded_l,
#             "folded_width": folded_w,
#             "weight": weight,
#             "packing": pack,
#             "carton": carton,
#             "cbm": cbm_val,
#             "container": container
#         }



from decimal import Decimal, InvalidOperation
from math import floor

from programs.utils.container_config import CONTAINER_SPECS


class CartonCalculator:

    # ----------------------------------------
    # 0. SAFE PARSERS
    # ----------------------------------------
    def _require_decimal(self, sp, field, label=None):
        """Parse a required field as Decimal. Raise a clear error if missing/empty/invalid."""
        value = sp.get(field)
        label = label or field
        if value is None or value == "":
            raise ValueError(f"'{label}' is required.")
        try:
            return Decimal(str(value))
        except (InvalidOperation, ValueError):
            raise ValueError(f"'{label}' must be a valid number.")

    def _require_int(self, sp, field, label=None):
        """Parse a required field as int. Raise a clear error if missing/empty/invalid."""
        value = sp.get(field)
        label = label or field
        if value is None or value == "":
            raise ValueError(f"'{label}' is required.")
        try:
            return int(Decimal(str(value)))
        except (InvalidOperation, ValueError):
            raise ValueError(f"'{label}' must be a valid whole number.")

    def _optional_decimal(self, sp, field, default=None):
        """Parse an optional field as Decimal. Returns default if missing/empty/invalid."""
        value = sp.get(field)
        if value is None or value == "":
            return default
        try:
            return Decimal(str(value))
        except (InvalidOperation, ValueError):
            return default

    # ----------------------------------------
    # 1. APPLY FOLD
    # ----------------------------------------
    def apply_fold(self, length, width, fold_type):

        if not length or not width:
            return None, None

        length = Decimal(length)
        width = Decimal(width)

        if length <= 0 or width <= 0:
            return None, None

        fold_type = (fold_type or "").upper().strip()

        if fold_type == "FULL":
            return length, width

        elif fold_type == "HALF":
            return length / 2, width

        elif fold_type == "TRI":
            return length / 3, width

        elif fold_type == "QUARTER":
            return length / 2, width / 2

        return length, width

    # ----------------------------------------
    # 2. WEIGHT
    # ----------------------------------------
    def calculate_weight(self, length, width, gsm):

        try:
            area_m2 = (Decimal(length) * Decimal(width)) / Decimal(1550)
            return round(area_m2 * Decimal(gsm), 2)
        except:
            return Decimal("0")

    # ----------------------------------------
    # 3. PACKING LOGIC (REAL)
    # ----------------------------------------
    def packing(self, folded_l, folded_w, thickness, pcs):

        # assume carton base ~ folded size multiples
        max_length = folded_l * 4
        max_width = folded_w * 4

        row_fit = floor(max_length / folded_l)
        col_fit = floor(max_width / folded_w)

        per_layer = row_fit * col_fit

        if per_layer == 0:
            per_layer = 1

        layers = floor(pcs / per_layer)

        if layers == 0:
            layers = 1

        total_packed = per_layer * layers

        return {
            "rows": row_fit,
            "cols": col_fit,
            "layers": layers,
            "total": total_packed
        }

    # ----------------------------------------
    # 4. CARTON SIZE
    # ----------------------------------------
    def carton_size(self, folded_l, folded_w, thickness, packing):

        length = folded_l * packing["rows"] + 2
        width = folded_w * packing["cols"] + 2
        height = thickness * packing["layers"] + 2

        return {
            "length": round(length, 2),
            "width": round(width, 2),
            "height": round(height, 2)
        }

    # ----------------------------------------
    # 5. CBM
    # ----------------------------------------
    def cbm(self, l, w, h):
        return (Decimal(l) * Decimal(w) * Decimal(h)) / Decimal(1000000)

    # ----------------------------------------
    # 6. CONTAINER LOGIC
    # ----------------------------------------

    def container_calc(self, carton):

        results = {}

        for ctype, spec in CONTAINER_SPECS.items():

            # 1. Fit along each dimension
            length_fit = floor(spec["length_cm"] / carton["length"])
            width_fit  = floor(spec["width_cm"]  / carton["width"])
            height_fit = floor(spec["height_cm"] / carton["height"])

            # 2. Volume-based cartons (3D packing)
            volume_based = length_fit * width_fit * height_fit

            # 3. Weight constraint
            if carton.get("weight"):
                weight_based = floor(spec["max_payload_kg"] / carton["weight"])
                cartons = min(volume_based, weight_based)
            else:
                cartons = volume_based

            # 4. Utilization (optional but useful)
            container_cbm = (
                Decimal(spec["length_cm"]) *
                Decimal(spec["width_cm"]) *
                Decimal(spec["height_cm"])
            ) / Decimal(1000000)

            carton_cbm = self.cbm(
                carton["length"],
                carton["width"],
                carton["height"]
            )

            used_cbm = cartons * carton_cbm
            utilization = (used_cbm / container_cbm) * 100 if container_cbm else 0

            results[ctype] = {
                "cartons": cartons,
                "utilization": round(utilization, 2)
            }

        best = max(results.items(), key=lambda x: x[1]["utilization"])

        return {
            "all": results,
            "recommended": best[0]
        }


    # ----------------------------------------
    # 7. MAIN COMPUTE
    # ----------------------------------------
    def compute(self, sp):

        # Required numeric fields — raise a clear ValueError instead of crashing
        # on int('') / Decimal('') if the frontend sends an empty string.
        length = self._require_decimal(sp, "length_in", "Length (in)")
        width = self._require_decimal(sp, "width_in", "Width (in)")
        gsm = self._require_decimal(sp, "gsm", "GSM")
        pcs = self._require_int(sp, "unit_per_carton", "Unit/Carton")
        fold = sp.get("fold")

        # 1. Fold
        folded_l, folded_w = self.apply_fold(length, width, fold)

        if not folded_l or not folded_w:
            raise ValueError(
                "Length (in) and Width (in) must both be greater than 0 "
                "to calculate folded dimensions."
            )

        # 2. Weight (optional — falls back to calculated weight if not provided)
        weight = self._optional_decimal(sp, "wt_per_unit")
        if weight is None:
            weight = self.calculate_weight(length, width, gsm)

        # 3. Thickness
        thickness = round((Decimal(gsm) / Decimal(1000)) * Decimal("0.8"), 3)

        # 4. Packing
        pack = self.packing(folded_l, folded_w, thickness, pcs)

        # 5. Carton
        carton = self.carton_size(folded_l, folded_w, thickness, pack)

        # 6. CBM
        cbm_val = self.cbm(carton["length"], carton["width"], carton["height"])

        # 🔥 IMPORTANT: convert to cm
        carton_data = {
            "length": carton["length"] * Decimal("2.54"),
            "width": carton["width"] * Decimal("2.54"),
            "height": carton["height"] * Decimal("2.54"),
            "weight": weight
        }

        # 7. Container
        container = self.container_calc(carton_data)

        return {
            "folded_length": folded_l,
            "folded_width": folded_w,
            "weight": weight,
            "packing": pack,
            "carton": carton,
            "cbm": cbm_val,
            "container": container
        }