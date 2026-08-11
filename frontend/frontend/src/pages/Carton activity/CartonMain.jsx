import React, { useState, useEffect } from 'react';
import { Calendar, Copy, PenLine, ChevronRight, Eye } from 'lucide-react';
import api from '../../api/axiosInstance';
import Table from './Table';
import { useNavigate } from 'react-router-dom';

function CartonMain() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('carton'); // 'carton' or 'gusset'

  // Data
  const [cartonData, setCartonData] = useState([]);
  const [gussetData, setGussetData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [selectedRows, setSelectedRows] = useState([]);
  const [recallingIds, setRecallingIds] = useState(new Set());

  // ==================== FETCH CARTON PROGRAMS ====================
  const fetchCarton = async () => {
    try {
      const res = await api.get('/api/activity-program-status/list/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const sorted = [...list].sort((a, b) => {
        const parse = (dt) => {
          if (!dt) return 0;
          const [d, t] = dt.split(' ');
          const [day, mon, yr] = d.split('-');
          return new Date(`${yr}-${mon}-${day}T${t}`).getTime();
        };
        return parse(b.last_action_date) - parse(a.last_action_date) || b.id - a.id;
      });

      setCartonData(sorted);
    } catch (err) {
      console.error(err);
      setError('Failed to load Carton programs');
    }
  };

  // ==================== FETCH GUSSET PROGRAMS ====================
  const fetchGusset = async () => {
    try {
      const res = await api.get('/api/list/');
      const list = Array.isArray(res.data) ? res.data : [];
      setGussetData(list);
    } catch (err) {
      console.error(err);
      setError('Failed to load Gusset programs');
    }
  };

  // Fetch when tab changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (activeTab === 'carton') {
      fetchCarton();
    } else {
      fetchGusset();
    }
    setLoading(false);
  }, [activeTab]);

  // ==================== ACTIONS ====================
  const handleCopy = async (row) => {
    try {
      await api.post('/api/carton-program/copy/', { activity_program_status_id: row.id });
      setToast({ type: 'success', message: `Request ${row.id} copied successfully!` });
      fetchCarton();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to copy' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleRecall = async (row) => {
    const id = row.id;
    if (recallingIds.has(id)) return;

    setRecallingIds(prev => new Set([...prev, id]));
    try {
      await api.post('/api/activity-program/recall/', { activity_program_status_id: id });
      setToast({ type: 'success', message: `Request ${id} recalled!` });
      fetchCarton();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.detail || 'Recall failed' });
    } finally {
      setRecallingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleEdit = (row) => navigate(`/carton/edit/${row.id}`);
  const handleView = (row) => navigate(`/carton/view/${row.id}`);
  const handleGussetView = (row) => navigate(`/gusset/view/${row.program_id}`);

  // ==================== COLUMNS ====================
  const cartonColumns = [
    // { key: 'id', header: 'ID' },
    { key: 'customer_name', header: 'Customer Name' },
    { key: 'program_name', header: 'Program Name', className: 'font-medium text-gray-900' },
    { key: 'status', header: 'Status' },
    { key: 'created_date', header: 'Created Date' },
    { key: 'last_action_date', header: 'Last Action Date' },
  ];

  const gussetColumns = [
    // { key: 'program_id', header: 'Program ID' },
    { key: 'customer_name', header: 'Customer Name' },
    { key: 'program_name', header: 'Program Name', className: 'font-medium' },
    { key: 'created_on', header: 'Created On' },
  ];

  // ==================== ACTIONS FOR EACH TAB ====================
  const getCartonActions = (row) => [
    { label: 'Copy', icon: <Copy size={16} className="text-gray-600" />, onClick: handleCopy },
    { label: 'View', icon: <Eye size={16} />, onClick: handleView },
    ...(String(row.status).toLowerCase() === 'draft' || String(row.status).toLowerCase() === 'save as draft'
      ? [{ label: 'Edit', icon: <PenLine size={16} />, onClick: handleEdit }]
      : []),
    ...(String(row.status).toLowerCase().includes('pending')
      ? [{ label: 'Recall', icon: <PenLine size={16} />, onClick: handleRecall }]
      : []),
  ];
// ==================== DIRECT VIEW BUTTON FOR GUSSET ONLY ====================
  const gussetCustomAction = (row) => (
    <button
      onClick={() => handleGussetView(row)}
      className="px-5 py-2 bg-[#003366] hover:bg-[#002244] text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
    >
      <Eye size={16} />
      View
    </button>
  );

  const currentData = activeTab === 'carton' ? cartonData : gussetData;
  const currentColumns = activeTab === 'carton' ? cartonColumns : gussetColumns;

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Carton & Gusset Activity</h1>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
          <ChevronRight size={16} className="mx-2" />
          <span className="font-semibold text-[#003366]">Activity Programs</span>
        </div>
      </div>

      {/* HEADER ACTION */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/form")}
          className="bg-[#003366] hover:bg-[#002244] text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition-all duration-200"
        >
          Create Carton Request
        </button>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("carton")}
          className={`pb-2 text-sm font-medium transition-colors ${activeTab === "carton"
              ? "text-[#003366] border-b-2 border-[#003366]"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Carton Programs
        </button>

        <button
          onClick={() => setActiveTab("gusset")}
          className={`pb-2 text-sm font-medium transition-colors ${activeTab === "gusset"
              ? "text-[#003366] border-b-2 border-[#003366]"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Gusset Programs
        </button>
      </div>

      {/* TABLE */}
      <Table
        data={currentData}
        loading={loading}
        error={error}
        columns={currentColumns}
        enableSelection={false}
        selectedRows={selectedRows}
        onSelectRow={(id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])}
        onSelectAll={(e) => setSelectedRows(e.target.checked ? currentData.map(r => r.id || r.program_id) : [])}
        actions={activeTab === 'carton' ? getCartonActions : []}
        // Gusset → Direct "View" button only
        customActions={activeTab === 'gusset' ? gussetCustomAction : null}        getRowStyle={(row, idx) => (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
        emptyMessage={activeTab === 'carton' ? 'No carton activity found.' : 'No gusset programs found.'}
        maxHeight="70vh"
      />
    </div>
  );
}

export default CartonMain;

// import React, { useState, useEffect } from 'react';
// import { Calendar, Copy, PenLine, ChevronRight, Eye } from 'lucide-react';
// import api from '../../api/axiosInstance';
// import Table from './Table'; // Shared Table component
// import { useNavigate } from 'react-router-dom'; // ← NEW: for navigation to edit form

// function CartonMain({ onCreateRequest }) {
//   const navigate = useNavigate(); // ← NEW
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [toast, setToast] = useState(null);
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [recallingIds, setRecallingIds] = useState(new Set());


//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get('/api/activity-program-status/list/');

//       const list = Array.isArray(response.data)
//         ? response.data
//         : response.data?.results || [];

//       // ✅ sort by last_action_date (latest first)
//       const sorted = [...list].sort((a, b) => {
//         const parseDateTime = (dateTime) => {
//           if (!dateTime) return 0;

//           // Split date and time
//           const [datePart, timePart] = dateTime.split(' ');
//           const [day, month, year] = datePart.split('-');

//           return new Date(`${year}-${month}-${day}T${timePart}`).getTime();
//         };

//         return (
//           parseDateTime(b.last_action_date) -
//           parseDateTime(a.last_action_date) ||
//           b.id - a.id
//         );
//       });

//       setData(sorted);
//       setError(null);
//     } catch (err) {
//       console.error('Failed to fetch list:', err);
//       setError('Failed to load data. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };


//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Copy handler
//   const handleCopy = async (row) => {
//     try {
//       await api.post('/api/carton-program/copy/', {
//         activity_program_status_id: row.id,
//       });
//       setToast({ type: 'success', message: `Request ${row.id} duplicated successfully!` });
//       fetchData();
//     } catch (err) {
//       const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to copy request';
//       setToast({ type: 'error', message: msg });
//     }
//     setTimeout(() => setToast(null), 4000);
//   };

//   const handleRecall = async (row) => {
//     const id = row.id;
//     if (recallingIds.has(id)) return;

//     setRecallingIds((prev) => new Set([...prev, id]));

//     try {
//       await api.post('/api/activity-program/recall/', {
//         activity_program_status_id: id,
//       });

//       setToast({
//         type: 'success',
//         message: `Request ${id} recalled successfully!`,
//       });

//       fetchData();
//     } catch (err) {
//       console.error('Recall failed:', err);
//       const msg =
//         err.response?.data?.detail ||
//         err.response?.data?.error ||
//         'Failed to recall request';
//       setToast({ type: 'error', message: msg });
//     } finally {
//       setRecallingIds((prev) => {
//         const next = new Set(prev);
//         next.delete(id);
//         return next;
//       });
//     }

//     setTimeout(() => setToast(null), 4000);
//   };

//   // NEW: Navigate to edit form (pass ID in URL)
//   const handleEdit = (row) => {
//     // Navigate to your edit form page with the ID
//     // Example: /carton/edit/:id
//     navigate(`/carton/edit/${row.id}`); // Adjust route as per your router setup
//   };

//   const handleView = (row) => {
//     navigate(`/carton/view/${row.id}`);
//   };
//   // Row styling
//   const getRowStyle = (row, index) => {
//     const baseColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
//     let gradient = 'bg-gradient-to-r from-white via-[#f0f7ff] to-white';

//     if (row.status === 'Completed') {
//       gradient = 'bg-gradient-to-r from-white via-[#e0f7fa] to-white';
//     } else if (row.status === 'Reject') {
//       gradient = 'bg-gradient-to-r from-white via-[#ffebee] to-white';
//     }

//     return `${baseColor} ${gradient}`;
//   };

//   const getStatusTextStyle = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'completed': return 'text-[#00C853]';
//       case 'reject': return 'text-[#FF3D00]';
//       default: return 'text-[#F5A623]';
//     }
//   };

//   // Selection
//   const handleSelectRow = (id) => {
//     setSelectedRows((prev) =>
//       prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
//     );
//   };

//   const handleSelectAll = (e) => {
//     if (e.target.checked) {
//       setSelectedRows(data.map((row) => row.id));
//     } else {
//       setSelectedRows([]);
//     }
//   };

//   const formatDateOnly = (dateTime) => {
//   if (!dateTime) return "-";

//   const [datePart] = dateTime.split(" ");
//   const [day, month, year] = datePart.split("-");

//   return `${day}-${month}-${year}`;
// };

//   // Column config
//   const columns = [
//     { key: 'id', header: 'ID', render: (row) => row.id },
//     {
//       key: 'program_name',
//       header: 'Program Name',
//       className: 'font-medium text-gray-900',
//       render: (row) => row.program_name || '-',
//     },
//     {
//       key: 'customer_name',
//       header: 'Customer Name',
//       render: (row) => row.customer_name || '-',
//     },
//     {
//       key: 'status',
//       header: 'Status',
//       render: (row) => (
//         <span className={`font-medium ${getStatusTextStyle(row.status)}`}>
//           {row.status || 'Unknown'}
//         </span>
//       ),
//     },
//     {
//       key: 'created_date',
//       header: 'Created Date',
//       className: 'text-gray-500 whitespace-nowrap',
//       render: (row) => (
//         <div className="flex items-center gap-2">
//           <Calendar size={14} className="text-gray-400" />
//           {formatDateOnly(row.created_date) || '-'}
//         </div>
//       ),
//     },
//     {
//       key: 'last_action_date',
//       header: 'Last Action Date',
//       className: 'text-gray-500 whitespace-nowrap',
//       render: (row) => (
//         <div className="flex items-center gap-2">
//           <Calendar size={14} className="text-gray-400" />
//           {formatDateOnly(row.last_action_date) || '-'}
//         </div>
//       ),
//     },
//   ];

//   // // Actions (Copy + Re-Name)
//   // const actions = [
//   //   {
//   //     label: 'Copy',
//   //     icon: <Copy size={16} className="text-gray-600" />,
//   //     onClick: handleCopy,
//   //   },
//   //   {
//   //     label: 'Re-Name',
//   //     icon: <PenLine size={16} className="text-gray-600" />,
//   //     onClick: (row) => {
//   //       console.log('Rename clicked for:', row.id);
//   //       // Add rename modal/logic later
//   //     },
//   //   },
//   // ];

//   // // Custom actions: Recall + NEW Edit button
//   // const customActions = (row) => {
//   //   const isRecalling = recallingIds.has(row.id);
//   //   const isPending = String(row.status).toLowerCase().includes('pending');
//   //   const isDraft = String(row.status).toLowerCase() === 'draft';

//   //   return (
//   //     <div className="flex items-center gap-2">
//   //       {isPending && (
//   //         <button
//   //           onClick={() => handleRecall(row)}
//   //           className="bg-[#DCEBF6] hover:bg-blue-200 text-[#003366] text-xs font-semibold px-4 py-1.5 rounded transition-colors"
//   //         >
//   //           Recall
//   //         </button>
//   //       )}

//   //       {isDraft && (
//   //         <button
//   //           onClick={() => handleEdit(row)}
//   //           className="bg-[#E3F2FD] hover:bg-blue-100 text-[#003366] text-xs font-semibold px-4 py-1.5 rounded transition-colors"
//   //         >
//   //           Edit
//   //         </button>
//   //       )}
//   //     </div>
//   //   );
//   // };





//   const getActions = (row) => {
//     const actionsList = [
//       {
//         label: 'Copy',
//         icon: <Copy size={16} className="text-gray-600" />,
//         onClick: handleCopy,
//       },
//       {
//         label: 'Re-Name',
//         icon: <PenLine size={16} className="text-gray-600" />,
//         onClick: (row) => {
//           console.log('Rename clicked for:', row.id);
//         },
//       },
//       {
//         label: 'View',
//         icon: <Eye size={16} />,
//         onClick: handleView,
//       },
//     ];

//     if (String(row.status).toLowerCase() === 'draft' || String(row.status).toLowerCase() === 'save as draft') {
//       actionsList.push({
//         label: 'Edit',
//         icon: <PenLine size={16} className="text-gray-600" />,
//         onClick: handleEdit,
//       });
//     }

//     if (String(row.status).toLowerCase().includes('pending')) {
//       actionsList.push({
//         label: 'Recall',
//         icon: <PenLine size={16} className="text-gray-600" />,
//         onClick: handleRecall,
//       });
//     }

//     return actionsList;
//   };


//   return (
//     <div className="p-4 md:p-6 lg:p-8 mx-auto">
//       {/* Toast */}
//       {toast && (
//         <div
//           className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 animate-fade-in-out ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
//             }`}
//         >
//           {toast.type === 'success' ? '✅' : '❌'} {toast.message}
//         </div>
//       )}

//       {/* Header */}
//       <div className="mb-4">
//         <h1 className="text-2xl font-bold text-gray-900 mb-2">Carton Activity - Marketing</h1>

//         <div className="flex items-center text-sm text-gray-500 mb-6">
//           <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
//           <ChevronRight size={16} className="mx-2" />
//           <span className="font-semibold text-[#003366] border-b border-[#003366]">
//             Carton Activity
//           </span>
//         </div>

//         <button
//           // onClick={onCreateRequest}
//           onClick={() => navigate('/form')}
//           className="cursor-pointer bg-[#003366] hover:bg-blue-900 text-white font-medium py-2.5 px-6 rounded shadow-sm transition-colors cursor-pointer"
//         >
//           Create Request
//         </button>
//       </div>

//       {/* Table */}
//       <div>
//         <div className="p-2 py-4 border-b border-gray-100">
//           <h2 className="text-lg font-semibold text-gray-800">Submit Room Details</h2>
//         </div>

//         <Table
//           data={data}
//           loading={loading}
//           error={error}
//           columns={columns}
//           enableSelection={true}
//           selectedRows={selectedRows}
//           onSelectRow={handleSelectRow}
//           onSelectAll={handleSelectAll}
//           actions={getActions}
//           getRowStyle={getRowStyle}
//           emptyMessage="No carton activity found."
//           maxHeight="70vh"
//         />
//       </div>
//     </div>
//   );
// }

// export default CartonMain;
