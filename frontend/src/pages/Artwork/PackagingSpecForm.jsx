import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';
// import { createArtworkWithSpec, addArtworkComment, getProcurementList } from '../../api/artworkApi';
import { createArtworkWithSpec, addArtworkComment, getProcurementList, getLegalList, getComplianceList } from '../../api/artworkApi';
import Attachment from '../Form/Attachment';
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

// These 4 fields are identical across every category in the excel sheet.
const COMMON_FIELD_LABELS = ['PRODUCT', 'BUYER NAME', 'PROGRAM', 'COUNTRY'];

// COUNTRY has no predefined options in the excel sheet (it was a free
// text field there) — but a country should only ever be a real
// country, so we give it a proper fixed dropdown instead of free
// text, so the user can never type a typo — only select from the list.
const COUNTRY_LIST = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium',
  'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland',
  'Austria', 'Ireland', 'Portugal', 'Greece', 'Czech Republic',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
  'Oman', 'Israel', 'Turkey', 'South Africa', 'Egypt', 'Nigeria',
  'Kenya', 'Morocco', 'China', 'Japan', 'South Korea', 'Singapore',
  'Malaysia', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines',
  'Bangladesh', 'Sri Lanka', 'Pakistan', 'Nepal', 'Hong Kong', 'Taiwan',
  'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru',
  'New Zealand', 'Russia', 'Ukraine', 'Other',
];

const OTHER_SENTINEL = '__OTHER__';

// Excel/Word paste carries its colors/borders as CSS CLASSES inside a
// <style> block, not inline styles — so we "bake" those class rules
// directly into each cell's inline style before sanitizing, otherwise
// the formatting is lost when the <style> tag gets stripped.
function normalizeExcelPaste(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const classRules = {};
    doc.querySelectorAll('style').forEach((styleTag) => {
      const cssText = styleTag.textContent || '';
      const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
      let match;
      while ((match = ruleRegex.exec(cssText)) !== null) {
        const selectors = match[1].split(',').map((s) => s.trim());
        const declarations = match[2].trim();
        selectors.forEach((sel) => {
          if (sel.startsWith('.')) {
            const className = sel.slice(1);
            classRules[className] = (classRules[className] || '') + declarations + ';';
          }
        });
      }
    });

    doc.querySelectorAll('[class]').forEach((el) => {
      const classes = el.getAttribute('class').split(/\s+/);
      let extraStyle = '';
      classes.forEach((c) => {
        if (classRules[c]) extraStyle += classRules[c];
      });
      if (extraStyle) {
        el.setAttribute('style', (el.getAttribute('style') || '') + ';' + extraStyle);
      }
      el.removeAttribute('class');
    });

    doc.querySelectorAll('style, head, meta, link, xml').forEach((el) => el.remove());

    return doc.body.innerHTML;
  } catch (err) {
    return html;
  }
}

