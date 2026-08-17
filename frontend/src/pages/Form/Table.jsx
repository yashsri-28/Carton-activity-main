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
  onUpdateCell,
  readOnly = false
}) {

  // Validation function
  const validateInput = (value, key) => {
    if (value === '' || value === undefined || value === null) return true;

    // Program Specifications validations
    if (title === "Program Specifications") {
      switch (key) {
        case 'program':
        case 'style':
        case 'fold':
          // Allow only characters, spaces, and hyphens
          return /^[a-zA-Z\s\-]*$/.test(value);

        case 'w_in':
        case 'w_cm':
        case 'l_in':
        case 'l_cm':
        case 'wt_unit':
        case 'gsm':
          // Allow integers and floating numbers
          return /^[0-9]*\.?[0-9]*$/.test(value);

        case 'unit_carton':
        case 'inner_pack':
          // Allow alphanumeric characters with spaces and common symbols
          return /^[a-zA-Z0-9\s\-\/]*$/.test(value);

        default:
          return true;
      }
    }

    // Sample Specifications validations
    if (title === "Sample Specifications") {
      switch (key) {
        case 'col1': // Sample
        case 'col3': // Program
        case 'col4': // Quality
        case 'col7': // Shade
          // Allow only characters, spaces, and hyphens
          return /^[a-zA-Z\s\-]*$/.test(value);

        case 'col2': // Size
        case 'col5': // LBS/DZ
        case 'col6': // GSM
        case 'col8': // W-in
        case 'col10': // L-in
        case 'col9': // W-cm
        case 'col11': // L-cm
          // Allow integers and floating numbers
          return /^[0-9]*\.?[0-9]*$/.test(value);

        default:
          return true;
      }
    }

    // Default validation for other tables
    return true;
  };

  const getValidationMessage = (key) => {
    if (title === "Program Specifications") {
      switch (key) {
        case 'program':
        case 'style':
        case 'fold':
          return 'Only letters and spaces allowed';

        case 'w_in':
        case 'w_cm':
        case 'l_in':
        case 'l_cm':
        case 'wt_unit':
        case 'gsm':
          return 'Only numbers and decimals allowed';

        case 'unit_carton':
        case 'inner_pack':
          return 'Only letters, numbers, and spaces allowed';

        default:
          return '';
      }
    }

    if (title === "Sample Specifications") {
      switch (key) {
        case 'col1':
        case 'col3':
        case 'col4':
        case 'col7':
          return 'Only letters and spaces allowed';

        case 'col2':
        case 'col5':
        case 'col6':
        case 'col8':
        case 'col9':
        case 'col10':
        case 'col11':
          return 'Only numbers and decimals allowed';

        default:
          return '';
      }
    }

    return '';
  };

  const handleCellChange = (e, groupIdx, variantIdx, key) => {
    const newValue = e.target.value;

    // Apply validation before updating
    if (validateInput(newValue, key)) {
      onUpdateCell?.(groupIdx, variantIdx, key, newValue);
    }
  };

  const renderHeaderCell = (header, index) => (
    <th key={index} className="p-3 text-left font-medium border-r border-[#2a4d75] last:border-r-0 whitespace-nowrap align-middle">
      <div className="flex items-center gap-2">
        {header.label}
        {header.hasAddBtn && !readOnly && (
          <button
            onClick={() => onAddRow?.(type === 'flat' ? data.length : 0)}
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

  const renderCell = (value, onChange, placeholder = '', key, showValidation = false) => {
    const isValid = validateInput(value, key);
    const validationMessage = getValidationMessage(key);

    return (
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={readOnly}
          className={`w-full px-2 py-1 text-xs border rounded 
            ${readOnly
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
              : isValid
                ? 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0f3460]'
                : 'border-red-300 bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500'
            }`}
        />
        {showValidation && !isValid && value && !readOnly && (
          <div className="absolute left-0 top-full mt-1 text-[10px] text-red-500 bg-white p-1 rounded shadow border border-red-200 z-10 whitespace-nowrap">
            {validationMessage}
          </div>
        )}
      </div>
    );
  };

  const isEmptyVariant = (variant) => {
    return !variant.style &&
      (!variant.w_in || variant.w_in === '0') &&
      (!variant.w_cm || variant.w_cm === '0') &&
      (!variant.l_in || variant.l_in === '0') &&
      (!variant.l_cm || variant.l_cm === '0') &&
      (!variant.wt_unit || variant.wt_unit === '0') &&
      (!variant.gsm || variant.gsm === '0');
  };

  const isEmptyRow = (row) => {
    return !row.col1 &&
      !row.col2 &&
      !row.col3 &&
      !row.col4 &&
      (!row.col5 || row.col5 === '0') &&
      (!row.col6 || row.col6 === '0') &&
      !row.col7 &&
      (!row.col8 || row.col8 === '0') &&
      (!row.col9 || row.col9 === '0');
  };

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

                          if (key === 'actions') {
                            if (vIdx === 0) {
                              return (
                                <td key={hIdx} rowSpan={rowSpan} className="p-2 align-middle border-l border-gray-100 bg-white">
                                  {!readOnly && (
                                    <div className="flex flex-col gap-3 items-center justify-center">
                                      <button
                                        onClick={() => onAddTable?.(groupIdx)}
                                        title="Add new group below"
                                        className='cursor-pointer hover:scale-110 transition-transform'
                                      >
                                        <svg className="w-6 h-6 text-[#0f3460]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => onCopyTable?.(groupIdx)}
                                        title="Copy group"
                                        className='cursor-pointer hover:scale-110 transition-transform'
                                      >
                                        <svg className="w-5 h-5 text-gray-600 hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => onDeleteTable?.(groupIdx)}
                                        title="Delete group"
                                        className='cursor-pointer hover:scale-110 transition-transform'
                                      >
                                        <svg className="w-5 h-5 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => onAddRow?.(groupIdx)}
                                        title="Add new style to group"
                                        className='cursor-pointer hover:scale-110 transition-transform'
                                      >
                                        <svg className="w-5 h-5 text-[#0f3460]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              );
                            }
                            return null;
                          }

                          if (key === 'style') {
                            return (
                              <td key={hIdx} className="p-3 border-r border-gray-100 align-middle">
                                <div className="flex items-center justify-between gap-2">
                                  {renderCell(
                                    variant.style,
                                    (e) => handleCellChange(e, groupIdx, vIdx, 'style'),
                                    "Style name",
                                    'style',
                                    true
                                  )}

                                  {!readOnly && (
                                    <button
                                      onClick={() => onDeleteRow?.(groupIdx, vIdx)}
                                      className="text-red-500 hover:text-red-700 hover:scale-110 cursor-pointer transition-transform"
                                      title="Delete this row"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="1.5"
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          if (group.hasOwnProperty(key) && vIdx === 0) {
                            return (
                              <td key={hIdx} rowSpan={rowSpan} className="p-3 border-r border-gray-200 align-middle text-center font-medium bg-gray-50">
                                {renderCell(
                                  group[key],
                                  (e) => handleCellChange(e, groupIdx, null, key),
                                  key.replace(/_/g, ' '),
                                  key,
                                  true
                                )}
                              </td>
                            );
                          }
                          if (group.hasOwnProperty(key)) return null;
                          if (variant.hasOwnProperty(key)) {
                            const unit =
                              key === 'w_in' || key === 'l_in'
                                ? 'inches'
                                : key === 'w_cm' || key === 'l_cm'
                                  ? 'centimeter'
                                  : '';

                            return (
                              <td key={hIdx} className="p-3 border-r border-gray-100 align-middle text-center">
                                {renderCell(
                                  variant[key],
                                  (e) => handleCellChange(e, groupIdx, vIdx, key),
                                  unit,
                                  key,
                                  true
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
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {headers.map((header, hIdx) => {
                      const key = header.key;

                      if (key === 'actions') {
                        return (
                          <td key={hIdx} className="p-3 border-r border-gray-100 text-center w-16">
                            {!readOnly && (
                              <button
                                onClick={() => onDeleteRow?.(idx)}
                                className="text-red-500 hover:text-red-700 hover:scale-110 cursor-pointer transition-transform"
                                title="Delete row"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </td>
                        );
                      }

                      return (
                        <td key={hIdx} className="p-3 border-r border-gray-100 align-middle text-center">
                          {renderCell(
                            row[key],
                            (e) => handleCellChange(e, idx, null, key),
                            header.label.toLowerCase(),
                            key,
                            true
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