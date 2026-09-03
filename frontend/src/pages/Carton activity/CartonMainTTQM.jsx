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


//   // Fetch list
// //   const fetchData = async () => {
// //     try {
// //       setLoading(true);
// //       // const response = await api.get('/api/activities/my-assigned/');
// //       const endpoint =
// //   role === 'purchase'
// //     ? '/purchase/assigned-activities/'
// //     : '/api/activities/my-assigned/';

// // const response = await api.get(endpoint);

// //       const list = Array.isArray(response.data)
// //         ? response.data
// //         : response.data?.results || [];
// //       setData(list);
// //       setError(null);
// //     } catch (err) {
// //       console.error('Failed to fetch list:', err);
// //       setError('Failed to load data. Please try again.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// const fetchData = async () => {
//   try {
//     setLoading(true);
// const endpoint =
//   role === 'purchase'
//     ? '/api/purchase/assigned-activities/'
//     : '/api/activities/my-assigned/';


//     const response = await api.get(endpoint);

//     const list = Array.isArray(response.data)
//       ? response.data
//       : response.data?.results || [];

//     setData(list);
//     setError(null);
//   } catch (err) {
//     console.error('Failed to fetch list:', err);
//     setError('Failed to load data. Please try again.');
//   } finally {
//     setLoading(false);
//   }
// };


//   useEffect(() => {
//     fetchData();
//   }, []);



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
//           {row.created_on || '-'}
//         </div>
//       ),
//     }
//   ];

// //   const actions = [
// //     {
// //       label: 'Accept',
// //       icon: <Check size={16} />,
// //       onClick: handleAccept,
// //     },
// //     {
// //       label: 'Reject',
// //       icon: <X size={16} />,
// //       onClick: handleReject,
// //     },
// //     {
// //       label: 'View',
// //       icon: <Eye size={16} />,
// //       onClick: handleView,
// //     },
// //   ];




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
//         //   actions={actions}
//         //   customActions={null}
//         actions={[]}   // empty → no dropdown
//   customActions={(row) => (
//     <button
//       onClick={() => handleView(row)}
//       className="px-3 py-1.5 bg-[#003366] text-white text-sm rounded-md flex items-center gap-2 hover:bg-[#002244] cursor-pointer"
//     >
//       <Eye size={14} />
//       View
//     </button>
//   )}
//           getRowStyle={getRowStyle}
//           emptyMessage="No carton activity found."
//           maxHeight="70vh"
//         />

//       </div>
//     </div>
//   );
// }

// export default CartonMainTTQM;



































import React, { useState, useEffect } from 'react';
import { Calendar, Copy, PenLine, ChevronRight } from 'lucide-react';
import api from '../../api/axiosInstance';
import Table from './Table'; // Shared Table component
import { useNavigate } from 'react-router-dom'; // ← NEW: for navigation to edit form
import { Check, X, Eye } from 'lucide-react';


function CartonMainTTQM() {
  const navigate = useNavigate(); // ← NEW
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const role = localStorage.getItem('userRole')?.toLowerCase();

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint =
        role === 'purchase'
          ? '/api/purchase/assigned-activities/'
          : '/api/activities/my-assigned/';


      const response = await api.get(endpoint);

      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      // const parseDateTime = (dateTime) => {
      //   if (!dateTime) return 0;

      //   const [datePart, timePart] = dateTime.split(" ");
      //   const [day, month, year] = datePart.split("-");

      //   return new Date(`${year}-${month}-${day}T${timePart}`).getTime();
      // };
      const parseDateTime = (dateTime) => {
        if (!dateTime) return 0;

        const [datePart, timePart] = dateTime.trim().split(" ");
        const [day, month, year] = datePart.split("-");

        const isoString = `${year}-${month}-${day}T${timePart || "00:00:00"}`;
        const parsed = new Date(isoString).getTime();

        return isNaN(parsed) ? 0 : parsed;
      };

      const sorted = [...list].sort(
        (a, b) =>
          parseDateTime(b.created_on) -
          parseDateTime(a.created_on) ||
          b.id - a.id
      );

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

  const formatDateOnly = (dateTime) => {
    if (!dateTime) return "-";

    const [datePart] = dateTime.split(" ");
    const [day, month, year] = datePart.split("-");

    return `${day}-${month}-${year}`;
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

  const handleAccept = async (row) => {
    try {
      await api.post('/api/activity-program/accept/', {
        activity_program_status_id: row.activity_program_status_id,
      });

      setToast({ type: 'success', message: `Request ${row.activity_program_status_id} accepted.` });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to accept request.' });
    }
  };

  const handleReject = async (row) => {
    try {
      await api.post('/api/activity-program/reject/', {
        activity_program_status_id: row.id,
      });

      setToast({ type: 'success', message: `Request ${row.id} rejected.` });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to reject request.' });
    }
  };

  const handleView = (row) => {
    if (row.program_type_group === 'gusset') {
      navigate(`/gusset/view/${row.activity_program_status_id}`);
    } else {
      navigate(`/carton/view/${row.activity_program_status_id}`);
    }
  };


  // Column config
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
      key: 'program_type_group',
      header: 'Type',
      render: (row) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          row.program_type_group === 'gusset'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {row.program_type_group === 'gusset' ? 'Gusset' : 'Carton'}
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
          {formatDateOnly(row.created_on) || '-'}
        </div>
      ),
    }
  ];

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carton Activity</h1>

        <div className="flex items-center text-sm text-gray-500 mb-6">
          <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
          <ChevronRight size={16} className="mx-2" />
          <span className="font-semibold text-[#003366] border-b border-[#003366]">
            Carton Activity
          </span>
        </div>


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

export default CartonMainTTQM;
