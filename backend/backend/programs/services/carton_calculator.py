from decimal import Decimal
from math import floor

from programs.utils.container_config import CONTAINER_SPECS


class CartonCalculator:

    # ----------------------------------------
    # 1. APPLY FOLD
    # ----------------------------------------
    def apply_fold(self, length, width, fold_type):

        if not length or not width:
            return None, None

        fold_type = (fold_type or "").upper().strip()

        if fold_type == "FULL":
            return Decimal(length), Decimal(width)

        elif fold_type == "HALF":
            return Decimal(length) / 2, Decimal(width)

        elif fold_type == "TRI":
            return Decimal(length) / 3, Decimal(width)

        elif fold_type == "QUARTER":
            return Decimal(length) / 2, Decimal(width) / 2

        return Decimal(length), Decimal(width)

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

        length = Decimal(sp.get("length_in"))
        width = Decimal(sp.get("width_in"))
        gsm = Decimal(sp.get("gsm"))
        pcs = int(sp.get("unit_per_carton"))
        fold = sp.get("fold")

        # 1. Fold
        folded_l, folded_w = self.apply_fold(length, width, fold)

        if not folded_l or not folded_w:
            raise ValueError("Invalid folded dimensions")

        # 2. Weight
        weight = sp.get("wt_per_unit")
        if not weight:
            weight = self.calculate_weight(length, width, gsm)
        else:
            weight = Decimal(weight)

        # 3. Thickness
        thickness = round((Decimal(gsm) / Decimal(1000)) * Decimal("0.8"), 3)

        # 4. Packing
        pack = self.packing(folded_l, folded_w, thickness, pcs)

        # 5. Carton
        carton = self.carton_size(folded_l, folded_w, thickness, pack)

        # 6. 🔥 IMPORTANT: convert carton dims to cm BEFORE using them anywhere else.
        #    CONTAINER_SPECS, calculated_cbm_per_carton and cartons_per_container()
        #    on the model all assume cm inputs. Previously "carton" (inches) was
        #    persisted as-is while only a throwaway copy was converted to cm just
        #    for the container preview here - causing CBM and cartons/20ft & 40ft
        #    to be wrong once the value hit the database. Standardizing on cm end
        #    to end fixes both.
        carton_cm = {
            "length": round(carton["length"] * Decimal("2.54"), 2),
            "width": round(carton["width"] * Decimal("2.54"), 2),
            "height": round(carton["height"] * Decimal("2.54"), 2),
        }

        # 7. CBM (must use the same cm values that get persisted)
        cbm_val = self.cbm(carton_cm["length"], carton_cm["width"], carton_cm["height"])

        # 8. Container fit preview
        carton_data = {**carton_cm, "weight": weight}
        container = self.container_calc(carton_data)

        return {
            "folded_length": folded_l,
            "folded_width": folded_w,
            "weight": weight,
            "packing": pack,
            "carton": carton_cm,     # cm - this is what gets stored on the model
            "carton_in": carton,     # original inch values, kept for reference/debug only
            "cbm": cbm_val,
            "container": container
        }