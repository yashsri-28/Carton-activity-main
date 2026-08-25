# ============================================================
# Category-specific workflow definitions.
#
# STANDARD = the existing, untouched Marketing -> PPC -> TQM chain
# used by every category by default.
#
# Any category that needs a DIFFERENT lifecycle (e.g. RIBBON's
# physical-sample-based flow) gets its own entry here. Adding a new
# custom workflow for a future category NEVER requires touching the
# STANDARD flow's code — just add a new key below.
# ============================================================

WORKFLOW_DEFINITIONS = {

    "STANDARD": [
        {"code": "MARKETING", "type": "APPROVAL", "role": "MARKETING", "label": "Marketing"},
        {"code": "PPC", "type": "APPROVAL", "role": "PPC", "label": "Packaging (PPC)"},
        {"code": "TQM", "type": "APPROVAL", "role": "TTQM", "label": "TQM"},
    ],

    "RIBBON_SAMPLE_FLOW": [
        {"code": "MARKETING_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "MARKETING", "label": "Marketing — Artwork Approval"},
        {"code": "PHYSICAL_SAMPLE", "type": "PHYSICAL_SAMPLE", "role": "PROCUREMENT", "label": "Procurement — Physical Sample"},
        {"code": "MARKETING_SAMPLE_APPROVAL", "type": "SAMPLE_APPROVAL", "role": "MARKETING", "label": "Marketing — Sample Approval"},
        {"code": "MATCODE_GENERATION", "type": "MATCODE", "role": "PROCUREMENT", "label": "Procurement — Matcode Generation"},
    ],
    
    
    "BW_STICKER_MATCODE_FLOW": [
        {"code": "MARKETING_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "MARKETING", "label": "Marketing — Artwork Approval"},
        {"code": "MATCODE_GENERATION", "type": "MATCODE", "role": "PROCUREMENT", "label": "Procurement — Matcode Generation"},
    ],

    # Future example — copy this pattern for any new category:
    # "SOME_OTHER_FLOW": [
    #     {"code": "...", "type": "APPROVAL", "role": "...", "label": "..."},
    # ],
}

# Which category uses which workflow. Anything NOT listed here
# automatically falls back to "STANDARD" — so adding new categories
# to the system never breaks unless explicitly mapped here.
CATEGORY_WORKFLOW_MAP = {
    "RIBBON": "RIBBON_SAMPLE_FLOW",
    "BW_STICKER": "BW_STICKER_MATCODE_FLOW",
}


def get_workflow_key(category):
    """Given a PackagingSpecification category code (e.g. 'RIBBON'),
    returns which workflow key it should follow. Falls back to
    'STANDARD' for any category not explicitly mapped."""
    return CATEGORY_WORKFLOW_MAP.get(category, "STANDARD")


def get_workflow_steps(workflow_key):
    """Returns the ordered list of step definitions for a workflow key."""
    return WORKFLOW_DEFINITIONS.get(workflow_key, WORKFLOW_DEFINITIONS["STANDARD"])