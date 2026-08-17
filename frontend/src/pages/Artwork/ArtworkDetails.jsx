
// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import {
//   getArtworkDetails,
//   uploadArtworkVersion,
//   actOnArtworkApproval,
//   releaseArtwork,
//   getArtworkComments,
//   addArtworkComment,
//   getPackagingSpec,
// } from '../../api/artworkApi';

// // Which role is allowed to act on which approval stage — mirrors
// // ArtworkApproval.STAGE_ROLE_MAP on the backend.
// const STAGE_ROLE_MAP = { MARKETING: 'marketing', PPC: 'ppc', TQM: 'ttqm', CUSTOMER: 'admin' };
// const STATUS_LABELS = {
//   VENDOR_UPLOAD_PENDING: 'PROCUREMENT UPLOAD PENDING',
//   VENDOR_UPLOADED: 'PROCUREMENT UPLOADED',
// };
// function ArtworkDetails({ role }) {
//   const { artworkId } = useParams();
//   const navigate = useNavigate();
//   const [artwork, setArtwork] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [file, setFile] = useState(null);
//   const [comments, setComments] = useState('');
//   const [busy, setBusy] = useState(false);

//   // FR006/FR028 — comments & reference-attachment thread
//   const [commentList, setCommentList] = useState([]);
//   const [newComment, setNewComment] = useState('');
//   const [commentAttachment, setCommentAttachment] = useState(null);
//   const [commentBusy, setCommentBusy] = useState(false);

//   // FR008 — packaging specification review
//   const [packagingSpec, setPackagingSpec] = useState(null);

//   const fetchDetails = async () => {
//     setLoading(true);
//     try {
//       const res = await getArtworkDetails(artworkId);
//       setArtwork(res.data);
//     } catch (err) {
//       toast.error('Failed to load artwork.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchComments = async () => {
//     try {
//       const res = await getArtworkComments(artworkId);
//       setCommentList(res.data);
//     } catch (err) {
//       // silent — comments are secondary, don't block the page on failure
//     }
//   };

//   const fetchPackagingSpec = async () => {
//     try {
//       const res = await getPackagingSpec(artworkId);
//       setPackagingSpec(res.data);
//     } catch (err) {
//       // 404 is normal — this artwork was created via "Quick Request"
//       // without a packaging spec, so just show nothing.
//       setPackagingSpec(null);
//     }
//   };

//   useEffect(() => {
//     fetchDetails();
//     fetchComments();
//     fetchPackagingSpec();
//   }, [artworkId]); // eslint-disable-line react-hooks/exhaustive-deps

