import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getArtworkDetails,
  uploadArtworkVersion,
  actOnArtworkApproval,
  releaseArtwork,
} from '../../api/artworkApi';

// Which role is allowed to act on which approval stage — mirrors
// ArtworkApproval.STAGE_ROLE_MAP on the backend.
const STAGE_ROLE_MAP = { MARKETING: 'marketing', PACKAGING: 'ppc', TQM: 'ttqm', CUSTOMER: 'admin' };

function ArtworkDetails({ role }) {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await getArtworkDetails(artworkId);
      setArtwork(res.data);
    } catch (err) {
      toast.error('Failed to load artwork.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [artworkId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async () => {
    if (!file) { toast.error('Choose a file first.'); return; }
    setBusy(true);
    try {
      await uploadArtworkVersion(artworkId, file);
      toast.success('New version uploaded.');
      setFile(null);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (decision) => {
    setBusy(true);
    try {
      await actOnArtworkApproval(artworkId, decision, comments);
      toast.success(`Stage ${decision.toLowerCase()}.`);
      setComments('');
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async () => {
    setBusy(true);
    try {
      await releaseArtwork(artworkId);
      toast.success('Artwork released for production.');
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Release failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!artwork) return <div className="p-6 text-gray-400">Artwork not found.</div>;

  const pendingStage = artwork.approvals?.find((a) => a.decision === 'PENDING');
  const canActOnPending = pendingStage && STAGE_ROLE_MAP[pendingStage.stage] === role;
  const canUpload = ['marketing', 'admin'].includes(role) && !['APPROVED', 'RELEASED', 'ARCHIVED', 'OBSOLETE'].includes(artwork.status);
  const canRelease = artwork.status === 'APPROVED' && ['ppc', 'admin'].includes(role);

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate('/artwork')} className="text-sm text-gray-500 mb-3 hover:underline">
        ← Back to list
      </button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-800">{artwork.artwork_id} — {artwork.title}</h1>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {artwork.status.replace(/_/g, ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        SKU: {artwork.sku_code} · Brand: {artwork.brand_name || '-'} · Customer: {artwork.customer_name || '-'}
      </p>

      {/* Versions */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="font-medium text-gray-800 mb-3">Versions</h2>
        {artwork.versions.length === 0 && <p className="text-sm text-gray-400">No versions uploaded yet.</p>}
        <ul className="space-y-2">
          {artwork.versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
              <span>
                v{v.version_number} — {v.uploaded_by} — {new Date(v.uploaded_on).toLocaleString()}
                {v.is_locked && <span className="ml-2 text-xs text-green-700">(locked / approved)</span>}
              </span>
              <a href={v.file_url} target="_blank" rel="noreferrer" className="text-[#003366] hover:underline">
                View
              </a>
            </li>
          ))}
        </ul>

        {canUpload && (
          <div className="mt-4 flex items-center gap-3">
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
            <button onClick={handleUpload} disabled={busy}
              className="bg-[#003366] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#002a52] disabled:opacity-50">
              Upload Version
            </button>
          </div>
        )}
      </div>

      {/* Approval trail */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="font-medium text-gray-800 mb-3">Approval Workflow</h2>
        <ul className="space-y-2">
          {artwork.approvals.map((a) => (
            <li key={a.stage} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
              <span>{a.stage}</span>
              <span className={
                a.decision === 'APPROVED' ? 'text-green-700' :
                a.decision === 'REJECTED' ? 'text-red-700' : 'text-gray-400'
              }>
                {a.decision}{a.acted_by ? ` — ${a.acted_by}` : ''}
              </span>
            </li>
          ))}
        </ul>

        {canActOnPending && (
          <div className="mt-4 space-y-2">
            <textarea
              placeholder="Comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <button onClick={() => handleDecision('APPROVED')} disabled={busy}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700 disabled:opacity-50">
                Approve
              </button>
              <button onClick={() => handleDecision('REJECTED')} disabled={busy}
                className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 disabled:opacity-50">
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {canRelease && (
        <button onClick={handleRelease} disabled={busy}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
          Release for Production
        </button>
      )}
    </div>
  );
}

export default ArtworkDetails;