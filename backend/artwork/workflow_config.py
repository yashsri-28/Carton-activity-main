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
        {"code": "MATCODE_GENERATION", "type": "MATCODE", "role": "PROCUREMENT", "label": "Procurement — Reference Code Generation"},
    ],
    
    
    "BW_STICKER_MATCODE_FLOW": [
        {"code": "MARKETING_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "MARKETING", "label": "Marketing — Artwork Approval"},
        # {"code": "MATCODE_GENERATION", "type": "MATCODE", "role": "PROCUREMENT", "label": "Procurement — Matcode Generation"},
        {"code": "MATCODE_GENERATION", "type": "MATCODE", "role": "PROCUREMENT", "label": "Procurement — Reference Code Generation"},
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
    "LABEL": "RIBBON_SAMPLE_FLOW",
    "PAPER_PRINTED_ITEM": "RIBBON_SAMPLE_FLOW",
}


def get_workflow_key(category):
    """Given a PackagingSpecification category code (e.g. 'RIBBON'),
    returns which workflow key it should follow. Falls back to
    'STANDARD' for any category not explicitly mapped."""
    return CATEGORY_WORKFLOW_MAP.get(category, "STANDARD")


def get_workflow_steps(workflow_key):
    """Returns the ordered list of step definitions for a workflow key."""
    return WORKFLOW_DEFINITIONS.get(workflow_key, WORKFLOW_DEFINITIONS["STANDARD"])



def build_ribbon_steps(artwork):
    """RIBBON's steps are built DYNAMICALLY per-artwork, because the
    stakeholders selected at request-creation time (legal/compliance/
    lab_approval_required) determine WHO ELSE must approve alongside
    Marketing/TQM at each gate. Multiple rows sharing the same
    'sequence' number form one GATE — the artwork only moves past a
    gate once EVERY row in it is DONE."""
    steps = []
    seq = 1

    # Gate 1 — Artwork Approval: Marketing always, plus any ticked stakeholder
    steps.append({"code": "MARKETING_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "MARKETING", "label": "Marketing — Artwork Approval", "sequence": seq})
    if artwork.legal_approval_required:
        steps.append({"code": "LEGAL_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "LEGAL", "label": "Legal — Artwork Approval", "sequence": seq})
    if artwork.compliance_approval_required:
        steps.append({"code": "COMPLIANCE_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "COMPLIANCE", "label": "Compliance — Artwork Approval", "sequence": seq})
    if artwork.lab_approval_required:
        steps.append({"code": "LAB_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "LAB", "label": "Lab — Artwork Approval", "sequence": seq})
    seq += 1

    # Gate 2 — Procurement sends the physical sample
    steps.append({"code": "PHYSICAL_SAMPLE", "type": "PHYSICAL_SAMPLE", "role": "PROCUREMENT", "label": "Procurement — Physical Sample", "sequence": seq})
    seq += 1

    # Gate 3 — Sample Approval: Marketing + TQM always, plus any ticked stakeholder
    steps.append({"code": "MARKETING_SAMPLE_APPROVAL", "type": "SAMPLE_APPROVAL", "role": "MARKETING", "label": "Marketing — Sample Approval", "sequence": seq})
    steps.append({"code": "TQM_SAMPLE_APPROVAL", "type": "SAMPLE_APPROVAL", "role": "TTQM", "label": "TQM — Sample Approval", "sequence": seq})
    if artwork.legal_approval_required:
        steps.append({"code": "LEGAL_SAMPLE_APPROVAL", "type": "SAMPLE_APPROVAL", "role": "LEGAL", "label": "Legal — Sample Approval", "sequence": seq})
    if artwork.compliance_approval_required:
        steps.append({"code": "COMPLIANCE_SAMPLE_APPROVAL", "type": "SAMPLE_APPROVAL", "role": "COMPLIANCE", "label": "Compliance — Sample Approval", "sequence": seq})
    if artwork.lab_approval_required:
        steps.append({"code": "LAB_SAMPLE_APPROVAL", "type": "SAMPLE_APPROVAL", "role": "LAB", "label": "Lab — Sample Approval", "sequence": seq})
    seq += 1

    # Gate 4 — Reference Code Generation
    steps.append({"code": "MATCODE_GENERATION", "type": "MATCODE", "role": "PROCUREMENT", "label": "Procurement — Reference code Generation", "sequence": seq})

    return steps


def get_workflow_steps_for_artwork(artwork):
    """Like get_workflow_steps(), but supports workflows (like RIBBON,
    BW_STICKER) whose steps depend on THIS SPECIFIC artwork's selected
    stakeholders, not just a fixed config list."""
    if artwork.workflow_key == "RIBBON_SAMPLE_FLOW":
        return build_ribbon_steps(artwork)
    if artwork.workflow_key == "BW_STICKER_MATCODE_FLOW":
        return build_bw_sticker_steps(artwork)
    return [dict(s, sequence=i) for i, s in enumerate(get_workflow_steps(artwork.workflow_key), start=1)]


def build_bw_sticker_steps(artwork):
    """BW_STICKER's steps — same dynamic-stakeholder pattern as RIBBON,
    but a shorter flow (no physical sample stage). Marketing is
    always the base reviewer; any ticked stakeholder (Legal/
    Compliance/Lab) joins the SAME gate and must also approve before
    the request moves on to reference code generation."""
    steps = []
    seq = 1

    # Gate 1 — Artwork Approval: Marketing always, plus any ticked stakeholder
    steps.append({"code": "MARKETING_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "MARKETING", "label": "Marketing — Artwork Approval", "sequence": seq})
    if artwork.legal_approval_required:
        steps.append({"code": "LEGAL_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "LEGAL", "label": "Legal — Artwork Approval", "sequence": seq})
    if artwork.compliance_approval_required:
        steps.append({"code": "COMPLIANCE_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "COMPLIANCE", "label": "Compliance — Artwork Approval", "sequence": seq})
    if artwork.lab_approval_required:
        steps.append({"code": "LAB_ARTWORK_APPROVAL", "type": "APPROVAL", "role": "LAB", "label": "Lab — Artwork Approval", "sequence": seq})
    seq += 1

    # Gate 2 — Reference Code Generation
    steps.append({"code": "MATCODE_GENERATION", "type": "MATCODE", "role": "PROCUREMENT", "label": "Procurement — Matcode Generation", "sequence": seq})

    return steps