from decimal import Decimal

CONTAINER_SPECS = {
    "20FT": {
        "length_cm": Decimal("589"),
        "width_cm": Decimal("235"),
        "height_cm": Decimal("239"),
        "max_payload_kg": Decimal("28000"),
    },
    "40FT": {
        "length_cm": Decimal("1203"),
        "width_cm": Decimal("235"),
        "height_cm": Decimal("239"),
        "max_payload_kg": Decimal("27000"),
    },
    "40HC": {   
        "length_cm": 1203,
        "width_cm": 235,
        "height_cm": 269,
        "max_payload_kg": 26000
    }
}
