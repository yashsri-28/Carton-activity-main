import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Paperclip, Eye, CheckCircle, XCircle, Calendar } from 'lucide-react';
import Table from '../Form/Table';
import { toast } from 'react-toastify';

function GussetView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('userRole') || '';
  const role = userRole.toLowerCase();
  const isTTQM = role === 'ttqm';
  const isMarketing = role === 'marketing';

  const [details, setDetails] = useState(null);
  const normalizedStatus = details?.status?.toLowerCase()?.trim();
  const canApprove = (role === 'ttqm' || role === 'ppc') && normalizedStatus === 'pending';
  const [subprograms, setSubprograms] = useState([]);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [samples, setSamples] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingLink, setCheckingLink] = useState(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  // Reject Popup States
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);

  // Expected Date States
  const [expectedDate, setExpectedDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);

  // ==================== FETCH GUSSET DETAILS ====================
  // NOTE: `id` here is the activity_program_status_id (same id scheme
  // used by CartonView), not the raw GussetProgram id.
  const [gussetProgramId, setGussetProgramId] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await api.post('/api/gusset-program/details/', {
          activity_program_status_id: id,
        });
        const data = response.data;

        setDetails(data);
        setGussetProgramId(data.program_id);
        setSubprograms(data.program_specifications || []);
        setSamples(data.samples || []);
        setAttachments(data.attachments || []);

        if (data.expected_date_program) {
          setExpectedDate(data.expected_date_program);
        } else {
          setExpectedDate('');
        }

        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  // ==================== SAVE EXPECTED DATE (Only for TTQM) ====================
  const handleSaveExpectedDate = async () => {
    if (!expectedDate) {
      toast.error('Please select a date');
      return;
    }

    setSavingDate(true);
    try {
      await api.post('/api/gusset-program/edit/', {
        program_id: gussetProgramId,
        expected_date_confirmation: expectedDate,
      });

      toast.success('Expected Confirmation Date updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update expected date. Please try again.');
    } finally {
      setSavingDate(false);
    }
  };


    // ==================== SPEC ROW EDIT HANDLERS (TTQM/PPC only) ====================
  const handleSpecFieldChange = (specId, field, value) => {
    setSubprograms(prev =>
      prev.map(sp => (sp.spec_id === specId ? { ...sp, [field]: value } : sp))
    );
  };

  const handleSaveSpecs = async () => {
    setSavingSpecs(true);
    try {
      await api.post('/api/gusset-program/specs/update/', {
        specs: subprograms.map(sp => ({
          spec_id: sp.spec_id,
          size: sp.size,
          fold_length: sp.fold_length,
          fold_width: sp.fold_width,
          gusset_name: sp.gusset_name,
          wt: sp.wt !== '' ? sp.wt : null,
          gsm: sp.gsm !== '' ? sp.gsm : null,
        }))
      });
      toast.success('Specifications updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update specifications.');
    } finally {
      setSavingSpecs(false);
    }
  };

  // ==================== ACCEPT & REJECT HANDLERS ====================
  // Use the SAME generic pipeline endpoints that CartonView uses — these
  // work on ActivityProgramStatus regardless of whether it points to a
  // CartonProgram or a GussetProgram.
  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const endpoint = role === 'ppc'
        ? '/api/activity-program/accept-ppc/'
        : '/api/activity-program/accept/';
      await api.post(endpoint, {
        activity_program_status_id: parseInt(id),
      });
      toast.success('Program Accepted Successfully!');
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      toast.error('Failed to accept the program.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a reason for rejection.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/api/activity-program/reject/', {
        activity_program_status_id: parseInt(id),
        reason: rejectionReason.trim(),
      });
      toast.success('Program Rejected Successfully!');
      setShowRejectPopup(false);
      setRejectionReason('');
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      toast.error('Failed to reject the program.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    setSubmittingFinal(true);
    try {
      await api.post('/api/gusset-program/submit-final/', {
        activity_program_status_id: parseInt(id),
      });
      toast.success('Gusset Program marked as Final Working Submitted!');
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit final';
      toast.error(msg);
    } finally {
      setSubmittingFinal(false);
    }
  };

  // ==================== ATTACHMENT HANDLER ====================
  const handleAttachmentClick = async (attachment, index) => {
    const fileUrl = attachment.file_url;
    const attachmentId = attachment.id || index;
    if (!fileUrl) return;

    setCheckingLink(attachmentId);
    try {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      if (response.ok) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        setShowErrorPopup(true);
      }
    } catch (err) {
      setShowErrorPopup(true);
    } finally {
      setCheckingLink(null);
    }
  };

  const gsmLabel = details?.tc ? 'TC' : 'GSM';

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error || 'Not found'}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[#003366] text-white rounded hover:bg-[#002244]">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col max-w-8xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gray-50 p-4 md:p-6 lg:p-8 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="hover:bg-gray-100 p-2 rounded transition-colors">
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold">Gusset Program – {details.program_name}</h1>
            </div>

            {/* Action Buttons - visible to TTQM/PPC only while status is Pending */}
            {canApprove && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRejectPopup(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-2.5 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  <XCircle size={18} />
                  Reject
                </button>

                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  <CheckCircle size={18} />
                  Accept
                </button>
              </div>
            )}

            {/* Submit Final button - visible to TTQM only while status is In Progress */}
            {isTTQM && normalizedStatus === 'in progress' && (
              <button
                onClick={handleSubmitFinal}
                disabled={submittingFinal}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                <CheckCircle size={18} />
                {submittingFinal ? 'Submitting...' : 'Submit Final'}
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Program Information */}
          <div className="bg-white shadow-sm rounded-lg border mb-8">
            <div className="p-5 border-b">
              <h2 className="text-lg font-semibold">Gusset Program Information</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{details.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Program Name</p>
                  <p className="font-medium">{details.program_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">TC</p>
                  <p className="font-medium">{details.tc || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weave</p>
                  <p className="font-medium">{details.weave || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product Group</p>
                  <p className="font-medium">{details.product_group || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Size</p>
                  <p className="font-medium">
                    {details.size === "Other" ? details.other_size : details.size || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fold Length x Fold Width</p>
                  <p className="font-medium">
                    {details.fold_length && details.fold_width
                      ? `${details.fold_length} x ${details.fold_width}`
                      : (details.fold_length || details.fold_width || '-')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gusset Bank</p>
                  <p className="font-medium">{details.gusset_bank || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference Program</p>
                  <p className="font-medium">{details.reference_program || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Comments</p>
                  <p className="font-medium">{details.comments || '-'}</p>
                </div>
              </div>

              {/* Cardboard Stiffener Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Cardboard Stiffener</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Cardboard Required</p>
                    <p className="font-medium">{details.cardboard_required ? "Yes" : "No"}</p>
                  </div>
                  {details.cardboard_required && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Fold Type</p>
                        <p className="font-medium">{details.fold_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ply</p>
                        <p className="font-medium">{details.ply || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fold on Side</p>
                        <p className="font-medium">{details.fold_on_side || '-'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Polybag Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Polybag</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Polybag Required</p>
                    <p className="font-medium">{details.polybag_required ? "Yes" : "No"}</p>
                  </div>
                  {details.polybag_required && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Material Type</p>
                        <p className="font-medium">{details.material_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Opening Type</p>
                        <p className="font-medium">{details.opening_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Opening on Side</p>
                        <p className="font-medium">{details.opening_on_side || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Inlay / Belly Band</p>
                        <p className="font-medium">{details.inlay_or_belly_band || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Polybag Type</p>
                        <p className="font-medium">{details.polybag_type || '-'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Expected Date + Attachments - Different UI based on Role */}
              <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* ==================== EXPECTED DATE SECTION ==================== */}
               

                {/* Attachments Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Attachments</h3>
                  {(!attachments || attachments.length === 0) ? (
                    <p className="text-sm text-gray-400 italic">No attachments available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment, index) => {
                        const attachmentId = attachment.id || index;
                        const isChecking = checkingLink === attachmentId;
                        const noUrl = !attachment.file_url;

                        return (
                          <button
                            key={attachmentId}
                            disabled={isChecking || noUrl}
                            onClick={() => handleAttachmentClick(attachment, index)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer border ${
                              noUrl
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100'
                            }`}
                          >
                            {isChecking ? (
                              <div className="animate-spin h-3 w-3 border-2 border-blue-700 border-t-transparent rounded-full" />
                            ) : (
                              <Paperclip size={14} />
                            )}
                            <span className="text-sm font-medium">
                              {noUrl ? 'No Link' : `View Attachment ${attachments.length > 1 ? index + 1 : ''}`}
                            </span>
                            {!noUrl && <Eye size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Program Specifications — editable by TTQM/PPC only */}
          {subprograms && subprograms.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg border mb-8">
              <div className="p-3 border-b">
                <h2 className="text-lg font-semibold">Program Specifications</h2>
              </div>
              <div className="p-2 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="text-white">
                    <tr>
                      <th className="px-4 py-3 text-left bg-[#0f3460]">Size</th>
                      <th className="px-4 py-3 text-left bg-[#0f3460]">Fold Length</th>
                      <th className="px-4 py-3 text-left bg-[#0f3460]">Fold Width</th>
                      <th className="px-4 py-3 text-left bg-[#0f3460]">Gusset</th>
                      <th className="px-4 py-3 text-left bg-[#0f3460]">WT</th>
                      <th className="px-4 py-3 text-left bg-[#0f3460]">GSM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subprograms.map((sp) => (
                      <tr key={sp.spec_id} className="border-t">
                        <td className="px-4 py-2">
                          {(role === 'ttqm' || role === 'ppc') ? (
                            <input
                              type="text"
                              value={sp.size ?? ''}
                              onChange={(e) => handleSpecFieldChange(sp.spec_id, 'size', e.target.value)}
                              className="border px-2 py-1 rounded w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (sp.size ?? "-")}
                        </td>
                        <td className="px-4 py-2">
                          {(role === 'ttqm' || role === 'ppc') ? (
                            <input
                              type="number"
                              value={sp.fold_length ?? ''}
                              onChange={(e) => handleSpecFieldChange(sp.spec_id, 'fold_length', e.target.value)}
                              className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (sp.fold_length ?? "-")}
                        </td>
                        <td className="px-4 py-2">
                          {(role === 'ttqm' || role === 'ppc') ? (
                            <input
                              type="number"
                              value={sp.fold_width ?? ''}
                              onChange={(e) => handleSpecFieldChange(sp.spec_id, 'fold_width', e.target.value)}
                              className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (sp.fold_width ?? "-")}
                        </td>
                        <td className="px-4 py-2">
                          {(role === 'ttqm' || role === 'ppc') ? (
                            <input
                              type="text"
                              value={sp.gusset_name ?? ''}
                              onChange={(e) => handleSpecFieldChange(sp.spec_id, 'gusset_name', e.target.value)}
                              className="border px-2 py-1 rounded w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (sp.gusset_name ?? "-")}
                        </td>
                        <td className="px-4 py-2">
                          {(role === 'ttqm' || role === 'ppc') ? (
                            <input
                              type="number"
                              value={sp.wt ?? ''}
                              onChange={(e) => handleSpecFieldChange(sp.spec_id, 'wt', e.target.value)}
                              className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (sp.wt ?? "-")}
                        </td>
                        <td className="px-4 py-2">
                          {(role === 'ttqm' || role === 'ppc') ? (
                            <input
                              type="number"
                              value={sp.gsm ?? ''}
                              onChange={(e) => handleSpecFieldChange(sp.spec_id, 'gsm', e.target.value)}
                              className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (sp.gsm ?? "-")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(role === 'ttqm' || role === 'ppc') && (
                  <div className="flex justify-end p-3">
                    <button
                      onClick={handleSaveSpecs}
                      disabled={savingSpecs}
                      className="px-6 py-2 bg-[#0f3460] hover:bg-[#0a2545] text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {savingSpecs ? 'Saving...' : 'Save Specifications'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {samples && samples.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg border mb-8">
              <div className="p-2 overflow-x-auto">
                <Table
                  title="Sample Specifications"
                  headers={[
                    { label: "Program", key: "program_name" },
                    { label: "Sample", key: "sample" },
                    { label: "Size", key: "size" },
                    { label: "Quality", key: "quality" },
                    { label: gsmLabel, key: "gsm" },
                    { label: "Shade", key: "shade" },
                    { label: "Lbs/Dz", key: "lbs_per_dz" },
                    { label: "Width (In)", key: "width_in" },
                    { label: "Width (Cm)", key: "width_cm" },
                    { label: "Length (In)", key: "length_in" },
                    { label: "Length (Cm)", key: "length_cm" },
                    { label: "Attachment", key: "attachments", type: "attachment_list" },
                  ]}
                  data={samples}
                  type="flat"
                  readOnly={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Popup - Only for TTQM */}
      {showRejectPopup && isTTQM && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Reject Request</h2>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
              rows={5}
              className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-red-500 resize-y min-h-[120px]"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowRejectPopup(false); setRejectionReason(''); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 h-[129vh] bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">The attachment link is currently broken or the file is missing (404 Error).</p>
            <button
              onClick={() => setShowErrorPopup(false)}
              className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium"
            >
              Close Notification
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default GussetView;