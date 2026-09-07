
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createArtworkRequest, getProcurementList } from '../../api/artworkApi';

function ArtworkForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    sku_code: '',
    brand_name: '',
    customer_name: '',
    material_code: '',
    po_number: '',
    assigned_vendor_id: '',
    customer_approval_required: false,
    remarks: '',
  });
  const [procurementUsers, setProcurementUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProcurementList()
      .then((res) => setProcurementUsers(res.data))
      .catch(() => setProcurementUsers([]));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.sku_code) {
      toast.error('Title and SKU Code are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        assigned_vendor_id: form.assigned_vendor_id || null,
      };
      const res = await createArtworkRequest(payload);
      toast.success(`Artwork request ${res.data.artwork_id} created.`);
      navigate(`/artwork/${res.data.artwork_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create artwork request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl h-full overflow-y-auto thin-scrollbar">
      <button onClick={() => navigate('/artwork')} className="text-sm text-gray-500 mb-3 hover:underline">
        ← Back to list
      </button>

      <h1 className="text-xl font-semibold text-gray-800 mb-4">New Artwork Request</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input name="title" value={form.title} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code *</label>
            <input name="sku_code" value={form.sku_code} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input name="brand_name" value={form.brand_name} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input name="customer_name" value={form.customer_name} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            {/* <label className="block text-sm font-medium text-gray-700 mb-1">Material Code</label> */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Code</label>
            <input name="material_code" value={form.material_code} onChange={handleChange}
              placeholder="Required before release"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
            <input name="po_number" value={form.po_number} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Procurement (optional)</label>
            <select name="assigned_vendor_id" value={form.assigned_vendor_id} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">-- No procurement contact (assign later) --</option>
              {procurementUsers.map((v) => (
                <option key={v.id} value={v.id}>{v.username}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="customer_approval_required" checked={form.customer_approval_required} onChange={handleChange} />
          Customer approval required
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="bg-[#003366] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#002a52] disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Artwork Request'}
          </button>
          <button type="button" onClick={() => navigate('/artwork')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ArtworkForm;
