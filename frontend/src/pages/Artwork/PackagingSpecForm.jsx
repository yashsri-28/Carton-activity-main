// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { createArtworkWithSpec, getProcurementList } from '../../api/artworkApi';
// import specConfig from './packagingSpecConfig.json';

// // Human-readable labels for the category dropdown
// const CATEGORY_LABELS = {
//   PVC_BAG: 'PVC Bag Specification',
//   RIBBON: 'Ribbon',
//   BW_STICKER: 'B&W Sticker',
//   LABEL: 'Label',
//   PAPER_PRINTED_ITEM: 'Paper Printed Item',
//   BOX: 'Box',
//   OTHER: 'Other',
//   PDQ: 'PDQ',
// };

// // These 4 fields are identical across every category in the excel sheet
// // (confirmed from the source data), so they are shown once at the top,
// // BEFORE the category picker, and excluded from the category-specific
// // field list below so they never appear twice.
// const COMMON_FIELD_LABELS = ['PRODUCT', 'BUYER NAME', 'PROGRAM', 'COUNTRY'];

// // Splits raw excel option strings (e.g. "COTTON / POLYESTER/RECYCLE POLYESTER")
// // into a clean, deduplicated list of individual choices for the dropdown/suggestions.
// function flattenOptions(rawOptions) {
//   const choices = [];
//   rawOptions.forEach((raw) => {
//     raw
//       .split(/[/,]/)
//       .map((s) => s.trim())
//       .filter((s) => s.length > 0)
//       .forEach((s) => choices.push(s));
//   });
//   return [...new Set(choices)];
// }

// // One field = bold label above + its own clean rounded-border input box below.
// function SpecField({ field, value, onChange }) {
//   const options = flattenOptions(field.options || []);
//   const hasOptions = options.length > 0;
//   const datalistId = `dl-${field.label.replace(/[^a-zA-Z0-9]/g, '')}`;
//   const [showCustomHint, setShowCustomHint] = useState(false);

//   const placeholder = showCustomHint
//     ? 'Type your own value...'
//     : hasOptions
//       ? `e.g. ${options.slice(0, 2).join(', ')}${options.length > 2 ? '...' : ''}`
//       : `Enter value`;

//   const handleChange = (e) => {
//     const raw = e.target.value;
//     if (/^other\b.*(specify|if any)/i.test(raw.trim())) {
//       onChange(field.label, '');
//       setShowCustomHint(true);
//       return;
//     }
//     setShowCustomHint(false);
//     onChange(field.label, raw);
//   };

//   return (
//     <div>
//       <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 truncate" title={field.label}>
//         {field.label}
//       </label>
//       <input
//         type="text"
//         list={hasOptions ? datalistId : undefined}
//         value={value || ''}
//         onChange={handleChange}
//         placeholder={placeholder}
//         autoFocus={showCustomHint}
//         className="w-full px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
//       />
//       {showCustomHint && (
//         <p className="text-xs text-amber-600 mt-1">
//           "Other" — type your value above.
//         </p>
//       )}
//       {hasOptions && (
//         <datalist id={datalistId}>
//           {options.map((opt, i) => (
//             <option key={i} value={opt} />
//           ))}
//         </datalist>
//       )}
//     </div>
//   );
// }

// function PackagingSpecForm() {
//   const navigate = useNavigate();

//   const [category, setCategory] = useState('');
//   const [specValues, setSpecValues] = useState({});
//   const [assignedVendorId, setAssignedVendorId] = useState('');
//   const [materialCode, setMaterialCode] = useState('');
//   const [poNumber, setPoNumber] = useState('');
//   const [procurementUsers, setProcurementUsers] = useState([]);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     getProcurementList()
//       .then((res) => setProcurementUsers(res.data))
//       .catch(() => setProcurementUsers([]));
//   }, []);

