import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

function Table({
    // Data props
    data = [],
    loading = false,
    error = null,
    // Column configuration
    columns = [],
    // Selection props
    enableSelection = true,
    selectedRows = [],
    onSelectRow,
    onSelectAll,
    // Action props
    actions = [],
    customActions = null,
    // Styling props
    getRowStyle,
    emptyMessage = 'No data found.',
    // Dropdown positioning
    dropdownOffset = { x: 0, y: 0 },
    // Other props
    maxHeight = '70vh',
    // Update prop
    onUpdate,
}) {
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef(null);
    const actionButtonRefs = useRef({});
    const tableContainerRef = useRef(null);
    const [dropdownDirection, setDropdownDirection] = useState("down");
    const [editing, setEditing] = useState(null); // { rowId, colKey }
    const [editValue, setEditValue] = useState('');

    console.log(columns);

    const getRowId = (row) => row.id ?? row.subprogram_id; // Adjusted to subprogram_id

    const startEditing = (rowId, colKey, currentValue, inputType) => {
        setEditing({ rowId, colKey, inputType });
        setEditValue(currentValue ?? '');
    };

    const saveEdit = (row) => {
        if (!onUpdate) return;
        let value = editValue;
        if (editing.inputType === 'number') {
            value = parseFloat(value) || 0;
        }
        const updates = { [editing.colKey]: value };
        onUpdate(getRowId(row), updates);
        setEditing(null);
        setEditValue('');
    };

    // Calculate dropdown position when activeDropdownId changes
    useEffect(() => {
        if (activeDropdownId && actionButtonRefs.current[activeDropdownId]) {
            const buttonElement = actionButtonRefs.current[activeDropdownId];
            const buttonRect = buttonElement.getBoundingClientRect();
            // Calculate position with offset
            setDropdownPosition({
                top: buttonRect.bottom + window.scrollY + 4 + dropdownOffset.y,
                left: buttonRect.right + window.scrollX - 160 + dropdownOffset.x,
            });
        }
    }, [activeDropdownId, dropdownOffset.x, dropdownOffset.y]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update dropdown position on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (activeDropdownId && actionButtonRefs.current[activeDropdownId]) {
                const buttonElement = actionButtonRefs.current[activeDropdownId];
                const buttonRect = buttonElement.getBoundingClientRect();
                // Recalculate position with offset on scroll
                setDropdownPosition({
                    top: buttonRect.bottom + window.scrollY + 4 + dropdownOffset.y,
                    left: buttonRect.right + window.scrollX - 160 + dropdownOffset.x,
                });
            }
        };
        // Listen to scroll events on the table container and window
        window.addEventListener('scroll', handleScroll, true);
        if (tableContainerRef.current) {
            tableContainerRef.current.addEventListener('scroll', handleScroll);
        }
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            if (tableContainerRef.current) {
                tableContainerRef.current.removeEventListener('scroll', handleScroll);
            }
        };
    }, [activeDropdownId, dropdownOffset.x, dropdownOffset.y]);

    // Default row styling
    const defaultRowStyle = (row, index) => {
        const baseColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        return baseColor;
    };
    const rowStyleFn = getRowStyle || defaultRowStyle;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }
    if (error) {
        return <div className="p-8 text-center text-red-600">{error}</div>;
    }
    return (
        <div className="relative">
            {/* Table container */}
            <div
                ref={tableContainerRef}
                className="overflow-auto pb-6 relative !max-h-[72vh]"
            // style={{ maxHeight }}
            >
                {/* Custom checkbox styles */}
                <style>{`
          .custom-checkbox {
            appearance: none;
            background-color: #e6f2ff;
            border: 2px solid #007bff;
            border-radius: 4px;
            width: 0.75rem;
            height: 0.75rem;
            cursor: pointer;
            display: inline-block;
            position: relative;
          }
          .custom-checkbox:checked {
            background-color: #e6f2ff;
            background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z' fill='%23007bff'/%3e%3c/svg%3e");
            background-size: 100% 100%;
            background-position: center;
            background-repeat: no-repeat;
          }
          .custom-checkbox:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
          }
        `}</style>
                <table className="min-w-[1200px] w-full text-left border-collapse ">
                    <thead>
                        <tr className="bg-[#001f3f] text-white text-sm sticky top-0 z-10">
                            {columns.map((col, idx) => (
                                <th
                                    key={col.key || idx}
                                    className={`
                                    px-4 py-3 text-left bg-[#0c2a4d] text-white
                                    ${idx === 0 ? 'rounded-tl-lg' : ''}
                                    ${idx === columns.length - 1 ? 'rounded-tr-lg' : ''}
                                    `}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {(actions.length > 0 || customActions) && (
                                <th className="p-4 font-medium whitespace-nowrap rounded-tr-lg"></th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        columns.length +
                                        (enableSelection ? 1 : 0) +
                                        (actions.length > 0 || customActions ? 1 : 0)
                                    }
                                    className="p-8 text-center text-gray-500 bg-white"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr
                                    key={row.id || index}
                                    className={`border-b border-gray-100 ${rowStyleFn(row, index)}`}
                                >
                                    {columns.map((col, colIdx) => {
                                        const isEditable = col.editable;
                                        const cellClass = isEditable
                                            ? 'cursor-text'
                                            : 'cursor-not-allowed bg-gray-100';
                                        return (
                                            <td
                                                key={col.key || colIdx}
                                                className={`p-4 ${col.className || ''} ${cellClass}`}
                                                onDoubleClick={
                                                    isEditable
                                                        ? () => startEditing(getRowId(row), col.key, col.render ? col.render(row) : (row[col.key] ?? ''), col.inputType)
                                                        : null
                                                }
                                            >
                                                {editing && editing.rowId === getRowId(row) && editing.colKey === col.key ? (
                                                    <input
                                                        type={col.inputType || 'text'}
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => saveEdit(row)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                saveEdit(row);
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="w-full p-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    (col.render ? col.render(row, index) : (row[col.key] ?? '-'))
                                                )}
                                            </td>
                                        );
                                    })}
                                    {(actions.length > 0 || customActions) && (
                                        <td className="p-4">
                                            <div className="flex items-center justify-end space-x-2">
                                                {/* Custom actions (e.g., Recall button) */}
                                                {customActions && customActions(row)}
                                                {/* Dropdown menu */}
                                                {actions.length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            ref={(el) => {
                                                                if (el) {
                                                                    actionButtonRefs.current[getRowId(row)] = el;
                                                                } else {
                                                                    delete actionButtonRefs.current[getRowId(row)];
                                                                }
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const rowId = getRowId(row);
                                                                if (activeDropdownId === rowId) {
                                                                    setActiveDropdownId(null);
                                                                    return;
                                                                }
                                                                const button = actionButtonRefs.current[rowId];
                                                                const rect = button.getBoundingClientRect();
                                                                const spaceBelow = window.innerHeight - rect.bottom;
                                                                const dropdownHeight = 170; // approx dropdown height
                                                                if (spaceBelow < dropdownHeight) {
                                                                    setDropdownDirection("up");
                                                                } else {
                                                                    setDropdownDirection("down");
                                                                }
                                                                setActiveDropdownId(rowId);
                                                            }}
                                                            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-gray-500 transition-colors"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        {activeDropdownId === getRowId(row) && (
                                                            <div
                                                                ref={dropdownRef}
                                                                className={`absolute right-0 w-40 max-h-[180px] !overflow-auto bg-[#E5E7EB] rounded-2xl shadow-xl z-50 border border-gray-200 ${dropdownDirection === "down"
                                                                    ? "top-full mt-1"
                                                                    : "bottom-full mb-1"
                                                                    }`}
                                                            >
                                                                <div className="p-1 space-y-[1px]">
                                                                    {(typeof actions === 'function' ? actions(row) : actions).map((action, actionIdx) => (
                                                                        <React.Fragment key={actionIdx}>
                                                                            <button
                                                                                onClick={() => {
                                                                                    action.onClick(row);
                                                                                    setActiveDropdownId(null);
                                                                                }}
                                                                                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/50 transition-colors text-left"
                                                                            >
                                                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                                                    {action.icon}
                                                                                </div>
                                                                                <span className="text-gray-800 font-medium text-sm">
                                                                                    {action.label}
                                                                                </span>
                                                                            </button>
                                                                        </React.Fragment>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default Table;