//   const handleUpload = async () => {
//     if (!file) { toast.error('Choose a file first.'); return; }
//     setBusy(true);
//     try {
//       await uploadArtworkVersion(artworkId, file);
//       toast.success('New version uploaded.');
//       setFile(null);
//       fetchDetails();
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Upload failed.');
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDecision = async (decision) => {
//     setBusy(true);
//     try {
//       await actOnArtworkApproval(artworkId, decision, comments);
//       toast.success(`Stage ${decision.toLowerCase()}.`);
//       setComments('');
//       fetchDetails();
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Action failed.');
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleRelease = async () => {
//     setBusy(true);
//     try {
//       await releaseArtwork(artworkId);
//       toast.success('Artwork released for production.');
//       fetchDetails();
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Release failed.');
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleAddComment = async () => {
//     if (!newComment.trim() && !commentAttachment) return;
//     setCommentBusy(true);
//     try {
//       await addArtworkComment(artworkId, newComment.trim(), commentAttachment);
//       setNewComment('');
//       setCommentAttachment(null);
//       fetchComments();
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Failed to post comment.');
//     } finally {
//       setCommentBusy(false);
//     }
//   };

//   if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
//   if (!artwork) return <div className="p-6 text-gray-400">Artwork not found.</div>;

// // Approve/Reject buttons should ONLY appear while the artwork is
//   // actually in an active review status — never after a rejection
//   // (even though PPC/TQM's rows technically still say "PENDING",
//   // the cycle already stopped at the stage that rejected).
//   const ACTIVE_REVIEW_STATUSES = ['MARKETING_REVIEW', 'PPC_REVIEW', 'TQM_REVIEW', 'CUSTOMER_REVIEW'];
//   const pendingStage = ACTIVE_REVIEW_STATUSES.includes(artwork.status)
//     ? artwork.approvals?.find((a) => a.decision === 'PENDING')
//     : null;
//   const canActOnPending = pendingStage && STAGE_ROLE_MAP[pendingStage.stage] === role;
//   const canUpload = ['procurement', 'admin'].includes(role) && !['APPROVED', 'RELEASED', 'ARCHIVED', 'OBSOLETE'].includes(artwork.status);
//   const canRelease = artwork.status === 'APPROVED' && ['ppc', 'admin'].includes(role);

//   return (
//     <div className="p-6 max-w-3xl h-full overflow-y-auto thin-scrollbar">
//       <button onClick={() => navigate('/artwork')} className="text-sm text-gray-500 mb-3 hover:underline">
//         ← Back to list
//       </button>

//       <div className="flex items-center justify-between mb-1">
//         <h1 className="text-xl font-semibold text-gray-800">{artwork.artwork_id} — {artwork.title}</h1>
//         <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//          {STATUS_LABELS[artwork.status] || artwork.status.replace(/_/g, ' ')}
//         </span>
//       </div>
//       <p className="text-sm text-gray-500 mb-6">
//         SKU: {artwork.sku_code} · Brand: {artwork.brand_name || '-'} · Customer: {artwork.customer_name || '-'}
//       </p>

//       {/* FR008 — Packaging Specification review */}
//       {packagingSpec && (
//         <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
//           <h2 className="font-medium text-gray-800 mb-1">Packaging Specification</h2>
//           <p className="text-xs text-gray-400 mb-3">Category: {packagingSpec.category}</p>
//           <table className="w-full text-sm">
//             <tbody>
//               {Object.entries(packagingSpec.spec_data).map(([label, val]) => (
//                 val ? (
//                   <tr key={label} className="border-b border-gray-100">
//                     <td className="py-2 pr-4 font-medium text-gray-600 w-1/3">{label}</td>
//                     <td className="py-2 text-gray-800">{val}</td>
//                   </tr>
//                 ) : null
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Versions */}
//       <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
//         <h2 className="font-medium text-gray-800 mb-3">Versions</h2>
//         {artwork.versions.length === 0 && <p className="text-sm text-gray-400">No versions uploaded yet.</p>}
//         <ul className="space-y-2">
//           {artwork.versions.map((v) => (
//             <li key={v.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
//               <span>
//                 v{v.version_number} — {v.uploaded_by} — {new Date(v.uploaded_on).toLocaleString()}
//                 {v.is_locked && <span className="ml-2 text-xs text-green-700">(locked / approved)</span>}
//               </span>
//               <a href={`${import.meta.env.VITE_API_BASE_URL}${v.file_url}`} target="_blank" rel="noreferrer" className="text-[#003366] hover:underline">
//                 View
//               </a>
//             </li>
//           ))}
//         </ul>

//         {canUpload && (
//           <div className="mt-4 flex items-center gap-3">
//             <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
//             <button onClick={handleUpload} disabled={busy}
//               className="bg-[#003366] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#002a52] disabled:opacity-50">
//               Upload Version
//             </button>
//           </div>
//         )}
//       </div>

  
//         {/* Current Approval Workflow (active version only) */}
//       <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
//         <h2 className="font-medium text-gray-800 mb-3">Approval Workflow</h2>
//         <ul className="space-y-2">
//           {(() => {
//             // If a stage was rejected, every LATER stage never actually
//             // got reviewed — show them as "Not Reached" instead of the
//             // misleading "PENDING" (which implies still-active).
//             const rejectedStage = artwork.approvals.find((a) => a.decision === 'REJECTED');
//             return artwork.approvals.map((a) => {
//               const isSkipped = rejectedStage && a.sequence > rejectedStage.sequence && a.decision === 'PENDING';
//               const displayDecision = isSkipped ? 'NOT REACHED' : a.decision;
//               return (
//                 <li key={a.stage} className="text-sm border-b border-gray-100 pb-2">
//                   <div className="flex items-center justify-between">
//                     <span className={isSkipped ? 'text-gray-400' : ''}>{a.stage}</span>
//                     <span className={
//                       a.decision === 'APPROVED' ? 'text-green-700' :
//                       a.decision === 'REJECTED' ? 'text-red-700' :
//                       isSkipped ? 'text-gray-300' : 'text-gray-400'
//                     }>
//                       {displayDecision}{a.acted_by ? ` — ${a.acted_by}` : ''}
//                     </span>
//                   </div>
//                   {a.comments && (
//                     <p className="text-xs text-gray-500 mt-1">"{a.comments}"</p>
//                   )}
//                 </li>
//               );
//             });
//           })()}
//         </ul>

//         {canActOnPending && (
//           <div className="mt-4 space-y-2">
//             <textarea
//               placeholder="Comments / reason (optional, required for reject)"
//               value={comments}
//               onChange={(e) => setComments(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
//               rows={2}
//             />
//             <div className="flex gap-2">
//               <button onClick={() => handleDecision('APPROVED')} disabled={busy}
//                 className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700 disabled:opacity-50">
//                 Approve
//               </button>
//               <button onClick={() => handleDecision('REJECTED')} disabled={busy}
//                 className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 disabled:opacity-50">
//                 Reject
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Full history across ALL versions — every reject/re-upload cycle */}
//       {artwork.approval_history && artwork.approval_history.length > 0 && (
//         <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
//           <h2 className="font-medium text-gray-800 mb-3">Full Approval History (all versions)</h2>
//           <ul className="space-y-2">
//             {artwork.approval_history.map((h, i) => (
//               <li key={i} className="text-sm border-b border-gray-100 pb-2">
//                 <div className="flex items-center justify-between">
//                   <span className="text-gray-600">v{h.version_number} — {h.stage}</span>
//                   <span className={
//                     h.decision === 'APPROVED' ? 'text-green-700' :
//                     h.decision === 'REJECTED' ? 'text-red-700' : 'text-gray-400'
//                   }>
//                     {h.decision}{h.acted_by ? ` — ${h.acted_by}` : ''}
//                   </span>
//                 </div>
//                 {h.comments && <p className="text-xs text-gray-500 mt-1">"{h.comments}"</p>}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* FR006, FR028 — Comments / reference attachments (all roles) */}
//       <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
//         <h2 className="font-medium text-gray-800 mb-3">Comments &amp; Reference Attachments</h2>

//         {commentList.length === 0 && (
//           <p className="text-sm text-gray-400 mb-3">No comments yet.</p>
//         )}

//         <ul className="space-y-3 mb-4">
//           {commentList.map((c) => (
//             <li key={c.id} className="text-sm bg-gray-50 rounded-md p-3">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="font-medium text-gray-800">
//                   {c.author} <span className="text-gray-400 font-normal">({c.author_role})</span>
//                 </span>
//                 <span className="text-xs text-gray-400">{new Date(c.created_on).toLocaleString()}</span>
//               </div>
//               {c.message && <p className="text-gray-700">{c.message}</p>}
//               {c.attachment_url && (
//                 <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-[#003366] text-xs hover:underline mt-1 inline-block">
//                   📎 View attachment
//                 </a>
//               )}
//             </li>
//           ))}
//         </ul>

//         <div className="space-y-2">
//           <textarea
//             placeholder="Ask a question, leave feedback, or add a reference remark..."
//             value={newComment}
//             onChange={(e) => setNewComment(e.target.value)}
//             className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
//             rows={2}
//           />
//           <div className="flex items-center gap-2">
//             <input
//               type="file"
//               onChange={(e) => setCommentAttachment(e.target.files[0])}
//               className="text-xs flex-1"
//             />
//             <button
//               onClick={handleAddComment}
//               disabled={commentBusy || (!newComment.trim() && !commentAttachment)}
//               className="bg-[#003366] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#002a52] disabled:opacity-50"
//             >
//               Send
//             </button>
//           </div>
//         </div>
//       </div>

//       {canRelease && (
//         <button onClick={handleRelease} disabled={busy}
//           className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
//           Release for Production
//         </button>
//       )}
//     </div>
//   );
// }

// export default ArtworkDetails;


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getArtworkDetails,
  uploadArtworkVersion,
  actOnArtworkApproval,
  releaseArtwork,
  getArtworkComments,
  addArtworkComment,
  getPackagingSpec,
} from '../../api/artworkApi';

