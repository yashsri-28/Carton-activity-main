import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { listArtworkRequests } from '../../api/artworkApi';
const STATUS_LABELS = {
  VENDOR_UPLOAD_PENDING: 'PROCUREMENT UPLOAD PENDING',
  VENDOR_UPLOADED: 'PROCUREMENT UPLOADED',
};
const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700',
  VENDOR_UPLOAD_PENDING: 'bg-yellow-100 text-yellow-800',
  MARKETING_REVIEW: 'bg-blue-100 text-blue-800',
  PPC_REVIEW: 'bg-blue-100 text-blue-800',
  TQM_REVIEW: 'bg-blue-100 text-blue-800',
  CUSTOMER_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  RELEASED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-200 text-gray-600',
  OBSOLETE: 'bg-gray-200 text-gray-600',
};

function ArtworkList({ role }) {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ artwork_id: '', sku_code: '', brand_name: '', status: '' });
  const navigate = useNavigate();

  const fetchArtworks = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await listArtworkRequests(params);
      setArtworks(res.data);
    } catch (err) {
      toast.error('Failed to load artwork requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArtworks(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canCreate = role === 'marketing';

  return (
    <div className="p-6 h-full overflow-y-auto thin-scrollbar">
      {/* <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Packaging Artwork Management</h1>
        {canCreate && (
          <button
            onClick={() => navigate('/artwork/new')}
            className="bg-[#003366] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#002a52]"
          >
            + New Artwork Request
          </button>
        )}
      </div> */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Packaging Artwork Management</h1>
        {canCreate && (
          <div className="flex gap-2">
            {/* <button
              onClick={() => navigate('/artwork/new')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              + Quick Request
            </button> */}
            <button
              onClick={() => navigate('/artwork/new-spec')}
              className="bg-[#003366] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#002a52]"
            >
              + New Packaging Spec Request
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-4">
         <input
          placeholder="Artwork ID"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={filters.artwork_id}
          onChange={(e) => setFilters({ ...filters, artwork_id: e.target.value })}
        />
        <input
          placeholder="SKU Code"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={filters.sku_code}
          onChange={(e) => setFilters({ ...filters, sku_code: e.target.value })}
        />
        <input
          placeholder="Brand"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={filters.brand_name}
          onChange={(e) => setFilters({ ...filters, brand_name: e.target.value })}
        />
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      <button
        onClick={fetchArtworks}
        className="bg-[#003366] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#002a52] flex items-center gap-1.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search
      </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Artwork ID</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">Loading...</td></tr>
            )}
            {!loading && artworks.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">No artwork requests found.</td></tr>
            )}
            {!loading && artworks.map((a) => (
              <tr
                key={a.artwork_id}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/artwork/${a.artwork_id}`)}
              >
                <td className="px-4 py-3 font-medium text-[#003366]">{a.artwork_id}</td>
                <td className="px-4 py-3">{a.title}</td>
                <td className="px-4 py-3">{a.sku_code}</td>
                <td className="px-4 py-3">{a.brand_name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100'}`}>
                   {STATUS_LABELS[a.status] || a.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(a.created_on).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ArtworkList;