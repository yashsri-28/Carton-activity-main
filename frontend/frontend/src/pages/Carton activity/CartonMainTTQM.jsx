import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Eye } from 'lucide-react';
import api from '../../api/axiosInstance';
import Table from './Table';
import { useNavigate } from 'react-router-dom';

function CartonMainTTQM() {
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole')?.toLowerCase();

  const [activeTab, setActiveTab] = useState('carton'); // 'carton' or 'gusset'

  // Data
  const [cartonData, setCartonData] = useState([]);
  const [gussetData, setGussetData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [selectedRows, setSelectedRows] = useState([]);

  // ==================== FETCH CARTON (Role-based) ====================
  const fetchCarton = async () => {
    try {
      const endpoint = role === 'purchase'
        ? '/api/purchase/assigned-activities/'
        : '/api/activities/my-assigned/';

      const res = await api.get(endpoint);
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const sorted = [...list].sort((a, b) => {
        const parse = (dt) => {
          if (!dt) return 0;
          const [d, t] = dt.split(' ');
          const [day, mon, yr] = d.split('-');
          return new Date(`${yr}-${mon}-${day}T${t}`).getTime();
        };
        return parse(b.created_on) - parse(a.created_on) || b.id - a.id;
      });

      setCartonData(sorted);
    } catch (err) {
      console.error(err);
      setError('Failed to load Carton programs');
    }
  };

  // ==================== FETCH GUSSET ====================
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
    setSelectedRows([]);

    if (activeTab === 'carton') {
      fetchCarton();
    } else {
      fetchGusset();
    }
    setLoading(false);
  }, [activeTab]);

  // ==================== ACTIONS ====================
  const handleAccept = async (row) => {
    try {
      await api.post('/api/activity-program/accept/', {
        activity_program_status_id: row.activity_program_status_id || row.id,
      });
      setToast({ type: 'success', message: `Request accepted successfully` });
      fetchCarton();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to accept request' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleReject = async (row) => {
    try {
      await api.post('/api/activity-program/reject/', {
        activity_program_status_id: row.activity_program_status_id || row.id,
      });
      setToast({ type: 'success', message: `Request rejected` });
      fetchCarton();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to reject request' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleView = (row) => {
    navigate(`/carton/view/${row.activity_program_status_id || row.id}`);
  };

  const handleGussetView = (row) => {
    navigate(`/gusset/view/${row.program_id}`);
  };

  // ==================== COLUMNS ====================
  const cartonColumns = [
    // { key: 'activity_program_status_id', header: 'ID', render: (r) => r.activity_program_status_id || r.id },
    { key: 'customer_name', header: 'Customer Name' },
    { key: 'program_name', header: 'Program Name', className: 'font-medium text-gray-900' },
    { key: 'status', header: 'Status' },
    { key: 'created_on', header: 'Created Date' },
  ];

  const gussetColumns = [
    // { key: 'program_id', header: 'Program ID' },
    { key: 'customer_name', header: 'Customer Name' },
    { key: 'program_name', header: 'Program Name', className: 'font-medium' },
    { key: 'created_on', header: 'Created On' },
  ];

  // ==================== CUSTOM ACTIONS ====================
  const customCartonActions = (row) => (
    <div className="flex gap-2">
      <button
        onClick={() => handleView(row)}
        className="px-4 py-1.5 bg-[#003366] text-white text-sm rounded-md flex items-center gap-2 hover:bg-[#002244]"
      >
        <Eye size={14} /> View
      </button>
    </div>
  );

  const customGussetActions = (row) => (
    <button
      onClick={() => handleGussetView(row)}
      className="px-4 py-1.5 bg-[#003366] text-white text-sm rounded-md flex items-center gap-2 hover:bg-[#002244]"
    >
      <Eye size={14} /> View
    </button>
  );

  const currentData = activeTab === 'carton' ? cartonData : gussetData;
  const currentColumns = activeTab === 'carton' ? cartonColumns : gussetColumns;
  const currentCustomActions = activeTab === 'carton' ? customCartonActions : customGussetActions;

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
          <span className="font-semibold text-[#003366]">My Assigned Activities</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('carton')}
          className={`pb-3 text-base font-medium transition-all border-b-2 ${
            activeTab === 'carton'
              ? 'text-[#003366] border-[#003366]'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Carton Programs
        </button>

        <button
          onClick={() => setActiveTab('gusset')}
          className={`pb-3 text-base font-medium transition-all border-b-2 ${
            activeTab === 'gusset'
              ? 'text-[#003366] border-[#003366]'
              : 'text-gray-500 border-transparent hover:text-gray-700'
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
        onSelectRow={(id) =>
          setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
          )
        }
        onSelectAll={(e) =>
          setSelectedRows(e.target.checked ? currentData.map((r) => r.id || r.program_id) : [])
        }
        actions={[]}                    // No dropdown
        customActions={currentCustomActions}
        getRowStyle={(row, idx) => (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
        emptyMessage={
          activeTab === 'carton'
            ? 'No carton activity found.'
            : 'No gusset programs found.'
        }
        maxHeight="70vh"
      />
    </div>
  );
}

export default CartonMainTTQM;

// import React, { useState, useEffect } from 'react';
// import { Calendar, Copy, PenLine, ChevronRight } from 'lucide-react';
// import api from '../../api/axiosInstance';
// import Table from './Table'; // Shared Table component
// import { useNavigate } from 'react-router-dom'; // ← NEW: for navigation to edit form
// import { Check, X, Eye } from 'lucide-react';


// function CartonMainTTQM() {
//   const navigate = useNavigate(); // ← NEW
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [toast, setToast] = useState(null);
//   const [selectedRows, setSelectedRows] = useState([]);
//   const role = localStorage.getItem('userRole')?.toLowerCase();

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const endpoint =
//         role === 'purchase'
//           ? '/api/purchase/assigned-activities/'
//           : '/api/activities/my-assigned/';


//       const response = await api.get(endpoint);

//       const list = Array.isArray(response.data)
//         ? response.data
//         : response.data?.results || [];

//       const parseDateTime = (dateTime) => {
//         if (!dateTime) return 0;

//         const [datePart, timePart] = dateTime.split(" ");
//         const [day, month, year] = datePart.split("-");

//         return new Date(`${year}-${month}-${day}T${timePart}`).getTime();
//       };

//       const sorted = [...list].sort(
//         (a, b) =>
//           parseDateTime(b.created_on) -
//           parseDateTime(a.created_on) ||
//           b.id - a.id
//       );

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

// const formatDateOnly = (dateTime) => {
//   if (!dateTime) return "-";

//   const [datePart] = dateTime.split(" ");
//   const [day, month, year] = datePart.split("-");

//   return `${day}-${month}-${year}`;
// };


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

//   const handleAccept = async (row) => {
//     try {
//       await api.post('/api/activity-program/accept/', {
//         activity_program_status_id: row.activity_program_status_id,
//       });

//       setToast({ type: 'success', message: `Request ${row.activity_program_status_id} accepted.` });
//       fetchData();
//     } catch (err) {
//       setToast({ type: 'error', message: 'Failed to accept request.' });
//     }
//   };

//   const handleReject = async (row) => {
//     try {
//       await api.post('/api/activity-program/reject/', {
//         activity_program_status_id: row.id,
//       });

//       setToast({ type: 'success', message: `Request ${row.id} rejected.` });
//       fetchData();
//     } catch (err) {
//       setToast({ type: 'error', message: 'Failed to reject request.' });
//     }
//   };

//   const handleView = (row) => {
//     navigate(`/carton/view/${row.activity_program_status_id}`);
//   };


//   // Column config
//   const columns = [
//     { key: 'activity_program_status_id', header: 'ID', render: (row) => row.activity_program_status_id },
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
//       key: 'created_on',
//       header: 'Created Date',
//       className: 'text-gray-500 whitespace-nowrap',
//       render: (row) => (
//         <div className="flex items-center gap-2">
//           <Calendar size={14} className="text-gray-400" />
//           {formatDateOnly(row.created_on) || '-'}
//         </div>
//       ),
//     }
//   ];

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
//         <h1 className="text-2xl font-bold text-gray-900 mb-2">Carton Activity</h1>

//         <div className="flex items-center text-sm text-gray-500 mb-6">
//           <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
//           <ChevronRight size={16} className="mx-2" />
//           <span className="font-semibold text-[#003366] border-b border-[#003366]">
//             Carton Activity
//           </span>
//         </div>


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
//           //   actions={actions}
//           //   customActions={null}
//           actions={[]}   // empty → no dropdown
//           customActions={(row) => (
//             <button
//               onClick={() => handleView(row)}
//               className="px-3 py-1.5 bg-[#003366] text-white text-sm rounded-md flex items-center gap-2 hover:bg-[#002244] cursor-pointer"
//             >
//               <Eye size={14} />
//               View
//             </button>
//           )}
//           getRowStyle={getRowStyle}
//           emptyMessage="No carton activity found."
//           maxHeight="70vh"
//         />

//       </div>
//     </div>
//   );
// }

// export default CartonMainTTQM;