//   const handleCategoryChange = (e) => {
//     setCategory(e.target.value);
//     // Keep the 4 common field values (PRODUCT/BUYER NAME/PROGRAM/COUNTRY)
//     // when switching category — only category-specific answers reset.
//     setSpecValues((prev) => {
//       const kept = {};
//       COMMON_FIELD_LABELS.forEach((label) => {
//         if (prev[label]) kept[label] = prev[label];
//       });
//       return kept;
//     });
//   };

//   const handleFieldChange = (label, value) => {
//     setSpecValues((prev) => ({ ...prev, [label]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!category) {
//       toast.error('Please select a product category first.');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const payload = {
//         category,
//         spec_data: specValues,
//         assigned_vendor_id: assignedVendorId || null,
//         material_code: materialCode || null,
//         po_number: poNumber || null,
//       };
//       const res = await createArtworkWithSpec(payload);
//       toast.success(`Artwork request ${res.data.artwork_id} created.`);
//       navigate(`/artwork/${res.data.artwork_id}`);
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Failed to create artwork request.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Common fields (from whichever category's config — they're identical
//   // everywhere, so PVC_BAG's copy is used as the reference definition).
//   const commonFields = (specConfig.PVC_BAG?.fields || []).filter((f) =>
//     COMMON_FIELD_LABELS.includes(f.label)
//   );

//   // Category-specific fields = everything EXCEPT the 4 common ones above,
//   // so nothing is ever duplicated on screen.
//   const categoryFields = category
//     ? (specConfig[category]?.fields || []).filter((f) => !COMMON_FIELD_LABELS.includes(f.label))
//     : [];

//   const grouped = [];
//   let currentGroup = { section: null, fields: [] };
//   categoryFields.forEach((f) => {
//     if (f.section !== currentGroup.section) {
//       if (currentGroup.fields.length > 0) grouped.push(currentGroup);
//       currentGroup = { section: f.section, fields: [] };
//     }
//     currentGroup.fields.push(f);
//   });
//   if (currentGroup.fields.length > 0) grouped.push(currentGroup);

//   return (
//     <div className="p-6 w-full h-full overflow-y-auto thin-scrollbar">
//       <button onClick={() => navigate('/artwork')} className="text-sm text-gray-500 mb-3 hover:underline">
//         ← Back to list
//       </button>

//       <h1 className="text-xl font-semibold text-gray-800 mb-1">New Packaging Specification Request</h1>
//       <p className="text-sm text-gray-500 mb-4">
//         Fill in the basic details first, then choose a category to see its specific fields.
//       </p>

//       {/* Step 1 — the 4 fields common to every category, always shown first */}
//       <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
//         <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
//           {commonFields.map((f, fi) => (
//             <SpecField
//               key={fi}
//               field={f}
//               value={specValues[f.label]}
//               onChange={handleFieldChange}
//             />
//           ))}
//         </div>
//       </div>

//       {/* Step 2 — category picker, shown AFTER the common fields */}
//       <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
//         <label className="block text-sm font-medium text-gray-700 mb-1">Product Category *</label>
//         <select
//           value={category}
//           onChange={handleCategoryChange}
//           className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
//         >
//           <option value="">-- Select category --</option>
//           {Object.keys(CATEGORY_LABELS).map((key) => (
//             <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>
//           ))}
//         </select>
//       </div>

//       {/* Step 3 — category-specific fields, shown once a category is picked */}
//       {category && (
//         <form onSubmit={handleSubmit}>
//           {grouped.map((group, gi) => (
//             <div key={gi} className="mb-5 border border-gray-300 rounded overflow-hidden">
//               {group.section && (
//                 <div className="bg-[#003366] text-white px-3 py-1.5 font-semibold text-xs uppercase tracking-wide">
//                   {group.section}
//                 </div>
//               )}
//               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5 p-5">
//                 {group.fields.map((f, fi) => (
//                   <SpecField
//                     key={fi}
//                     field={f}
//                     value={specValues[f.label]}
//                     onChange={handleFieldChange}
//                   />
//                 ))}
//               </div>
//             </div>
//           ))}

//           <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Material Code</label>
//                 <input
//                   type="text"
//                   value={materialCode}
//                   onChange={(e) => setMaterialCode(e.target.value)}
//                   placeholder="Required before release"
//                   className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
//                 <input
//                   type="text"
//                   value={poNumber}
//                   onChange={(e) => setPoNumber(e.target.value)}
//                   className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
//                 />
//               </div>
//             </div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Assign Procurement (optional)</label>
//             <select
//               value={assignedVendorId}
//               onChange={(e) => setAssignedVendorId(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
//             >
//               <option value="">-- No procurement contact (assign later) --</option>
//               {procurementUsers.map((v) => (
//                 <option key={v.id} value={v.id}>{v.username}</option>
//               ))}
//             </select>
//           </div>

//           <div className="flex gap-3">
//             <button
//               type="submit"
//               disabled={submitting}
//               className="bg-[#003366] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#002a52] disabled:opacity-50"
//             >
//               {submitting ? 'Creating...' : 'Create Artwork Request'}
//             </button>
//             <button
//               type="button"
//               onClick={() => navigate('/artwork')}
//               className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// }

// export default PackagingSpecForm;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createArtworkWithSpec, getProcurementList } from '../../api/artworkApi';
import specConfig from './packagingSpecConfig.json';

// Human-readable labels for the category dropdown
const CATEGORY_LABELS = {
  PVC_BAG: 'PVC Bag Specification',
  RIBBON: 'Ribbon',
  BW_STICKER: 'B&W Sticker',
  LABEL: 'Label',
  PAPER_PRINTED_ITEM: 'Paper Printed Item',
  BOX: 'Box',
  OTHER: 'Other',
  PDQ: 'PDQ',
};

// These 4 fields are identical across every category in the excel sheet,
// so they are shown once at the top, before the category picker.
const COMMON_FIELD_LABELS = ['PRODUCT', 'BUYER NAME', 'PROGRAM', 'COUNTRY'];

const OTHER_SENTINEL = '__OTHER__';

// Splits raw excel option strings into a clean, deduplicated list —
// and drops any raw "OTHER PLEASE SPECIFY" style entries, since a
// single explicit "Other" choice is always added at the end instead.
function flattenOptions(rawOptions) {
  const choices = [];
  rawOptions.forEach((raw) => {
    raw
      .split(/[/,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !/^other\b/i.test(s))
      .forEach((s) => choices.push(s));
  });
  return [...new Set(choices)];
}

// A proper filter/select box. Fields with predefined excel options get
// a real <select> dropdown (with an "Other — specify" choice at the
// end); fields without options stay a plain text input.
function SpecField({ field, value, onChange }) {
  const options = flattenOptions(field.options || []);
  const hasOptions = options.length > 0;
  const [customMode, setCustomMode] = useState(false);

  if (!hasOptions) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 truncate" title={field.label}>
          {field.label}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(field.label, e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          className="w-full px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        />
      </div>
    );
  }

  const handleSelectChange = (e) => {
    const v = e.target.value;
    if (v === OTHER_SENTINEL) {
      setCustomMode(true);
      onChange(field.label, '');
    } else {
      setCustomMode(false);
      onChange(field.label, v);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 truncate" title={field.label}>
        {field.label}
      </label>
      {!customMode ? (
        <select
          value={options.includes(value) ? value : ''}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        >
          <option value="">-- Select --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          <option value={OTHER_SENTINEL}>Other (please specify)</option>
        </select>
      ) : (
        <div>
          <input
            type="text"
            autoFocus
            value={value || ''}
            onChange={(e) => onChange(field.label, e.target.value)}
            placeholder="Type your own value..."
            className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-amber-300 rounded-md outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="button"
            onClick={() => { setCustomMode(false); onChange(field.label, ''); }}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            ← Back to list
          </button>
        </div>
      )}
    </div>
  );
}

function PackagingSpecForm() {
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [specValues, setSpecValues] = useState({});
  const [assignedVendorId, setAssignedVendorId] = useState('');
  const [procurementUsers, setProcurementUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProcurementList()
      .then((res) => setProcurementUsers(res.data))
      .catch(() => setProcurementUsers([]));
  }, []);

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    // Keep the 4 common field values when switching category — only
    // category-specific answers reset.
    setSpecValues((prev) => {
      const kept = {};
      COMMON_FIELD_LABELS.forEach((label) => {
        if (prev[label]) kept[label] = prev[label];
      });
      return kept;
    });
  };

  const handleFieldChange = (label, value) => {
    setSpecValues((prev) => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      toast.error('Please select a product category first.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        category,
        spec_data: specValues,
        assigned_vendor_id: assignedVendorId || null,
      };
      const res = await createArtworkWithSpec(payload);
      toast.success(`Artwork request ${res.data.artwork_id} created.`);
      navigate(`/artwork/${res.data.artwork_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create artwork request.');
    } finally {
      setSubmitting(false);
    }
  };

  const commonFields = (specConfig.PVC_BAG?.fields || []).filter((f) =>
    COMMON_FIELD_LABELS.includes(f.label)
  );

  const categoryFields = category
    ? (specConfig[category]?.fields || []).filter((f) => !COMMON_FIELD_LABELS.includes(f.label))
    : [];

  const grouped = [];
  let currentGroup = { section: null, fields: [] };
  categoryFields.forEach((f) => {
    if (f.section !== currentGroup.section) {
      if (currentGroup.fields.length > 0) grouped.push(currentGroup);
      currentGroup = { section: f.section, fields: [] };
    }
    currentGroup.fields.push(f);
  });
  if (currentGroup.fields.length > 0) grouped.push(currentGroup);

  return (
    <div className="p-6 w-full h-full overflow-y-auto thin-scrollbar">
      <button onClick={() => navigate('/artwork')} className="text-sm text-gray-500 mb-3 hover:underline">
        ← Back to list
      </button>

      <h1 className="text-xl font-semibold text-gray-800 mb-1">New Packaging Specification Request</h1>
      <p className="text-sm text-gray-500 mb-4">
        Fill in the basic details first, then choose a category to see its specific fields.
      </p>

      {/* Step 1 — the 4 fields common to every category */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
          {commonFields.map((f, fi) => (
            <SpecField
              key={fi}
              field={f}
              value={specValues[f.label]}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </div>

      {/* Step 2 — category picker */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Category *</label>
        <select
          value={category}
          onChange={handleCategoryChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">-- Select category --</option>
          {Object.keys(CATEGORY_LABELS).map((key) => (
            <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>
          ))}
        </select>
      </div>

      {/* Step 3 — category-specific fields */}
      {category && (
        <form onSubmit={handleSubmit}>
          {grouped.map((group, gi) => (
            <div key={gi} className="mb-5 border border-gray-300 rounded overflow-hidden">
              {group.section && (
                <div className="bg-[#003366] text-white px-3 py-1.5 font-semibold text-xs uppercase tracking-wide">
                  {group.section}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5 p-5">
                {group.fields.map((f, fi) => (
                  <SpecField
                    key={fi}
                    field={f}
                    value={specValues[f.label]}
                    onChange={handleFieldChange}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Material Code / PO Number intentionally removed for now —
              can be added back to this section (and to the payload
              above) later once the business wants them at creation time. */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Procurement (optional)</label>
            <select
              value={assignedVendorId}
              onChange={(e) => setAssignedVendorId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">-- No procurement contact (assign later) --</option>
              {procurementUsers.map((v) => (
                <option key={v.id} value={v.id}>{v.username}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#003366] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#002a52] disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Artwork Request'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/artwork')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default PackagingSpecForm;