// Turns the raw excel option data into a clean list of choices.
//
// Two excel patterns exist:
//  1. Multiple SEPARATE cells, one option per cell (e.g. PVC quality:
//     "NON LHM" | "LHM" | "PHTHALTE FREE" | "EVA") — each is already
//     one distinct choice. These must NOT be split further, because
//     some option text legitimately contains a "/" as part of the
//     name itself (e.g. "WOVEN TAFFETA/DAMASK" is one quality name,
//     not two choices).
//  2. ONE cell containing multiple choices packed together, separated
//     by "/", "," or a numbered marker like "1) WOVEN  2)PRINTED" —
//     this single string genuinely needs splitting.
function flattenOptions(rawOptions) {
  if (rawOptions.length > 1) {
    return [...new Set(
      rawOptions
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !/^other\b/i.test(s))
    )];
  }
  const choices = [];
  rawOptions.forEach((raw) => {
    raw
      .split(/[/,]|(?=\d+\))/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !/^other\b/i.test(s))
      .forEach((s) => choices.push(s));
  });
  return [...new Set(choices)];
}

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
  const [legalUsers, setLegalUsers] = useState([]);
  const [complianceUsers, setComplianceUsers] = useState([]);
  const [assignedLegalId, setAssignedLegalId] = useState('');
  const [assignedComplianceId, setAssignedComplianceId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [remarkAttachment, setRemarkAttachment] = useState(null);
  const remarkInputRef = useRef(null);

  // useEffect(() => {
  //   getProcurementList()
  //     .then((res) => setProcurementUsers(res.data))
  //     .catch(() => setProcurementUsers([]));
  // }, []);


    useEffect(() => {
    getProcurementList().then((res) => setProcurementUsers(res.data)).catch(() => setProcurementUsers([]));
    getLegalList().then((res) => setLegalUsers(res.data)).catch(() => setLegalUsers([]));
    getComplianceList().then((res) => setComplianceUsers(res.data)).catch(() => setComplianceUsers([]));
  }, []);

  const handleRemarkPaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      const normalized = normalizeExcelPaste(html);
      const clean = DOMPurify.sanitize(normalized, { ADD_ATTR: ['style'] });
      document.execCommand('insertHTML', false, clean);
    } else {
      document.execCommand('insertText', false, text);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
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
      // const payload = {
      //   category,
      //   spec_data: specValues,
      //   assigned_vendor_id: assignedVendorId || null,
      // };

      const payload = {
        category,
        spec_data: specValues,
        assigned_vendor_id: assignedVendorId || null,
        assigned_legal_id: assignedLegalId || null,
        assigned_compliance_id: assignedComplianceId || null,
      };
      const res = await createArtworkWithSpec(payload);

      // If the user left a remark or attached a reference file, post it
      // as the artwork's first comment right after creation, tagged so
      // it always shows inside the Packaging Specification box (not
      // the general Comments feed).
      const remarkEl = remarkInputRef.current;
      const remarkText = remarkEl ? remarkEl.innerText.trim() : '';
      if (remarkText || remarkAttachment) {
        const cleanHtml = remarkEl ? DOMPurify.sanitize(remarkEl.innerHTML, { ADD_ATTR: ['style'] }) : '';
        try {
          await addArtworkComment(res.data.artwork_id, cleanHtml, remarkAttachment, true);
        } catch (commentErr) {
          toast.error('Artwork created, but the remark/attachment failed to save.');
        }
      }

      toast.success(`Artwork request ${res.data.artwork_id} created.`);
      navigate(`/artwork/${res.data.artwork_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create artwork request.');
    } finally {
      setSubmitting(false);
    }
  };

  // const commonFields = (specConfig.PVC_BAG?.fields || []).filter((f) =>
  //   COMMON_FIELD_LABELS.includes(f.label)
  // );

  const commonFields = (specConfig.PVC_BAG?.fields || [])
  .filter((f) => COMMON_FIELD_LABELS.includes(f.label))
  .map((f) => (f.label === 'COUNTRY' ? { ...f, options: COUNTRY_LIST } : f));

  const categoryFields = category
    ? (specConfig[category]?.fields || []).filter((f) => !COMMON_FIELD_LABELS.includes(f.label))
    : [];

  const allGrouped = [];
  let currentGroup = { section: null, fields: [] };
  categoryFields.forEach((f) => {
    if (f.section !== currentGroup.section) {
      if (currentGroup.fields.length > 0) allGrouped.push(currentGroup);
      currentGroup = { section: f.section, fields: [] };
    }
    currentGroup.fields.push(f);
  });
  if (currentGroup.fields.length > 0) allGrouped.push(currentGroup);

  // Only some categories have a genuine "TYPE" selector field whose
  // value determines which section applies (e.g. PVC_BAG's "TYPE OF
  // THE BAG" -> WELDED/STITCHING/COMFORTOR, or LABEL's "TYPE" ->
  // WOVEN/PRINTED). Other categories (e.g. OTHER: Hanger, Dori,
  // Zipper, Velcro...) have sections that are independent components
  // with NO such selector — those must always show, never be hidden.
  const typeFieldEntry = categoryFields.find((f) => /^type\b/i.test(f.label));
  const hasTypeSelectorField = Boolean(typeFieldEntry);
  const selectedType = typeFieldEntry ? specValues[typeFieldEntry.label] : null;

  const grouped = allGrouped.filter((group) => {
    if (!group.section) return true;
    if (!hasTypeSelectorField) return true;
    if (!selectedType) return false;
    const bare = group.section.replace(/ STYLE$/i, '').toUpperCase();
    const sel = selectedType.toUpperCase();
    return sel.includes(bare) || group.section.toUpperCase().includes(sel);
  });

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

          {/* Reference attachment / remark — same UI/behavior as the
              detail page's Comments section, so an Excel table pasted
              here looks identical there too. */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Attachment / Remark (optional)
            </label>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div
                ref={remarkInputRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handleRemarkPaste}
                data-placeholder="Add any reference notes here, or paste an Excel table — its rows, columns and colors will be preserved..."
                className="flex-1 min-h-[76px] max-h-40 overflow-y-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Attachment
                selectedFile={remarkAttachment}
                onFileChange={(e) => setRemarkAttachment(e.target.files[0])}
                onRemoveFile={() => setRemarkAttachment(null)}
                loading={submitting}
              />
            </div>
          </div>

          {/* Material Code / PO Number intentionally removed for now —
              can be added back later once the business wants them at
              creation time; also add-later recovery is done via
              Assign Procurement + a future Material Code UI on the
              detail page. */}
          {/* <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
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
          </div> */}


          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5 space-y-4">
          <div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Legal (optional)</label>
            <select
              value={assignedLegalId}
              onChange={(e) => setAssignedLegalId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">-- No legal contact (assign later) --</option>
              {legalUsers.map((v) => (
                <option key={v.id} value={v.id}>{v.username}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Compliance (optional)</label>
            <select
              value={assignedComplianceId}
              onChange={(e) => setAssignedComplianceId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">-- No compliance contact (assign later) --</option>
              {complianceUsers.map((v) => (
                <option key={v.id} value={v.id}>{v.username}</option>
              ))}
            </select>
          </div>
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
