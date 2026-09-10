// Shared field definitions for the Bedsheet "Freezing Note" table.
// Used by FormMain.jsx (create), EditCartonForm.jsx (edit — Marketing only),
// and CartonView.jsx (read-only view for all roles).
// Keeping this in one place means all three UIs always stay in sync.
//
// Each field belongs to a "group" — these render as a colored two-tier
// header (group row + field row) matching the client's Freezing Note
// layout, but using the app's own navy/section-tint style instead of the
// spreadsheet's multi-color bands.

export const FREEZING_NOTE_GROUPS = [
  { key: 'general', label: 'General Information' },
  { key: 'packing', label: 'Packing Status' },
  { key: 'carton_dim', label: 'Carton Details (Part # 1) — Carton Dimension' },
  { key: 'carton_weight', label: 'Carton Weight Details' },
  { key: 'carton_ply', label: 'Carton Details (Part # 2) — Ply & Strength' },
  { key: 'stiffener', label: 'Stiffener Details' },
  { key: 'side_stiffener', label: 'Side Stiffeners Details' },
  { key: 'separator', label: 'Separator Details' },
  { key: 'bag_box', label: 'PVC Bag / Self Bag / Inner Box Details' },
  { key: 'ld_polybag', label: 'LD Polybag Details' },
  { key: 'printing', label: 'LD Polybag Printing Matter' },
  { key: 'other', label: 'Other Information' },
  { key: 'macys', label: "For Macy's Only" },
  { key: 'additional', label: 'Additional Information' },
];

