import React from 'react';

function Table({
  title,
  headers,
  data,
  type = 'flat',
  onAddRow,
  onAddTable,
  onCopyTable,
  onDeleteTable,
  onDeleteRow,
  onUpdateCell,           // ← NEW: callback to update cell value
}) {

  const renderHeaderCell = (header, index) => (
    <th key={index} className="p-3 text-left font-medium border-r border-[#2a4d75] last:border-r-0 whitespace-nowrap align-middle">
      <div className="flex items-center gap-2">
        {header.label}
        {header.hasAddBtn && (
          <button
            onClick={() => onAddRow?.(0)}
            className="flex items-center gap-1 bg-[#2f4f72] hover:bg-[#436488] text-white text-[10px] px-2 py-0.5 rounded-full ml-auto cursor-pointer"
          >
            Add
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </th>
  );

  // Helper to render editable cell
  const renderCell = (value, onChange, placeholder = '', disabled = false) => (
    <input
      type="text"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0f3460]"
    />
  );

  return (
    <div className="w-full">
      {title && <h3 className="text-gray-800 font-bold mb-3">{title}</h3>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-700 border-collapse">
            <thead>
              <tr className="bg-[#0f3460] text-white tracking-wider h-12">
                {headers.map(renderHeaderCell)}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {type === 'grouped' ? (
                data.map((group, groupIdx) => (
                  <React.Fragment key={groupIdx}>
                    {group.variants.map((variant, vIdx) => (
                      <tr key={vIdx} className="hover:bg-gray-50">
                        {headers.map((header, hIdx) => {
                          const rowSpan = group.variants.length;
                          const key = header.key;

                          // Actions column (stacked buttons)
                          if (key === 'actions') {
                            if (vIdx === 0) {
                              return (
                                <td key={hIdx} rowSpan={rowSpan} className="p-2 align-middle border-l border-gray-100 bg-white">
                                  <div className="flex flex-col gap-3 items-center justify-center">
                                    <button onClick={() => onAddTable?.(groupIdx)} title="Add new group below" className='cursor-pointer'>
                                      <svg className="w-6 h-6 text-[#0f3460] hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                    <button onClick={() => onCopyTable?.(groupIdx)} title="Copy group" className='cursor-pointer'>
                                      <svg className="w-5 h-5 text-gray-600 hover:text-black hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                    <button onClick={() => onDeleteTable?.(groupIdx)} title="Delete group" className='cursor-pointer'>
                                      <svg className="w-5 h-5 text-red-500 hover:text-red-700 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              );
                            }
                            return null;
                          }

                          // Style column with per-row delete
                          if (key === 'style') {
                            return (
                              <td key={hIdx} className="p-3 border-r border-gray-100 align-middle">
                                <div className="flex items-center justify-between gap-2">
                                  {renderCell(
                                    variant.style,
                                    (e) => onUpdateCell?.(groupIdx, vIdx, 'style', e.target.value),
                                    "Style name"
                                  )}
                                  <button
                                    onClick={() => onDeleteRow?.(groupIdx, vIdx)}
                                    className="text-red-500 hover:text-red-700 hover:scale-110 cursor-pointer"
                                    title="Delete this row"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            );
                          }

                          // Merged group-level fields (show input only in first row)
                          if (group.hasOwnProperty(key) && vIdx === 0) {
                            return (
                              <td key={hIdx} rowSpan={rowSpan} className="p-3 border-r border-gray-200 align-middle text-center font-medium bg-gray-50">
                                {renderCell(
                                  group[key],
                                  (e) => onUpdateCell?.(groupIdx, null, key, e.target.value),
                                  key.replace(/_/g, ' '),
                                  false
                                )}
                              </td>
                            );
                          }
                          if (group.hasOwnProperty(key)) return null; // other rows in rowspan

                          // Variant-level fields
                          if (variant.hasOwnProperty(key)) {
                            return (
                              <td key={hIdx} className="p-3 border-r border-gray-100 align-middle text-center">
                                {renderCell(
                                  variant[key],
                                  (e) => onUpdateCell?.(groupIdx, vIdx, key, e.target.value),
                                  key === 'w_in' || key === 'l_in' ? "inches" : "",
                                  false
                                )}
                              </td>
                            );
                          }

                          return (
                            <td key={hIdx} className="p-3 border-r border-gray-100 text-center">
                              —
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                // Flat table (samples)
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {headers.map((header, hIdx) => {
                      const key = header.key;

                      if (key === 'actions') {
                        return (
                          <td key={hIdx} className="p-3 border-r border-gray-100 text-center w-16">
                            <button
                              onClick={() => onDeleteRow?.(idx)}
                              className="text-red-500 hover:text-red-700 hover:scale-110 cursor-pointer"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        );
                      }

                      return (
                        <td key={hIdx} className="p-3 border-r border-gray-100 align-middle text-center">
                          {renderCell(
                            row[key],
                            (e) => onUpdateCell?.(idx, null, key, e.target.value),
                            header.label.toLowerCase()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Table;
