// src/pages/Carton activity/CartonMainPPC.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Copy, PenLine, ChevronRight, Eye, Check, X } from 'lucide-react';
import api from '../../api/axiosInstance';
import Table from './Table_Warehouse';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function CartonMainWarehouse() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [toast, setToast] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [recallingIds, setRecallingIds] = useState(new Set());

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/warehouse/dashboard/');
            const list = Array.isArray(response.data)
                ? response.data
                : response.data?.results || [];
            const sorted = [...list].sort((a, b) => {
                const parse = (d) => {
                    if (!d) return 0;
                    const [day, month, year] = d.split('-');
                    return new Date(`${year}-${month}-${day}`).getTime();
                };
                return 
                // (
                    // parse(created_on)
                    // ||
                    // b.id - a.id
                // );
            });
            setData(sorted);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch PPC list:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getRowStyle = (row, index) => {
        const baseColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        let gradient = 'bg-gradient-to-r from-white via-[#f0f7ff] to-white';
        if (row.status === 'Completed') {
            gradient = 'bg-gradient-to-r from-white via-[#e0f7fa] to-white';
        } else if (row.status === 'Reject') {
            gradient = 'bg-gradient-to-r from-white via-[#ffebee] to-white';
        }
        return `${baseColor} ${gradient}`;
    };

    const handleSelectRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(data.map((row) => row.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleUpdate = async (subprogram_id, updates) => {
        try {
            const payload = {
                subprogram_id,
                ...updates,
            };
            await api.post('/api/warehouse/update/', payload);
            toast.success('Updated successfully' );
            fetchData();
        } catch (err) {
            console.error('Failed to update:', err);
            toast.error('Failed to update');
        }
    };

    const columns = [
        { key: 'subprogram_id', header: 'ID', render: (row) => row.subprogram_id },
        {
            key: 'article_no',
            header: 'Article No',
            render: (row) => row.article_no || '-',
        },
        {
            key: 'so_item_text',
            header: 'SO Item Text',
            render: (row) => row.so_item_text || '-',
        },
        {
            key: 'possible_ca',
            header: 'Possible CA',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.possible_ca ?? '-',
            editable: true,
            inputType: 'number',
        },
        {
            key: 'ship_qty',
            header: 'Ship Qty',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.ship_qty ?? '-',
            editable: true,
            inputType: 'number',
        },
        {
            key: 'pieces_per_carton',
            header: 'Pieces/Carton',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.pieces_per_carton ?? '-',
        },
        {
            key: 'length',
            header: 'Length (cm)',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.length ?? '-',
        },
        {
            key: 'width',
            header: 'Width (cm)',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.width ?? '-',
        },
        {
            key: 'height',
            header: 'Height (cm)',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.height ?? '-',
        },
        {
            key: 'cbm_per_carton',
            header: 'CBM/Carton',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.cbm_per_carton?.toFixed?.(3) ?? '-',
        },
        {
            key: 'net_wt_per_carton',
            header: 'Net Wt/Carton',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.net_wt_per_carton ?? '-',
        },
        {
            key: 'gross_wt_per_carton',
            header: 'Gross Wt/Carton',
            className: 'text-right whitespace-nowrap',
            render: (row) => row.gross_wt_per_carton ?? '-',
            editable: true,
            inputType: 'number',
        },
        {
            key: 'total_cbm',
            header: 'Total CBM',
            className: 'text-right whitespace-nowrap font-medium',
            render: (row) => row.total_cbm?.toFixed?.(3) ?? '-',
        },
        {
            key: 'total_net_wt',
            header: 'Total Net Wt',
            className: 'text-right whitespace-nowrap font-medium',
            render: (row) => row.total_net_wt ?? '-',
        },
        {
            key: 'total_gross_wt',
            header: 'Total Gross Wt',
            className: 'text-right whitespace-nowrap font-medium',
            render: (row) => row.total_gross_wt ?? '-',
        },
        {
            key: 'upc',
            header: 'UPC',
            className: 'whitespace-nowrap',
            render: (row) => row.upc || '-',
            editable: true,
            inputType: 'text',
        },
        {
            key: 'final_destination',
            header: 'Final Destination',
            render: (row) => row.final_destination || '-',
            editable: true,
            inputType: 'text',
        },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 mx-auto">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Carton Activity - Warehouse</h1>
                <div className="flex items-center text-sm text-gray-500 mb-6">
                    <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
                    <ChevronRight size={16} className="mx-2" />
                    <span className="font-semibold text-[#003366] border-b border-[#003366]">
                        Carton Activity
                    </span>
                </div>
            </div>
            <div>
                <div className="p-2 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Warehouse Assigned Activities</h2>
                    <h2 className="text-sm font-semibold text-gray-700">Double-Click to update values</h2>
                </div>
                <Table
                    data={data}
                    loading={loading}
                    error={error}
                    columns={columns.filter(col => col.key !== 'subprogram_id')}
                    enableSelection={true}
                    selectedRows={selectedRows}
                    onSelectRow={handleSelectRow}
                    onSelectAll={handleSelectAll}
                    actions={[]}
                    getRowStyle={getRowStyle}
                    emptyMessage="No carton activity found."
                    maxHeight="70vh"
                    onUpdate={handleUpdate}
                />
            </div>
        </div>
    );
}
export default CartonMainWarehouse;