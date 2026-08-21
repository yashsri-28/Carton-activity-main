import React, { useEffect, useState, useRef } from 'react';
import DOMPurify from 'dompurify';
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
  getProcurementList,
  assignProcurement,
  exportArtworkExcel,
} from '../../api/artworkApi';


// Excel/Word paste normally carries its colors/borders as CSS CLASSES
// defined in a <style> block (e.g. ".xl65{background:#4472C4}"), not
// as inline styles on each cell. Since we strip <style> tags for
// security, we first "bake" those class rules directly into each
// cell's inline style attribute — so the formatting survives even
// after the <style> block and class names are removed.
function normalizeExcelPaste(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const classRules = {};
    doc.querySelectorAll('style').forEach((styleTag) => {
      const cssText = styleTag.textContent || '';
      const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
      let match;
      while ((match = ruleRegex.exec(cssText)) !== null) {
        const selectors = match[1].split(',').map((s) => s.trim());
        const declarations = match[2].trim();
        selectors.forEach((sel) => {
          if (sel.startsWith('.')) {
            const className = sel.slice(1);
            classRules[className] = (classRules[className] || '') + declarations + ';';
          }
        });
      }
    });

    doc.querySelectorAll('[class]').forEach((el) => {
      const classes = el.getAttribute('class').split(/\s+/);
      let extraStyle = '';
      classes.forEach((c) => {
        if (classRules[c]) extraStyle += classRules[c];
      });
      if (extraStyle) {
        el.setAttribute('style', (el.getAttribute('style') || '') + ';' + extraStyle);
      }
      el.removeAttribute('class');
    });

    doc.querySelectorAll('style, head, meta, link, xml').forEach((el) => el.remove());

    return doc.body.innerHTML;
  } catch (err) {
    return html;
  }
}

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
  const commentInputRef = useRef(null);

  // FR008 — packaging specification review

  const [packagingSpec, setPackagingSpec] = useState(null);

  // Collapsible "Full Approval History" section — collapsed by default
  const [showHistory, setShowHistory] = useState(false);

  const [procurementUsers, setProcurementUsers] = useState([]);
  const [selectedProcurementId, setSelectedProcurementId] = useState('');
  const [assigningProcurement, setAssigningProcurement] = useState(false);

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
    getProcurementList().then((res) => setProcurementUsers(res.data)).catch(() => setProcurementUsers([]));
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
  const el = commentInputRef.current;
  const plainText = el ? el.innerText.trim() : '';
  if (!plainText && !commentAttachment) return;

  // Capture the pasted content AS HTML (so Excel's table structure,
  // colors, borders survive) — sanitized to strip anything unsafe.
  const rawHtml = el ? el.innerHTML : '';
  const cleanHtml = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['style'] });

  setCommentBusy(true);
  try {
    await addArtworkComment(artworkId, cleanHtml, commentAttachment);
    if (el) el.innerHTML = '';
    setCommentAttachment(null);
    fetchComments();
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to post comment.');
  } finally {
    setCommentBusy(false);
  }
};

const handleCommentPaste = (e) => {
  e.preventDefault();
  const html = e.clipboardData.getData('text/html');
  const text = e.clipboardData.getData('text/plain');

  if (html) {
    const normalized = normalizeExcelPaste(html);
    const clean = DOMPurify.sanitize(normalized, { ADD_ATTR: ['style'] });
    document.execCommand('insertHTML', false, clean);
  } else {
    document.execCommand('insertText', false, text);
  }
};
  const handleAssignProcurement = async () => {
    if (!selectedProcurementId) { toast.error('Choose a procurement contact first.'); return; }
    setAssigningProcurement(true);
    try {
      await assignProcurement(artworkId, selectedProcurementId);
      toast.success('Procurement contact assigned.');
      setSelectedProcurementId('');
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign.');
    } finally {
      setAssigningProcurement(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await exportArtworkExcel(artworkId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${artwork.artwork_id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export Excel file.');
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="text-xs font-medium border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1"
          >
            ⬇ Download Excel
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {STATUS_LABELS[artwork.status] || artwork.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        SKU: {artwork.sku_code} · Brand: {artwork.brand_name || '-'} · Customer: {artwork.customer_name || '-'}
      </p>
    
    {/* Missing-assignment recovery — if no procurement contact was
          picked at creation time, this lets Marketing/Admin fix it
          later without ever needing a manual SQL update. */}
      {!artwork.assigned_vendor && ['marketing', 'admin'].includes(role) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-5">
          <h2 className="font-medium text-amber-800 mb-1">⚠️ No Procurement Contact Assigned</h2>
          <p className="text-xs text-amber-700 mb-3">
            This artwork has no procurement contact yet, so no one can upload a design.
            Assign one now to move it forward.
          </p>
          <div className="flex gap-2">
            <select
              value={selectedProcurementId}
              onChange={(e) => setSelectedProcurementId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">-- Select procurement contact --</option>
              {procurementUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            <button
              onClick={handleAssignProcurement}
              disabled={assigningProcurement}
              className="bg-[#003366] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#002a52] disabled:opacity-50"
            >
              {assigningProcurement ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      )}

     


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
              rows={6}
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
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <span className="font-medium text-gray-800">{c.author}</span>
                <div className="flex items-center gap-1">
                  {c.author_role && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-[#003366] text-white rounded-full px-2 py-0.5">
                      {c.author_role}
                    </span>
                  )}
                  {c.version_number && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">
                      for v{c.version_number}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-400">{new Date(c.created_on).toLocaleString()}</span>
              {/* {c.message && <p className="text-gray-700 mt-1">{c.message}</p>} */}
              {/* {c.message && (
                <p className="text-gray-700 mt-1 whitespace-pre-wrap font-mono text-xs bg-gray-50 rounded p-2 border border-gray-100">
                  {c.message}
                </p>
              )} */}

              {c.message && (
                <div
                  className="mt-1 text-sm text-gray-700 overflow-x-auto [&_table]:border [&_table]:border-collapse [&_table]:my-1 [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-300 [&_th]:px-2 [&_th]:py-1"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.message, { ADD_ATTR: ['style'] }) }}
                />
              )}
              {c.attachment_url && (
                <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-[#003366] text-xs hover:underline mt-1 inline-block">
                  📎 View attachment
                </a>
              )}
            </div>
          ))}
        </div>


        <div className="space-y-2">
          {/* <textarea
            placeholder="Ask a question, leave feedback, or add a reference remark..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={6}
          /> */}
          {/* <div
            ref={commentInputRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Ask a question, leave feedback, or paste an Excel table here — its rows, columns and colors will be preserved..."
            className="w-full min-h-[150px] max-h-80 overflow-y-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          /> */}

          <div
            ref={commentInputRef}
            contentEditable
            suppressContentEditableWarning
            onPaste={handleCommentPaste}
            data-placeholder="Ask a question, leave feedback, or paste an Excel table here — its rows, columns and colors will be preserved..."
            className="w-full min-h-[150px] max-h-80 overflow-y-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex items-center gap-2">
            <input
              type="file"
              onChange={(e) => setCommentAttachment(e.target.files[0])}
              className="text-xs flex-1"
            />
            <button
              onClick={handleAddComment}
              // disabled={commentBusy || (!newComment.trim() && !commentAttachment)}
              disabled={commentBusy}
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
