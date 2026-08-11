# TQM / Carton Program changes - what changed and where

All changes below were tested against a disposable SQLite copy of these
apps (models + migration + the actual view functions via
APIRequestFactory), simulating the migration state your real DB already
has. Full submit -> block -> recalculate -> submit -> validation flow
passed. This was NOT tested against real MSSQL or the full URL/auth stack -
please smoke test in a dev environment before deploying.

## 1. Critical fix: CBM / Cartons-per-20ft/40ft were wrong
**File:** `programs/services/carton_calculator.py`

`compute()` was calculating carton dimensions in inches, but only
converting a throwaway local copy to cm for the container-fit preview.
The dict actually returned (and persisted to `CartonProgramSubProgram`)
stayed in inches, while `CONTAINER_SPECS` and the model's
`calculated_cbm_per_carton` / `cartons_per_container()` both assume cm.
Result: CBM was calculated ~16x too small and cartons/20ft & 40ft were
wildly inflated for any auto-generated (non-TQM-edited) carton dims.

**Fix:** `compute()` now converts carton dims to cm before returning them,
so what gets stored matches what the model math expects. The original
inch values are still returned under `carton_in` for reference/debugging.

## 2. New fields on `CartonProgramSubProgram`
**Files:** `programs/models.py`, `programs/migrations/0006_subprogram_size_uom_recalc_fields.py`

| Field | Purpose |
|---|---|
| `size` | King/Queen/Twin/etc. (choices) |
| `product_type` | Sheet Set/Flat Sheet/Fitted Sheet/Pillowcase/Duvet Cover/Other (choices) |
| `size_display_label` (property) | e.g. "King Sheet Set" - combines the two above for display |
| `weight_uom` | GM/KG/LB - UOM for `wt_per_unit` |
| `self_fabric_bag` | New Yes/No field (didn't exist before) |
| `is_recalculated`, `last_recalculated_on` | Backs the Recalculate-button gating (see #4) |

`ribbon` and `belly_band` now have `choices=(("YES","Yes"),("NO","No"))`.
Note: since these views write directly via `.create()` / manual attribute
assignment (no DRF serializers), `choices=` alone does **not** enforce
anything at the API layer - see #3.

Migration `0006` was hand-written (not machine-generated) because the
sandbox couldn't connect to your MSSQL instance or read `cartonConf.ini`.
It's been verified to apply cleanly against a database already migrated
through `0005` (i.e. your current production state) - see note in the
migration file about the pre-existing `0002_initial`/duplicate-`0003`
migration issue (found while testing, unrelated to this feature request -
see "Pre-existing issue" section below).

## 3. Server-side Yes/No validation
**File:** `programs/views.py` - new `_validate_yes_no()` helper

Applied to `ribbon`, `belly_band`, `self_fabric_bag` in `submit_carton_program`,
`edit_carton_program`, and `bulk_update_tqm_subprogram`. Input is
case/whitespace-normalized (`"yes"` -> `"YES"`) and anything else returns
a 400. This is necessary because a frontend dropdown alone can't stop a
raw API call from sending an arbitrary string - these views never route
through a serializer that would validate `choices=` automatically.

## 4. Recalculate button gating
**Files:** `programs/models.py`, `programs/views.py`

- `get_carton_calculations_ai` (`/api/carton-program/calculations-ai/`) is
  now **also** the Recalculate action: calling it marks every subprogram
  in the program `is_recalculated=True` with a timestamp, in addition to
  returning the CBM/container-fit numbers it always did.
- `bulk_update_tqm_subprogram` checks `is_recalculated` on every
  subprogram in the request **before** touching the DB, for both
  `tentative_submit` and `final_submit`. If any subprogram isn't
  recalculated, it returns 400 with the offending subprogram IDs and
  changes nothing.
- Editing `carton_length`/`carton_width`/`carton_height` again within
  `bulk_update_tqm_subprogram` resets `is_recalculated` back to False for
  that row, so a further submit is blocked until Recalculate is clicked
  again.
- `get_carton_program_details` now returns `is_recalculated` per
  subprogram, so the frontend can grey out Tentative/Final submit
  directly from the data it already loads.

**Frontend integration:** disable Tentative/Final Submit unless every
subprogram's `is_recalculated` is `true`; call
`/api/carton-program/calculations-ai/` on the Recalculate button click;
re-enable the disabled state locally whenever the user edits any carton
dimension (the backend will also independently re-block on submit as a
safety net).

## 5. Weight now editable by TQM
**File:** `programs/views.py` - `bulk_update_tqm_subprogram`

`wt_per_unit` and `weight_uom` are now accepted and saved in the TQM bulk
update loop. Previously TQM had no way to correct weight per piece at all
- only Marketing's original value (or the calculator's estimate) stuck.

## 6. Packed product dimension - open form & folded form
No schema gap here - `width_in`/`length_in` (+ now-populated `width_cm`/
`length_cm`) and `folded_length`/`folded_width` already existed; they just
weren't being populated/surfaced consistently:
- `submit_carton_program` and `edit_carton_program` now auto-derive
  `width_cm`/`length_cm` from the inch values if not explicitly provided.
- `get_carton_program_details` now returns `folded_length`/`folded_width`
  alongside the open-form dims so the frontend can label them "Open" vs
  "Folded".

## 7. `copy_carton_program` brought up to parity
**File:** `programs/views.py`

Previously this endpoint dropped almost everything on copy - carton/PDQ/
pallet dims, ribbon/belly band, remarks, size/product_type, weight - only
5 basic fields were copied. It now copies all subprogram fields. Copies
are forced to `is_recalculated=False` so TQM must re-confirm the numbers
even though they were carried over.

## 8. `edit_carton_program` no longer wipes carton dimensions
**File:** `programs/views.py`

Previously, editing a program deleted and recreated subprograms without
ever calling `CartonCalculator`, silently nulling out
`folded_length`/`folded_width`/`carton_length`/`width`/`height` on every
edit. It now recomputes them the same way `submit_carton_program` does.

---

## Pre-existing issue found during testing (not part of this request)
`programs/migrations/0002_initial.py` re-declares several fields already
created by `0001_initial.py` (e.g. `CartonProgram.created_by`), and there
are two divergent `0003_...` migrations that both depend on `0002_initial`
but were never merged. This means a fresh `python manage.py migrate` on a
brand-new/empty database fails with "duplicate column" and "multiple leaf
nodes" errors. It doesn't affect your live DB (which presumably already
has these applied), but will bite the next time someone spins up a new
dev/test/DR environment from scratch. Migration `0006` added here depends
on both `0003` branches to at least stop the leaf-node split going
forward; the `0001`/`0002` duplication itself was left untouched since
editing already-applied migrations is risky without seeing your live
`django_migrations` table. Worth a dedicated cleanup pass separately.