// Which role is allowed to act on which approval stage — mirrors
// ArtworkApproval.STAGE_ROLE_MAP on the backend.
const STAGE_ROLE_MAP = { MARKETING: 'marketing', PPC: 'ppc', TQM: 'ttqm', CUSTOMER: 'admin' };
const STATUS_LABELS = {
  VENDOR_UPLOAD_PENDING: 'PROCUREMENT UPLOAD PENDING',
  VENDOR_UPLOADED: 'PROCUREMENT UPLOADED',
};

function ArtworkDetails({ role }) {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);

  // FR006/FR028 — comments & reference-attachment thread
  const [commentList, setCommentList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentAttachment, setCommentAttachment] = useState(null);
  const [commentBusy, setCommentBusy] = useState(false);

  // FR008 — packaging specification review

  const [packagingSpec, setPackagingSpec] = useState(null);

  // Collapsible "Full Approval History" section — collapsed by default
  const [showHistory, setShowHistory] = useState(false);

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

  const fetchComments = async () => {
    try {
      const res = await getArtworkComments(artworkId);
      setCommentList(res.data);
    } catch (err) {
      // silent — comments are secondary, don't block the page on failure
    }
  };

  const fetchPackagingSpec = async () => {
    try {
      const res = await getPackagingSpec(artworkId);
      setPackagingSpec(res.data);
    } catch (err) {
      // 404 is normal — this artwork was created via "Quick Request"
      // without a packaging spec, so just show nothing.
      setPackagingSpec(null);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchComments();
    fetchPackagingSpec();
  }, [artworkId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleAddComment = async () => {
    if (!newComment.trim() && !commentAttachment) return;
    setCommentBusy(true);
    try {
      await addArtworkComment(artworkId, newComment.trim(), commentAttachment);
      setNewComment('');
      setCommentAttachment(null);
      fetchComments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment.');
    } finally {
      setCommentBusy(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!artwork) return <div className="p-6 text-gray-400">Artwork not found.</div>;

  // Approve/Reject buttons should ONLY appear while the artwork is
  // actually in an active review status — never after a rejection
  // (even though PPC/TQM's rows technically still say "PENDING",
  // the cycle already stopped at the stage that rejected).
  const ACTIVE_REVIEW_STATUSES = ['MARKETING_REVIEW', 'PPC_REVIEW', 'TQM_REVIEW', 'CUSTOMER_REVIEW'];
  const pendingStage = ACTIVE_REVIEW_STATUSES.includes(artwork.status)
    ? artwork.approvals?.find((a) => a.decision === 'PENDING')
    : null;
  const canActOnPending = pendingStage && STAGE_ROLE_MAP[pendingStage.stage] === role;
  const canUpload = ['procurement', 'admin'].includes(role) && !['APPROVED', 'RELEASED', 'ARCHIVED', 'OBSOLETE'].includes(artwork.status);
  const canRelease = artwork.status === 'APPROVED' && ['ppc', 'admin'].includes(role);

  const rejectedStage = artwork.approvals.find((a) => a.decision === 'REJECTED');

  return (
    <div className="p-6 w-full h-full overflow-y-auto thin-scrollbar">
      <button onClick={() => navigate('/artwork')} className="text-sm text-gray-500 mb-3 hover:underline">
        ← Back to list
      </button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-800">{artwork.artwork_id} — {artwork.title}</h1>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {STATUS_LABELS[artwork.status] || artwork.status.replace(/_/g, ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        SKU: {artwork.sku_code} · Brand: {artwork.brand_name || '-'} · Customer: {artwork.customer_name || '-'}
      </p>

      {/* FR008 — Packaging Specification review (full-width horizontal grid) */}
      {packagingSpec && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
          <h2 className="font-medium text-gray-800 mb-1">Packaging Specification</h2>
          <p className="text-xs text-gray-400 mb-3">Category: {packagingSpec.category}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(packagingSpec.spec_data).map(([label, val]) => (
              val ? (
                <div key={label} className="border border-gray-200 rounded-md p-2 bg-gray-50">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate" title={label}>
                    {label}
                  </p>
                  <p className="text-sm text-gray-800 truncate" title={val}>{val}</p>
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Versions */}
{/* Versions */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="font-medium text-gray-800 mb-3">Versions</h2>
        {artwork.versions.length === 0 && <p className="text-sm text-gray-400">No versions uploaded yet.</p>}
        <ul className="space-y-2">
          {artwork.versions.map((v) => {
            // Figure out this version's overall outcome from the full
            // history — was IT the version that got rejected, approved,
            // or is it still under review?
            const versionEntries = (artwork.approval_history || []).filter(
              (h) => h.version_number === v.version_number
            );
            const wasRejected = versionEntries.some((h) => h.decision === 'REJECTED');
            let versionBadge = null;
            if (wasRejected) {
              versionBadge = <span className="ml-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">REJECTED</span>;
            } else if (v.is_locked) {
              versionBadge = <span className="ml-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">APPROVED</span>;
            } else if (v.is_active_version) {
              versionBadge = <span className="ml-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">IN REVIEW</span>;
            }

            return (
              <li key={v.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <span className="flex items-center flex-wrap">
                  v{v.version_number} — {v.uploaded_by} — {new Date(v.uploaded_on).toLocaleString()}
                  {versionBadge}
                </span>
                <a href={`${import.meta.env.VITE_API_BASE_URL}${v.file_url}`} target="_blank" rel="noreferrer" className="text-[#003366] hover:underline">
                  View
                </a>
              </li>
            );
          })}
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

      {/* Current Approval Workflow (active version only) — horizontal cards, full width */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="font-medium text-gray-800 mb-3">Approval Workflow</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {artwork.approvals.map((a) => {
            const isSkipped = rejectedStage && a.sequence > rejectedStage.sequence && a.decision === 'PENDING';
            const displayDecision = isSkipped ? 'NOT REACHED' : a.decision;
            const bgClass =
              a.decision === 'APPROVED' ? 'bg-green-50 border-green-200' :
              a.decision === 'REJECTED' ? 'bg-red-50 border-red-200' :
              isSkipped ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200';
            const textClass =
              a.decision === 'APPROVED' ? 'text-green-700' :
              a.decision === 'REJECTED' ? 'text-red-700' :
              isSkipped ? 'text-gray-400' : 'text-blue-700';
            return (
              <div key={a.stage} className={`border rounded-md p-3 ${bgClass}`}>
                <p className="text-xs font-semibold text-gray-600 uppercase">{a.stage}</p>
                <p className={`text-sm font-medium ${textClass}`}>{displayDecision}</p>
                {a.acted_by && <p className="text-xs text-gray-500 mt-1">— {a.acted_by}</p>}
                {a.comments && <p className="text-xs text-gray-500 mt-1 italic">"{a.comments}"</p>}
              </div>
            );
          })}
        </div>

        {canActOnPending && (
          <div className="mt-4 space-y-2">
            <textarea
              placeholder="Comments / reason (optional, required for reject)"
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

      {/* Full history across ALL versions — every reject/re-upload cycle */}

      {artwork.approval_history && artwork.approval_history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg mb-5 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50"
          >
            <h2 className="font-medium text-gray-800">
              Full Approval History (all versions)
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {artwork.approval_history.length} {artwork.approval_history.length === 1 ? 'entry' : 'entries'}
              </span>
            </h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHistory && (
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {artwork.approval_history.map((h, i) => (
                  <div key={i} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-600">v{h.version_number} — {h.stage}</p>
                    <p className={
                      h.decision === 'APPROVED' ? 'text-sm text-green-700' :
                      h.decision === 'REJECTED' ? 'text-sm text-red-700' : 'text-sm text-gray-400'
                    }>
                      {h.decision}{h.acted_by ? ` — ${h.acted_by}` : ''}
                    </p>
                    {h.comments && <p className="text-xs text-gray-500 mt-1 italic">"{h.comments}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FR006, FR028 — Comments / reference attachments (all roles) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="font-medium text-gray-800 mb-3">Comments &amp; Reference Attachments</h2>

        {commentList.length === 0 && (
          <p className="text-sm text-gray-400 mb-3">No comments yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {commentList.map((c) => (
            <div key={c.id} className="text-sm bg-gray-50 rounded-md p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800">
                  {c.author} <span className="text-gray-400 font-normal">({c.author_role})</span>
                </span>
              </div>
              <span className="text-xs text-gray-400">{new Date(c.created_on).toLocaleString()}</span>
              {c.message && <p className="text-gray-700 mt-1">{c.message}</p>}
              {c.attachment_url && (
                <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-[#003366] text-xs hover:underline mt-1 inline-block">
                  📎 View attachment
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <textarea
            placeholder="Ask a question, leave feedback, or add a reference remark..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <input
              type="file"
              onChange={(e) => setCommentAttachment(e.target.files[0])}
              className="text-xs flex-1"
            />
            <button
              onClick={handleAddComment}
              disabled={commentBusy || (!newComment.trim() && !commentAttachment)}
              className="bg-[#003366] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#002a52] disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
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