export const FREEZING_NOTE_FIELDS = [
  { key: 'sr_no', label: 'Sr. No.', type: 'number', width: 'w-16', group: 'general', sticky: true },
  { key: 'size', label: 'Size', type: 'text', width: 'w-24', group: 'general', sticky: true },
  { key: 'product_dimension', label: 'Product Dimension (IN or CM)', type: 'text', width: 'w-40', group: 'general', sticky: true },

  { key: 'pcs_per_bag_or_inner_box', label: 'Pcs/Bag or Pcs/Inner Box', type: 'text', width: 'w-28', group: 'packing' },
  { key: 'bag_or_innerbox_per_carton', label: 'Bag/Inner Box per Carton', type: 'text', width: 'w-28', group: 'packing' },
  { key: 'pcs_per_carton', label: 'Pcs/Carton', type: 'text', width: 'w-24', group: 'packing' },

  { key: 'carton_type_paper', label: 'Carton Type (Outer/Inner) Paper', type: 'text', width: 'w-36', group: 'carton_dim' },
  // Carton Length/Width/Height/CBM/Max Outside Dim are TQM-only fields —
  // filled after PPC accepts, via the "Recalculate" action, not by
  // Marketing at submit time. See tqmOnly flag below.
  { key: 'carton_length_cm', label: 'Length/Depth (CM)', type: 'number', width: 'w-24', group: 'carton_dim', tqmOnly: true },
  { key: 'carton_width_cm', label: 'Width (CM)', type: 'number', width: 'w-24', group: 'carton_dim', tqmOnly: true },
  { key: 'carton_height_cm', label: 'Height (CM)', type: 'number', width: 'w-24', group: 'carton_dim', tqmOnly: true },
  { key: 'cbm', label: 'CBM (Auto)', type: 'readonly', width: 'w-24', group: 'carton_dim', tqmOnly: true },
  { key: 'max_outside_carton_dimension', label: 'Max Outside Carton Dim. (L*W*H)', type: 'readonly', width: 'w-28', group: 'carton_dim', tqmOnly: true },

  { key: 'net_weight_kgs', label: 'Net Weight (KGS)', type: 'number', width: 'w-24', group: 'carton_weight' },
  { key: 'gross_weight_kgs', label: 'Gross Weight (KGS)', type: 'number', width: 'w-24', group: 'carton_weight' },

  { key: 'carton_ply_no', label: 'Carton Ply No.', type: 'text', width: 'w-20', group: 'carton_ply' },
  { key: 'carton_min_bursting_strength', label: 'Min Bursting Strength (KG/SQ.CM)', type: 'text', width: 'w-32', group: 'carton_ply' },
  { key: 'carton_min_edge_crush_test', label: 'Min Edge Crush Test (LBS/INCH)', type: 'text', width: 'w-32', group: 'carton_ply' },

  { key: 'stiffener_dimension', label: 'Stiffener Dimension', type: 'text', width: 'w-40', group: 'stiffener' },
  { key: 'stiffener_no_of_ply', label: 'No. of Ply', type: 'text', width: 'w-20', group: 'stiffener' },
  { key: 'stiffener_type_cut', label: 'Type & Cut', type: 'text', width: 'w-32', group: 'stiffener' },

  { key: 'side_stiffener_dimension', label: 'Dimension', type: 'text', width: 'w-40', group: 'side_stiffener' },
  { key: 'side_stiffener_no_of_ply', label: 'No. of Ply', type: 'text', width: 'w-20', group: 'side_stiffener' },
  { key: 'side_stiffener_type_cut', label: 'Type & Cut', type: 'text', width: 'w-32', group: 'side_stiffener' },

  { key: 'separator_dimension', label: 'Separator Dimension', type: 'text', width: 'w-32', group: 'separator' },
  { key: 'separator_no_of_ply', label: 'No. of Ply', type: 'text', width: 'w-20', group: 'separator' },

  { key: 'bag_or_innerbox_size', label: 'Size of Bag/Inner Box', type: 'text', width: 'w-32', group: 'bag_box' },
  { key: 'bag_type_or_box_type', label: 'Bag Type / Box Type', type: 'text', width: 'w-28', group: 'bag_box' },

  { key: 'ld_polybag_length_cm', label: 'Length (CM)', type: 'number', width: 'w-24', group: 'ld_polybag' },
  { key: 'ld_polybag_width_cm', label: 'Width (CM)', type: 'number', width: 'w-24', group: 'ld_polybag' },
  { key: 'ld_polybag_flap_cm', label: 'Flap (CM)', type: 'number', width: 'w-24', group: 'ld_polybag' },
  { key: 'ld_polybag_thickness_micron', label: 'Thickness (Micron)', type: 'text', width: 'w-28', group: 'ld_polybag' },
  { key: 'ld_polybag_quality', label: 'Quality of Bag', type: 'text', width: 'w-24', group: 'ld_polybag' },

  { key: 'printing_matter_polybag', label: 'Printing Matter on Polybag', type: 'textarea', width: 'w-56', group: 'printing' },

  { key: 'product_position_in_carton', label: 'Position of Product Inside Carton', type: 'text', width: 'w-32', group: 'other' },
  { key: 'product_dim_length', label: 'Length (CM/IN)', type: 'text', width: 'w-24', group: 'other' },
  { key: 'product_dim_width', label: 'Width (CM/IN)', type: 'text', width: 'w-24', group: 'other' },
  { key: 'product_dim_height', label: 'Height (CM/IN)', type: 'text', width: 'w-24', group: 'other' },
  { key: 'bellyband_ribbon_dimension', label: 'Bellyband/Ribbon Dimension', type: 'text', width: 'w-32', group: 'other' },
  { key: 'bellyband_ribbon_quality', label: 'Bellyband/Ribbon Quality', type: 'text', width: 'w-28', group: 'other' },

  { key: 'macys_tmcl_placement', label: 'TMCL Placement', type: 'text', width: 'w-28', group: 'macys' },
  { key: 'macys_carton_type', label: 'Carton Type (Die Cut/Universal/Sweetbox)', type: 'text', width: 'w-32', group: 'macys' },
  { key: 'macys_tmcl_placement_type', label: 'TMCL Placement Type #', type: 'text', width: 'w-28', group: 'macys' },

  { key: 'pdq_accessories_others', label: 'PDQ Accessories & Others', type: 'text', width: 'w-32', group: 'additional' },
  { key: 'remarks', label: 'Remarks', type: 'textarea', width: 'w-40', group: 'additional' },
];