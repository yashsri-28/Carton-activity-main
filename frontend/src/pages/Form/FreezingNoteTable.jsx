import React from 'react';
import { Trash2 } from 'lucide-react';
import { FREEZING_NOTE_FIELDS, FREEZING_NOTE_GROUPS } from './freezingNoteFields';

// Splits the 14 field-groups into 3 sections, matching the client's
// reference "Program Specifications Master Sheet" layout.
const SECTIONS = [
  {
    label: 'Carton working',
    subtitle: '',
    tableOf: 'Table 1 of 3',
    groupKeys: ['general', 'packing', 'carton_dim', 'carton_weight', 'carton_ply'],
    showRowNumber: true,
  },
  {
    label: 'Stiffener, Side Stiffener & Separator Details',
    subtitle: '',
    tableOf: 'Table 2 of 3',
    groupKeys: ['stiffener', 'side_stiffener', 'separator'],
    showRowNumber: true,
  },
  {
    label: 'Bag details',
    subtitle: "",
    tableOf: 'Table 3 of 3',
    groupKeys: ['bag_box', 'ld_polybag', 'printing', 'other', 'macys', 'additional'],
    showRowNumber: true,
  },
];

function computeCbm(row) {
  const l = parseFloat(row.carton_length_cm);
  const w = parseFloat(row.carton_width_cm);
  const h = parseFloat(row.carton_height_cm);
  if (l && w && h) return ((l * w * h) / 1000000).toFixed(4);
  return '-';
}

function computeMaxDim(row) {
  const l = parseFloat(row.carton_length_cm);
  const w = parseFloat(row.carton_width_cm);
  const h = parseFloat(row.carton_height_cm);
  if (l && w && h) return (l + w + h).toFixed(1);
  return '-';
}

function SectionTable({ section, rows, onCellChange, onDeleteRow, readOnly }) {
  const fields = FREEZING_NOTE_FIELDS.filter((f) => section.groupKeys.includes(f.group));

  const groups = [];
  fields.forEach((f) => {
    const last = groups[groups.length - 1];
    if (last && last.key === f.group) {
      last.count += 1;
    } else {
      groups.push({
        key: f.group,
        label: FREEZING_NOTE_GROUPS.find((g) => g.key === f.group)?.label || f.group,
        count: 1,
      });
    }
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{section.label}</span>
          <span className="text-xs text-gray-400 ml-2">{section.subtitle}</span>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{section.tableOf}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {section.showRowNumber && (
                <th rowSpan={2} className="px-2 py-2 bg-[#0f3460] text-white text-xs w-10 border-r border-[#1a4a7a]">#</th>
              )}
              {groups.map((g, gi) => (
                <th
                  key={gi}
                  colSpan={g.count}
                  className="px-3 py-1.5 text-center bg-[#0a2545] text-white text-[11px] uppercase tracking-wide border-l border-[#1a4a7a] whitespace-nowrap"
                >
                  {g.label}
                </th>
              ))}
              {!readOnly && <th rowSpan={2} className="bg-[#0f3460] w-10"></th>}
            </tr>
            <tr>
              {fields.map((f) => (
                <th
                  key={f.key}
                  className="px-3 py-2 text-left bg-[#0f3460] text-white text-xs whitespace-nowrap border-l border-[#1a4a7a]"
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={fields.length + (section.showRowNumber ? 1 : 0) + (!readOnly ? 1 : 0)}
                  className="px-4 py-6 text-center text-gray-400 italic"
                >
                  No rows yet.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                {section.showRowNumber && (
                  <td className="px-2 py-2 text-center font-semibold text-gray-500 bg-gray-50">{idx + 1}</td>
                )}
                {fields.map((f) => (
                  <td key={f.key} className="px-2 py-2">
                    {f.type === 'readonly' ? (
                      <span className="inline-block px-2 py-1 rounded bg-sky-50 text-sky-700 font-bold text-xs whitespace-nowrap">
                        {f.key === 'cbm' ? computeCbm(row) : computeMaxDim(row)}
                      </span>
                    ) : readOnly ? (
                      <span className="text-xs text-gray-700">{row[f.key] || '-'}</span>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        value={row[f.key] || ''}
                        onChange={(e) => onCellChange(idx, f.key, e.target.value)}
                        rows={2}
                        className={`border px-2 py-1 rounded ${f.width} text-xs focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        value={row[f.key] || ''}
                        onChange={(e) => onCellChange(idx, f.key, e.target.value)}
                        className={`border px-2 py-1 rounded ${f.width} text-xs focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(idx)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Freezing Note — Carton and Packing Details.
 * Renders as 3 sectioned tables (matching the client's reference "Program
 * Specifications Master Sheet" layout) sharing the same row data.
 *
 * Pass `readOnly` for TQM/PPC view mode — inputs become plain text and the
 * Add/Delete controls are hidden.
 */
function FreezingNoteTable({ rows, onAddRow, onCellChange, onDeleteRow, readOnly = false }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Freezing Note — Carton and Packing Details</h2>
        {!readOnly && (
          <button
            type="button"
            onClick={onAddRow}
            className="px-4 py-1.5 bg-[#0f3460] text-white text-sm rounded-md hover:bg-[#0a2545] cursor-pointer"
          >
            + Add Row
          </button>
        )}
      </div>

      {SECTIONS.map((section) => (
        <SectionTable
          key={section.label}
          section={section}
          rows={rows}
          onCellChange={onCellChange}
          onDeleteRow={onDeleteRow}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

export default FreezingNoteTable;