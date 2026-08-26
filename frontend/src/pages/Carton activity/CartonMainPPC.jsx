// src/pages/Carton activity/CartonMainPPC.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Copy, PenLine, ChevronRight, Eye, Check, X } from 'lucide-react';
import api from '../../api/axiosInstance';
import Table from './Table';
import { useNavigate } from 'react-router-dom';

function CartonMainPPC() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [recallingIds, setRecallingIds] = useState(new Set());

  const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";

  const [datePart, timePart] = dateTime.trim().split(" ");
  if (!datePart) return "-";

  const [day, month, year] = datePart.split("-");

  if (!timePart) return `${day}-${month}-${year}`;

  // Backend UTC mein data deta hai, isliye Date object UTC treat karke banao
  const utcDate = new Date(`${year}-${month}-${day}T${timePart}Z`); // 👈 'Z' = UTC marker

  if (isNaN(utcDate.getTime())) return `${day}-${month}-${year}`;

  // Ab is UTC date ko IST (Asia/Kolkata) mein format karo
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
  // en-GB format deta hai: "25/08/2026, 02:23 pm" — usko apne format mein convert karo

  const [datePartOut, timePartOut] = formatted.split(", ");
  const [d, m, y] = datePartOut.split("/");

  return `${d}-${m}-${y}, ${timePartOut.toUpperCase()}`;
};

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/activities/my-assigned/');

      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      // const sorted = [...list].sort((a, b) => {
      //   const parse = (d) => {
      //     if (!d) return 0;
      //     const [day, month, year] = d.split('-');
      //     return new Date(`${year}-${month}-${day}`).getTime();
      //   };
      //       return parse(b.created_on) - parse(a.created_on); 
      // });

 const sorted = [...list].sort((a, b) => {
    const parse = (d) => {
      if (!d) return 0;

      // agar date + time dono hain (space se separated), to alag karo
      const [datePart, timePart] = d.trim().split(' ');
      const [day, month, year] = datePart.split('-');

      // agar time nahi hai to 00:00:00 use karo
      const isoString = `${year}-${month}-${day}T${timePart || '00:00:00'}`;
      const parsed = new Date(isoString).getTime();

      // agar parsing fail ho jaye (invalid date), to 0 return karo
      return isNaN(parsed) ? 0 : parsed;
    };

    return parse(b.created_on) - parse(a.created_on);
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

  const handleEdit = (row) => {
    navigate(`/carton/edit/${row.id}`);
  };

  const handleView = (row) => {
    navigate(`/carton/view/${row.activity_program_status_id}`);
  };

  const handleAccept = async (row) => {
    try {
      await api.post('/api/purchase/accept-request/', {
        activity_program_status_id: row.activity_program_status_id,
      });

      await api.post('/api/purchase/submit-completion/', {
        activity_program_status_id: row.activity_program_status_id,
      });

      setToast({ type: 'success', message: `Request ${row.id} accepted and completed successfully!` });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to accept request.' });
    }
  };

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

  const columns = [
    { key: 'activity_program_status_id', header: 'ID', render: (row) => row.activity_program_status_id },
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
  key: 'created_on',
  header: 'Created Date',
  className: 'text-gray-500 whitespace-nowrap',
  render: (row) => (
    <div className="flex items-center gap-2">
      <Calendar size={14} className="text-gray-400" />
      {formatDateTime(row.created_on)}
    </div>
  ),
}
  ];

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

    const normalizedStatus = String(row.status).toLowerCase();
    if (normalizedStatus === 'tentative working submitted' || normalizedStatus === 'final working submitted') {
      actionsList.push({
        label: 'Accept & Complete',
        icon: <Check size={16} className="text-green-600" />,
        onClick: () => handleAccept(row),
      });
    }

    return actionsList;
  };

  const customActions = (row) => {
    const normalizedStatus = String(row.status).toLowerCase();
    const isPending = normalizedStatus.includes('pending');
    const isDraft = normalizedStatus === 'draft' || normalizedStatus === 'save as draft';
    const isAcceptable = normalizedStatus === 'tentative working submitted' || normalizedStatus === 'final working submitted';

    return (
      <div className="flex items-center gap-2">
        {isPending && (
          <button
            onClick={() => handleRecall(row)}
            className="bg-[#DCEBF6] hover:bg-blue-200 text-[#003366] text-xs font-semibold px-4 py-1.5 rounded transition-colors cursor-pointer"
          >
            Recall
          </button>
        )}

        {isDraft && (
          <button
            onClick={() => handleEdit(row)}
            className="bg-[#E3F2FD] hover:bg-blue-100 text-[#003366] text-xs font-semibold px-4 py-1.5 rounded transition-colors cursor-pointer"
          >
            Edit
          </button>
        )}

        {isAcceptable && (
          <button
            onClick={() => handleAccept(row)}
            className="bg-[#E8F5E9] hover:bg-green-100 text-[#2E7D32] text-xs font-semibold px-4 py-1.5 rounded transition-colors cursor-pointer"
          >
            Accept & Complete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 animate-fade-in-out ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carton Activity - PPC</h1>

        <div className="flex items-center text-sm text-gray-500 mb-6">
          <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
          <ChevronRight size={16} className="mx-2" />
          <span className="font-semibold text-[#003366] border-b border-[#003366]">
            Carton Activity
          </span>
        </div>

        {/* <button
          onClick={() => navigate('/form')}
          className="cursor-pointer bg-[#003366] hover:bg-blue-900 text-white font-medium py-2.5 px-6 rounded shadow-sm transition-colors"
        >
          Create Request
        </button> */}
      </div>

      <div>
        <div className="p-2 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">PPC Assigned Activities</h2>
        </div>

        {/* <Table
          data={data}
          loading={loading}
          error={error}
          columns={columns}
          enableSelection={true}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          actions={getActions}
          customActions={customActions}
          getRowStyle={getRowStyle}
          emptyMessage="No carton activity found for PPC."
          maxHeight="70vh"
        /> */}
                <Table
          data={data}
          loading={loading}
          error={error}
          columns={columns}
          enableSelection={true}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          //   actions={actions}
          //   customActions={null}
          actions={[]}   // empty → no dropdown
          customActions={(row) => (
            <button
              onClick={() => handleView(row)}
              className="px-3 py-1.5 bg-[#003366] text-white text-sm rounded-md flex items-center gap-2 hover:bg-[#002244] cursor-pointer"
            >
              <Eye size={14} />
              View
            </button>
          )}
          getRowStyle={getRowStyle}
          emptyMessage="No carton activity found."
          maxHeight="70vh"
        />
      </div>
    </div>
  );
}

export default CartonMainPPC;