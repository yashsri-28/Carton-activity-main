import React, { useState, useEffect } from 'react';
import { ChevronRight, Trash2, RefreshCw, ClipboardList } from 'lucide-react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

function SuperAdminDashboard() {
  const [programs, setPrograms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('programs'); // 'programs' | 'logs'
  const [deletingId, setDeletingId] = useState(null);
  const [confirmRow, setConfirmRow] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // NEW: search/filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'carton' | 'gusset'

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/superadmin/programs/list/');
      setPrograms(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch programs:', err);
      toast.error('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/superadmin/delete-logs/');
      setLogs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      toast.error('Failed to load delete logs');
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchLogs();
  }, []);

  const handleDeleteConfirmed = async (row) => {
    setDeletingId(row.activity_program_status_id);
    try {
      await api.post('/api/superadmin/programs/delete/', {
        activity_program_status_id: row.activity_program_status_id,
      });
      toast.success(`"${row.program_name}" deleted permanently`);
      setConfirmRow(null);
      fetchPrograms();
      fetchLogs();
    } catch (err) {
      console.error('Delete failed:', err);
      const msg = err.response?.data?.error || 'Failed to delete program';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

    const toggleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPrograms.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPrograms.map(p => p.activity_program_status_id));
    }
  };

  const handleBulkDeleteConfirmed = async () => {
    setBulkDeleting(true);
    try {
      // Delete sequentially so one failure doesn't abort the rest
      for (const id of selectedIds) {
        try {
          await api.post('/api/superadmin/programs/delete/', {
            activity_program_status_id: id,
          });
        } catch (err) {
          console.error(`Failed to delete ${id}:`, err);
        }
      }
      toast.success(`${selectedIds.length} program(s) deleted permanently`);
      setSelectedIds([]);
      setConfirmBulk(false);
      fetchPrograms();
      fetchLogs();
    } finally {
      setBulkDeleting(false);
    }
  };
  // NEW: Filtered list based on search term (program name) and type filter
  const filteredPrograms = programs.filter((row) => {
    const matchesSearch = (row.program_name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim());

    const matchesType =
      typeFilter === 'all' ||
      row.program_type_group === typeFilter;

    return matchesSearch && matchesType;
  });
  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('final')) return 'text-green-600';
    if (s.includes('reject')) return 'text-red-600';
    if (s.includes('draft')) return 'text-gray-500';
    return 'text-orange-500';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
          <ChevronRight size={16} className="mx-2" />
          <span className="font-semibold text-[#003366] border-b border-[#003366]">
            Super Admin
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'programs'
                ? 'border-[#003366] text-[#003366]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Programs
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-[#003366] text-[#003366]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList size={16} />
            Delete Logs
          </button>
        </div>
      </div>

      {/* ==================== ALL PROGRAMS TAB ==================== */}
      {activeTab === 'programs' && (
        <div>
          <div className="flex flex-col gap-3 p-2 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                All Carton & Gusset Programs ({filteredPrograms.length} of {programs.length})
                {selectedIds.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    — {selectedIds.length} selected
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setConfirmBulk(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={fetchPrograms}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </div>

            {/* NEW: Search + Type filter row */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by program name..."
                className="flex-1 max-w-sm border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f3460]"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0f3460] cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="carton">Carton</option>
                <option value="gusset">Gusset</option>
              </select>
              {(searchTerm || typeFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setTypeFilter('all'); }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Scrollable table container — fixed max height with vertical scroll,
              and a sticky header so column titles stay visible while scrolling. */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4 overflow-auto" style={{ maxHeight: '65vh' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#0f3460] text-white">
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={filteredPrograms.length > 0 && selectedIds.length === filteredPrograms.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Program Name</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Created By</th>
                  <th className="p-3 text-left">Sent To</th>
                  <th className="p-3 text-left">Created On</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-gray-400">
                      {programs.length === 0 ? 'No programs found.' : 'No programs match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((row) => (
                    <tr key={row.activity_program_status_id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.activity_program_status_id)}
                          onChange={() => toggleSelectRow(row.activity_program_status_id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">{row.activity_program_status_id}</td>
                      <td className="p-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          row.program_type_group === 'gusset'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {row.program_type_group === 'gusset' ? 'Gusset' : 'Carton'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-900">{row.program_name || '-'}</td>
                      <td className="p-3">{row.customer_name || '-'}</td>
                      <td className={`p-3 font-medium ${getStatusStyle(row.status)}`}>{row.status || '-'}</td>
                      <td className="p-3">{row.created_by || '-'}</td>
                      <td className="p-3">{row.sent_to || '-'}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">{row.created_on || '-'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setConfirmRow(row)}
                          disabled={deletingId === row.activity_program_status_id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-md cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== DELETE LOGS TAB ==================== */}
      {activeTab === 'logs' && (
        <div>
          <div className="flex items-center justify-between p-2 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Delete Logs ({logs.length})</h2>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium cursor-pointer"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0f3460] text-white">
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Program ID</th>
                  <th className="p-3 text-left">Program Name</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Deleted By</th>
                  <th className="p-3 text-left">Deleted On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">No delete logs yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          log.program_type === 'GUSSET'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.program_type === 'GUSSET' ? 'Gusset' : 'Carton'}
                        </span>
                      </td>
                      <td className="p-3">{log.program_id}</td>
                      <td className="p-3 font-medium text-gray-900">{log.program_name || '-'}</td>
                      <td className="p-3">{log.customer_name || '-'}</td>
                      <td className="p-3">{log.deleted_by}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">{log.deleted_on}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL (single) ==================== */}
      {confirmRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Permanent Delete</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold">"{confirmRow.program_name}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRow(null)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirmed(confirmRow)}
                disabled={deletingId === confirmRow.activity_program_status_id}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingId === confirmRow.activity_program_status_id && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                )}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BULK DELETE CONFIRMATION MODAL ==================== */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Bulk Delete</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold">{selectedIds.length} program(s)</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmBulk(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirmed}
                disabled={bulkDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {bulkDeleting && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                )}
                Delete {selectedIds.length} Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;