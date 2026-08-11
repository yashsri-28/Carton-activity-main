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
    def container_calc(self, carton_cbm):

        results = {}

        for ctype, spec in CONTAINER_SPECS.items():

            # container_cbm = Decimal(spec["cbm"])

            container_cbm = (
                Decimal(spec["length_cm"]) *
                Decimal(spec["width_cm"]) *
                Decimal(spec["height_cm"])
            ) / Decimal(1000000)

            cartons = floor(container_cbm / carton_cbm)

            used_cbm = cartons * carton_cbm
            utilization = (used_cbm / container_cbm) * 100

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

        # 2. Weight
        weight = sp.get("wt_per_unit") or self.calculate_weight(length, width, gsm)

        # 3. Thickness (derived)
        thickness = (Decimal(gsm) / Decimal(1000)) * Decimal("0.8")

        # 4. Packing
        pack = self.packing(folded_l, folded_w, thickness, pcs)

        # 5. Carton size
        carton = self.carton_size(folded_l, folded_w, thickness, pack)

        # 6. CBM
        cbm_val = self.cbm(carton["length"], carton["width"], carton["height"])

        # 7. Container
        container = self.container_calc(cbm_val)

        return {
            "folded_length": folded_l,
            "folded_width": folded_w,
            "weight": weight,
            "packing": pack,
            "carton": carton,
            "cbm": cbm_val,
            "container": container
        }