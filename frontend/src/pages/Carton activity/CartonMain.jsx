import React, { useState, useEffect } from 'react';
import { Calendar, Copy, PenLine, ChevronRight, Eye } from 'lucide-react';
import api from '../../api/axiosInstance';
import Table from './Table'; // Shared Table component
import { useNavigate } from 'react-router-dom'; // ← NEW: for navigation to edit form

function CartonMain({ onCreateRequest }) {
  const navigate = useNavigate(); // ← NEW
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [recallingIds, setRecallingIds] = useState(new Set());


  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/activity-program-status/list/');

      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      // program_type_group ('carton' / 'gusset') already comes from the
      // backend now, since ActivityProgramStatus covers both.

      // Sort by last_action_date (latest first)
      const sorted = [...list].sort((a, b) => {
        const parseDateTime = (dateTime) => {
          if (!dateTime) return 0;

          const [datePart, timePart] = dateTime.trim().split(' ');
          if (!datePart) return 0;
          const [day, month, year] = datePart.split('-');

          return new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}`).getTime();
        };

        return (
          parseDateTime(b.last_action_date) -
          parseDateTime(a.last_action_date) ||
          b.id - a.id
        );
      });

      setData(sorted);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch list:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  // Copy handler
  const handleCopy = async (row) => {
    try {
      await api.post('/api/carton-program/copy/', {
        activity_program_status_id: row.id,
      });
      setToast({ type: 'success', message: `Request ${row.id} duplicated successfully!` });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to copy request';
      setToast({ type: 'error', message: msg });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleRecall = async (row) => {
    const id = row.id;
    if (recallingIds.has(id)) return;

    setRecallingIds((prev) => new Set([...prev, id]));

    try {
      await api.post('/api/activity-program/recall/', {
        activity_program_status_id: id,
      });

      setToast({
        type: 'success',
        message: `Request ${id} recalled successfully!`,
      });

      fetchData();
    } catch (err) {
      console.error('Recall failed:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to recall request';
      setToast({ type: 'error', message: msg });
    } finally {
      setRecallingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }

    setTimeout(() => setToast(null), 4000);
  };

  // NEW: Navigate to edit form (pass ID in URL)
  const handleEdit = (row) => {
    // Navigate to your edit form page with the ID
    // Example: /carton/edit/:id
    navigate(`/carton/edit/${row.id}`); // Adjust route as per your router setup
  };

  const handleView = (row) => {
    // "both" (combined Gusset+Bedsheet) always opens CartonView, which
    // shows the linked Gusset section at the top.
    if (row.program_type_group === 'gusset') {
      navigate(`/gusset/view/${row.id}`);
    } else {
      navigate(`/carton/view/${row.id}`);
    }
  };
  // Row styling
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

  const getStatusTextStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-[#00C853]';
      case 'reject': return 'text-[#FF3D00]';
      default: return 'text-[#F5A623]';
    }
  };

  // Selection
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

const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";

  const [datePart, timePart] = dateTime.trim().split(" ");
  if (!datePart) return "-";

  const [day, month, year] = datePart.split("-");

  if (!timePart) return `${day}-${month}-${year}`;

  // Backend UTC deta hai, isliye 'Z' laga ke UTC date banao
  const utcDate = new Date(`${year}-${month}-${day}T${timePart}Z`);

  if (isNaN(utcDate.getTime())) return `${day}-${month}-${year}`;

  // IST mein convert karo
  const istOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };

  const formatted = new Intl.DateTimeFormat("en-GB", istOptions).format(utcDate);
  const [datePartOut, timePartOut] = formatted.split(", ");
  const [d, m, y] = datePartOut.split("/");

  return `${d}-${m}-${y}, ${timePartOut.toUpperCase()}`;
};

  // Column config
  const columns = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    {
      key: 'program_name',
      header: 'Program Name',
      className: 'font-medium text-gray-900',
      render: (row) => row.program_name || '-',
    },
    {
      key: 'customer_name',
      header: 'Customer Name',
      render: (row) => row.customer_name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`font-medium ${getStatusTextStyle(row.status)}`}>
          {row.status || 'Unknown'}
        </span>
      ),
    },
        {
      key: 'program_type_group',
      header: 'Type',
      render: (row) => {
        const styles = {
          gusset: 'bg-purple-100 text-purple-700',
          both: 'bg-amber-100 text-amber-800',
          carton: 'bg-blue-100 text-blue-700',
        };
        const labels = {
          gusset: 'Gusset',
          both: 'Gusset + Bedsheet',
          carton: 'Carton',
        };
        const group = row.program_type_group || 'carton';
        return (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[group]}`}>
            {labels[group]}
          </span>
        );
      },
    },
    {
  key: 'created_date',
  header: 'Created Date',
  className: 'text-gray-500 whitespace-nowrap',
  render: (row) => (
    <div className="flex items-center gap-2">
      <Calendar size={14} className="text-gray-400" />
      {formatDateTime(row.created_date)}
    </div>
  ),
},
{
  key: 'last_action_date',
  header: 'Last Action Date',
  className: 'text-gray-500 whitespace-nowrap',
  render: (row) => (
    <div className="flex items-center gap-2">
      <Calendar size={14} className="text-gray-400" />
      {formatDateTime(row.last_action_date)}
    </div>
  ),
},
  ];

  // // Actions (Copy + Re-Name)
  // const actions = [
  //   {
  //     label: 'Copy',
  //     icon: <Copy size={16} className="text-gray-600" />,
  //     onClick: handleCopy,
  //   },
  //   {
  //     label: 'Re-Name',
  //     icon: <PenLine size={16} className="text-gray-600" />,
  //     onClick: (row) => {
  //       console.log('Rename clicked for:', row.id);
  //       // Add rename modal/logic later
  //     },
  //   },
  // ];

  // // Custom actions: Recall + NEW Edit button
  // const customActions = (row) => {
  //   const isRecalling = recallingIds.has(row.id);
  //   const isPending = String(row.status).toLowerCase().includes('pending');
  //   const isDraft = String(row.status).toLowerCase() === 'draft';

  //   return (
  //     <div className="flex items-center gap-2">
  //       {isPending && (
  //         <button
  //           onClick={() => handleRecall(row)}
  //           className="bg-[#DCEBF6] hover:bg-blue-200 text-[#003366] text-xs font-semibold px-4 py-1.5 rounded transition-colors"
  //         >
  //           Recall
  //         </button>
  //       )}

  //       {isDraft && (
  //         <button
  //           onClick={() => handleEdit(row)}
  //           className="bg-[#E3F2FD] hover:bg-blue-100 text-[#003366] text-xs font-semibold px-4 py-1.5 rounded transition-colors"
  //         >
  //           Edit
  //         </button>
  //       )}
  //     </div>
  //   );
  // };





  const getActions = (row) => {
    const actionsList = [
      {
        label: 'Copy',
        icon: <Copy size={16} className="text-gray-600" />,
        onClick: handleCopy,
      },
      {
        label: 'Re-Name',
        icon: <PenLine size={16} className="text-gray-600" />,
        onClick: (row) => {
          console.log('Rename clicked for:', row.id);
        },
      },
      {
        label: 'View',
        icon: <Eye size={16} />,
        onClick: handleView,
      },
    ];

    if (String(row.status).toLowerCase() === 'draft' || String(row.status).toLowerCase() === 'save as draft') {
      actionsList.push({
        label: 'Edit',
        icon: <PenLine size={16} className="text-gray-600" />,
        onClick: handleEdit,
      });
    }

    if (String(row.status).toLowerCase().includes('pending')) {
      actionsList.push({
        label: 'Recall',
        icon: <PenLine size={16} className="text-gray-600" />,
        onClick: handleRecall,
      });
    }

    return actionsList;
  };


  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 animate-fade-in-out ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carton Activity - Marketing</h1>

        <div className="flex items-center text-sm text-gray-500 mb-6">
          <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
          <ChevronRight size={16} className="mx-2" />
          <span className="font-semibold text-[#003366] border-b border-[#003366]">
            Carton Activity
          </span>
        </div>

        <button
          // onClick={onCreateRequest}
          onClick={() => navigate('/form')}
          className="cursor-pointer bg-[#003366] hover:bg-blue-900 text-white font-medium py-2.5 px-6 rounded shadow-sm transition-colors cursor-pointer"
        >
          Create Request
        </button>
      </div>

      {/* Table */}
      <div>
        <div className="p-2 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Submit Room Details</h2>
        </div>

        <Table
          data={data}
          loading={loading}
          error={error}
          columns={columns}
          enableSelection={true}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          actions={getActions}
          getRowStyle={getRowStyle}
          emptyMessage="No carton activity found."
          maxHeight="70vh"
        />
      </div>
    </div>
  );
}

export default CartonMain;
