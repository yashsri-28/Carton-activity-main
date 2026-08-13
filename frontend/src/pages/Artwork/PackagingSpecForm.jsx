import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createArtworkWithSpec, getVendorList } from '../../api/artworkApi';
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

// Splits raw excel option strings (e.g. "COTTON / POLYESTER/RECYCLE POLYESTER")
// into a clean, deduplicated list of individual choices for the dropdown/suggestions.
function flattenOptions(rawOptions) {
  const choices = [];
  rawOptions.forEach((raw) => {
    raw
      .split(/[/,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .forEach((s) => choices.push(s));
  });
  return [...new Set(choices)];
}

function SpecField({ field, value, onChange }) {
  const options = flattenOptions(field.options || []);
  const hasOptions = options.length > 0;
  const datalistId = `dl-${field.label.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [showCustomHint, setShowCustomHint] = useState(false);

  // Build a helpful placeholder for every field, whether it has
  // predefined options or not — so the user always knows what to type.
  const placeholder = showCustomHint
    ? 'Type your own value here...'
    : hasOptions
      ? `e.g. ${options.slice(0, 3).join(', ')}${options.length > 3 ? '...' : ''}`
      : `Enter ${field.label.toLowerCase()}`;

  // If the user picks the "OTHER / PLEASE SPECIFY" style option from the
  // list, that text is just an instruction, not a real answer — clear the
  // field automatically and let them type their own value instead.
  const handleChange = (e) => {
    const raw = e.target.value;
    if (/^other\b.*(specify|if any)/i.test(raw.trim())) {
      onChange(field.label, '');
      setShowCustomHint(true);
      return;
    }
    setShowCustomHint(false);
    onChange(field.label, raw);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
      <label className="text-sm font-medium text-gray-700 md:col-span-1 pt-2">
        {field.label}
      </label>
      <div className="md:col-span-2">
        <input
          type="text"
          list={hasOptions ? datalistId : undefined}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={showCustomHint}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        {showCustomHint && (
          <p className="text-xs text-amber-600 mt-1">
            "Other" selected — please type your specific value above.
          </p>
        )}
        {hasOptions && (
          <datalist id={datalistId}>
            {options.map((opt, i) => (
              <option key={i} value={opt} />
            ))}
          </datalist>
        )}
      </div>
    </div>
  );
}

function PackagingSpecForm() {
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [specValues, setSpecValues] = useState({});
  const [assignedVendorId, setAssignedVendorId] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [vendors, setVendors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getVendorList()
      .then((res) => setVendors(res.data))
      .catch(() => setVendors([]));
  }, []);

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSpecValues({}); // reset filled values when switching category
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
        material_code: materialCode || null,
        po_number: poNumber || null,
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

  const fields = category ? specConfig[category]?.fields || [] : [];

  // Group fields by section (e.g. "WOVEN", "PRINTED") for LABEL/OTHER/PVC_BAG etc.
  // Fields with section === null are rendered before any section starts.
  const grouped = [];
  let currentGroup = { section: null, fields: [] };
  fields.forEach((f) => {
    if (f.section !== currentGroup.section) {
      if (currentGroup.fields.length > 0) grouped.push(currentGroup);
      currentGroup = { section: f.section, fields: [] };
    }
    currentGroup.fields.push(f);
  });
  if (currentGroup.fields.length > 0) grouped.push(currentGroup);

  return (
    <div className="p-6 max-w-3xl h-full overflow-y-auto thin-scrollbar">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">New Packaging Specification Request</h1>
      <p className="text-sm text-gray-500 mb-4">
        Fields shown below match the TRIMS Specification sheet exactly, based on the category chosen.
        Fields with a list icon support quick-select — start typing to see suggestions, or type your own value.
      </p>

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

      {category && (
        <form onSubmit={handleSubmit}>
          {grouped.map((group, gi) => (
            <div key={gi} className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
              {group.section && (
                <h2 className="font-semibold text-[#003366] mb-4 uppercase text-sm tracking-wide">
                  {group.section}
                </h2>
              )}
              <div className="space-y-4">
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

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Code</label>
                <input
                  type="text"
                  value={materialCode}
                  onChange={(e) => setMaterialCode(e.target.value)}
                  placeholder="Required before release"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Vendor (optional)</label>
            <select
              value={assignedVendorId}
              onChange={(e) => setAssignedVendorId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">-- No vendor (assign later) --</option>
              {vendors.map((v) => (
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
