




import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Paperclip, Eye } from 'lucide-react';
import Table from '../Form/Table';

function CartonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(null);

  const role = localStorage.getItem('userRole')?.toLowerCase();
const normalizedStatus = currentStatus
  ?.toLowerCase()
  ?.trim()
  ?.replace(/\s+/g, ' ');
  const [details, setDetails] = useState(null);
  const [calculationMode, setCalculationMode] = useState(false);

  const [subprograms, setSubprograms] = useState([]);
  const [samples, setSamples] = useState([]);
  const [attachments, setAttachments] = useState([]); // NEW: Store attachments

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestSample, setRequestSample] = useState(false);
const [requestCartonSizing, setRequestCartonSizing] = useState(false);

  const [checkingLink, setCheckingLink] = useState(null); // Stores ID of link being checked
const [showErrorPopup, setShowErrorPopup] = useState(false); // For customized notification

  // ================= FETCH DETAILS =================
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        const response = await api.post(
          `/api/carton-program/details/`,
          { activity_program_status_id: id }
        );

        const data = response.data;

        
        
        setDetails(data);
        setCurrentStatus(data.status);
        
        console.log(data , " -- data");
        console.log(data.status , " data.status");

        // Initialize subprograms with existing values or empty strings
        setSubprograms(
          (data.subprograms || []).map(sp => ({
            ...sp,
            carton_length: sp.carton_length || '',
            carton_width: sp.carton_width || '',
            carton_height: sp.carton_height || '',
            ribbon: sp.ribbon || '',
            belly_band: sp.belly_band || '',
            remark: sp.remark || ''
          }))
        );

        setSamples(data.samples || []);
        setAttachments(data.attachments || []); // NEW: Set attachments
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

  // ================= ROLE + STATUS FLAGS =================
  const isMarketing = role === 'marketing';
  const isTTQM = role === 'ttqm';
const isPurchase = role === 'purchase';

  const canApprove = role === 'ttqm' && normalizedStatus === 'pending';
  const canStartCalculation = role === 'ttqm' && (normalizedStatus === 'in progress' || normalizedStatus === 'tentative working submitted');

  const isCalculationActive = calculationMode;
  const isFinalized = currentStatus === 'Final';
  
  // Check if any subprogram has calculation data
  const hasCalculationData = subprograms.some(sp => 
    sp.carton_length || sp.carton_width || sp.carton_height || sp.ribbon || sp.belly_band || sp.remark
  );


  const handleAttachmentClick = async (attachment, index) => {
  const fileUrl = attachment.file_url;
  const attachmentId = attachment.id || index;

  if (!fileUrl) return;

  setCheckingLink(attachmentId);

  try {
    // We use a 'HEAD' request to check if the file exists without downloading it
    const response = await fetch(fileUrl, { method: 'HEAD' });

    if (response.ok) {
      // URL is working (Status 200-299)
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      // URL exists but returns 404 or other error
      setShowErrorPopup(true);
    }
  } catch (err) {
    // Network error or CORS issue
    setShowErrorPopup(true);
  } finally {
    setCheckingLink(null);
  }
};


  // ================= ACTION HANDLERS =================
  const handleAccept = async () => {
    try {
      await api.post('/api/activity-program/accept/', {
        activity_program_status_id: id,
      });

      setCurrentStatus('In Progress');
    } catch (err) {
      console.error('Error accepting:', err);
      alert('Failed to accept the request');
    }
  };

  const handleReject = async () => {
    try {
      await api.post('/api/activity-program/reject/', {
        activity_program_status_id: id,
      });

      setCurrentStatus('Reject');
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Failed to reject the request');
    }
  };

  const handleSubmitTentative = async () => {
    try {
      // Validate that all required fields are filled
      const hasEmptyFields = subprograms.some(sp => 
        !sp.carton_length || !sp.carton_width || !sp.carton_height
      );

      if (hasEmptyFields) {
        alert('Please fill in all carton dimensions (Length, Width, Height) for all programs');
        return;
      }

      // Transform subprograms data to match backend payload structure
      const payload = {
        activity_program_status_id: parseInt(id),
        btn: "tentative_submit",
        purchase_sent_to : 6,
        request_sample: requestSample,
request_carton_sizing: requestCartonSizing,

        subprograms: subprograms.map(sp => ({
          subprogram_id: sp.subprogram_id,
          carton_length: parseFloat(sp.carton_length) || 0,
          carton_width: parseFloat(sp.carton_width) || 0,
          carton_height: parseFloat(sp.carton_height) || 0,
          ribbon: parseFloat(sp.ribbon) || 0,
          belly_band: sp.belly_band || '',
          remark: sp.remark || ''
        }))
      };

      await api.post('/api/subprogram/tqm-update/', payload);

      setCurrentStatus('Tentative Working Submitted');
      setCalculationMode(false);
      alert('Tentative calculation submitted successfully');
    } catch (err) {
      console.error('Error submitting tentative:', err);
      alert('Failed to submit tentative calculation');
    }
    setRequestSample(false);
setRequestCartonSizing(false);

  };

  const handleSubmitFinal = async () => {
    try {
      // Validate that all required fields are filled
      const hasEmptyFields = subprograms.some(sp => 
        !sp.carton_length || !sp.carton_width || !sp.carton_height
      );

      if (hasEmptyFields) {
        alert('Please fill in all carton dimensions (Length, Width, Height) for all programs');
        return;
      }

      const payload = {
        activity_program_status_id: parseInt(id),
        btn: "final_submit",
        purchase_sent_to : 6,
        request_sample: requestSample,
request_carton_sizing: requestCartonSizing,
        subprograms: subprograms.map(sp => ({
          subprogram_id: sp.subprogram_id,
          carton_length: parseFloat(sp.carton_length) || 0,
          carton_width: parseFloat(sp.carton_width) || 0,
          carton_height: parseFloat(sp.carton_height) || 0,
          ribbon: parseFloat(sp.ribbon) || 0,
          belly_band: sp.belly_band || '',
          remark: sp.remark || ''
        }))
      };

      await api.post('/api/subprogram/tqm-update/', payload);

      setCurrentStatus('Final Working Submitted');
      setCalculationMode(false);
      alert('Final calculation submitted successfully');
    } catch (err) {
      console.error('Error submitting final:', err);
      alert('Failed to submit final calculation');
    }
    setRequestSample(false);
setRequestCartonSizing(false);

  };

  const updateCalculationField = (index, field, value) => {
    setSubprograms(prev =>
      prev.map((sp, i) =>
        i === index ? { ...sp, [field]: value } : sp
      )
    );
  };

  const handlePurchaseAccept = async () => {
  try {
    await api.post('/api/purchase/accept-request/', {
      activity_program_status_id: id,
    });

    setCurrentStatus('In Progress');
    alert('Request accepted');
    window.location.reload()
  } catch (err) {
    console.error(err);
    alert('Failed to accept request');
  }
};


 const handleSubmitCompletion = async () => {
  try {
    await api.post('/api/purchase/submit-completion/', {
      activity_program_status_id: id,
    });

    setCurrentStatus('Final Submitted');
    alert('Completion submitted successfully');
  } catch (err) {
    console.error(err);
    alert('Failed to submit completion');
  }
};


  // NEW: Function to open attachment
  const openAttachment = (fileUrl) => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  // ================= LOADING / ERROR =================
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
        <button onClick={() => navigate(-1)} className='cursor-pointer'>Go Back</button>
      </div>
    );
  }

  const { carton_program } = details;


  return (
    <>
      {/* <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"> */}
      <div className="h-full flex flex-col max-w-7xl mx-auto">


      <div className="sticky top-0 z-20 bg-gray-50 p-4 md:p-6 lg:p-8 border-b">

        {/* ================= HEADER ================= */}
        <div className=" flex flex-col sm:flex-row justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => navigate(-1)} className='cursor-pointer'>
                <ArrowLeft size={20} />
              </button>

              <h1 className="text-2xl font-bold">
                Carton Program – {carton_program?.program_name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold">Status:</span>
              <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 capitalize">
                {currentStatus}
              </span>
            </div>
          </div>

          {/* <div className="flex gap-3"> */}
          <div className="flex flex-col items-end gap-3 mt-2 sm:mt-0">

            {canApprove && (
              <>
               <div className='flex items-center gap-4'>
                 <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-5 py-2 bg-red-50 text-red-600 rounded cursor-pointer border border-red-600 font-semibold"
                >
                  Reject
                </button>

                <button
                  onClick={handleAccept}
                  className="px-5 py-2 bg-green-50 text-green-600 rounded cursor-pointer border border-green-600 font-semibold"
                >
                  Accept
                </button>
               </div>
              </>
            )}

{isPurchase && (
  normalizedStatus === 'tentative working submitted' ||
  normalizedStatus === 'final working submitted'
) && (
  <button
    onClick={handlePurchaseAccept}
    className="px-5 py-2 bg-blue-50 text-blue-600 rounded cursor-pointer"
  >
    Accept Request
  </button>
)}



            {canStartCalculation && !calculationMode && (
              <button
                onClick={() => setCalculationMode(true)}
                className="px-5 py-2 bg-[#003366] text-white rounded cursor-pointer"
              >
                {hasCalculationData ? 'Update Calculation' : 'Submit Calculation'}
              </button>
              
            )}
            {calculationMode && (
  <div className="flex items-center gap-6 mt-2">
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={requestSample}
        onChange={(e) => setRequestSample(e.target.checked)}
        className="w-4 h-4"
      />
      Request Sample
    </label>

    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={requestCartonSizing}
        onChange={(e) => setRequestCartonSizing(e.target.checked)}
        className="w-4 h-4"
      />
      Request Carton Sizing
    </label>
  </div>
)}

          </div>
        </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">

        {/* ================= PROGRAM INFO ================= */}
        <div className="bg-white shadow-sm rounded-lg border mb-8">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold">Program Information</h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {Object.entries(carton_program || {}).map(([key, value]) => {
    if (key === 'program_name') return null;
    const label = key.replace(/_/g, ' ');
    return (
      <div key={key}>
        <p className="text-sm text-gray-500 capitalize">{label}</p>
        <p className="font-medium">{value || '-'}</p>
      </div>
    );
  })}

  {/* ATTACHMENT SECTION */}
  <div className="md:col-span-2 lg:col-span-3">
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>

      {(!attachments || attachments.length === 0) ? (
        <p className="text-sm text-gray-400 italic">No attachments available</p>
      ) : (
        <>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer border
                    ${noUrl 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100'}`}
                >
                  {isChecking ? (
                    <div className="animate-spin h-3 w-3 border-2 border-blue-700 border-t-transparent rounded-full" />
                  ) : (
                    <Paperclip size={14} />
                  )}
                  
                  <span className="text-sm font-medium">
                    {noUrl ? "No Link" : `View Attachment ${attachments.length > 1 ? index + 1 : ''}`}
                  </span>
                  {!noUrl && <Eye size={14} />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
          </p>
        </>
      )}
    </div>
  </div>
</div>
        </div>

        {/* ================= PROGRAM Specifications ================= */}
        <div className="bg-white shadow-sm rounded-lg border mb-8">
          <div className="p-3 border-b">
            <h2 className="text-lg font-semibold">Program Specifications</h2>
          </div>

          <div className="p-0">
            <div className="overflow-x-auto">
              {/* <table className="min-w-[800px] w-full border-collapse">
                <thead className="bg-[#0f3460] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Program</th>
                    <th className="px-4 py-3 text-left">Style</th>
                    <th className="px-4 py-3 text-left">Size</th>
                    <th className="px-4 py-3 text-left">GSM</th>
                    <th className="px-4 py-3 text-left">Units/Carton</th>
                    <th className="px-4 py-3 text-left">Fold</th>

                    {(isCalculationActive || hasCalculationData) && (
                      <>
                        <th className="px-4 py-3 text-left">L (cm)</th>
                        <th className="px-4 py-3 text-left">W (cm)</th>
                        <th className="px-4 py-3 text-left">H (cm)</th>
                        <th className="px-4 py-3 text-left">Ribbon</th>
                        <th className="px-4 py-3 text-left">Belly Band</th>
                        <th className="px-4 py-3 text-left">Remark</th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {subprograms.map((sp, index) => (
                    <tr key={index} className="border-t text-sm">
                      <td className="px-3 py-3">{sp.program_name}</td>
                      <td className="px-3 py-3">{sp.style}</td>
                      <td className="px-3 py-3">
                        {sp.width_in} × {sp.length_in}
                      </td>
                      <td className="px-3 py-3">{sp.gsm}</td>
                      <td className="px-3 py-3">{sp.unit_per_carton}</td>
                      <td className="px-3 py-3">{sp.fold}</td>

                      {(isCalculationActive || hasCalculationData) && (
                        <>
                          <td className="px-4 py-3">
                            {isCalculationActive ? (
                              <input
                                type="number"
                                value={sp.carton_length}
                                onChange={(e) =>
                                  updateCalculationField(index, 'carton_length', e.target.value)
                                }
                                className="border px-2 py-1 rounded w-20"
                                placeholder="0"
                                step="0.01"
                              />
                            ) : (
                              <span>{sp.carton_length || '-'}</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isCalculationActive ? (
                              <input
                                type="number"
                                value={sp.carton_width}
                                onChange={(e) =>
                                  updateCalculationField(index, 'carton_width', e.target.value)
                                }
                                className="border px-2 py-1 rounded w-20"
                                placeholder="0"
                                step="0.01"
                              />
                            ) : (
                              <span>{sp.carton_width || '-'}</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isCalculationActive ? (
                              <input
                                type="number"
                                value={sp.carton_height}
                                onChange={(e) =>
                                  updateCalculationField(index, 'carton_height', e.target.value)
                                }
                                className="border px-2 py-1 rounded w-20"
                                placeholder="0"
                                step="0.01"
                              />
                            ) : (
                              <span>{sp.carton_height || '-'}</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isCalculationActive ? (
                              <input
                                type="number"
                                value={sp.ribbon}
                                onChange={(e) =>
                                  updateCalculationField(index, 'ribbon', e.target.value)
                                }
                                className="border px-2 py-1 rounded w-24"
                                placeholder="0"
                                step="0.01"
                              />
                            ) : (
                              <span>{sp.ribbon || '-'}</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isCalculationActive ? (
                              <input
                                type="text"
                                value={sp.belly_band}
                                onChange={(e) =>
                                  updateCalculationField(index, 'belly_band', e.target.value)
                                }
                                className="border px-2 py-1 rounded w-24"
                                placeholder="Yes/No"
                              />
                            ) : (
                              <span>{sp.belly_band || '-'}</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isCalculationActive ? (
                              <input
                                type="text"
                                value={sp.remark}
                                onChange={(e) =>
                                  updateCalculationField(index, 'remark', e.target.value)
                                }
                                className="border px-2 py-1 rounded w-32"
                                placeholder="Optional"
                              />
                            ) : (
                              <span>{sp.remark || '-'}</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table> */}
              <Table
  title="Program Specifications"
  headers={[
    { label: "Program", key: "program_name" },
    { label: "Style", key: "style" },
    { label: "W-In", key: "width_in" },
    { label: "L-In", key: "length_in" },
    { label: "GSM", key: "gsm" },
    { label: "Unit/Carton", key: "unit_per_carton" },
    { label: "Fold", key: "fold" }
  ]}
  data={subprograms}
  type="flat"
  readOnly={!calculationMode}
  onUpdateCell={(rowIdx, _, field, value) => {
    updateCalculationField(rowIdx, field, value);
  }}
/>
            </div>
          </div>
        </div>

        {/* ================= SAMPLES ================= */}
        <div className="bg-white shadow-sm rounded-lg border mb-8">
          <div className="p-3 border-b">
            <h2 className="text-lg font-semibold">Samples</h2>
          </div>

          <div className="p-0 overflow-x-auto">
            {/* <table className="min-w-full">
              <thead className="bg-[#0f3460] text-white">
                <tr>
                  <th className="px-3 py-3 text-left">Program</th>
                  <th className="px-3 py-3 text-left">Size</th>
                  <th className="px-3 py-3 text-left">Quality</th>
                  <th className="px-3 py-3 text-left">GSM</th>
                  <th className="px-3 py-3 text-left">Shade</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample, index) => (
                  <tr key={index} className="border-t text-sm">
                    <td className="px-4 py-3">{sample.program_name}</td>
                    <td className="px-4 py-3">{sample.size}</td>
                    <td className="px-4 py-3">{sample.quality}</td>
                    <td className="px-4 py-3">{sample.gsm}</td>
                    <td className="px-4 py-3">{sample.shade}</td>
                  </tr>
                ))}
              </tbody>
            </table> */}
            

<Table
  title="Sample Specifications"
  headers={[
    { label: "Program", key: "program_name" },
    { label: "Size", key: "size" },
    { label: "Quality", key: "quality" },
    { label: "GSM", key: "gsm" },
    { label: "Shade", key: "shade" }
  ]}
  data={samples}
  type="flat"
  readOnly={true}
/>

          </div>
        </div>
        

        {/* ================= ACTION PANEL ================= */}
        {calculationMode && (
          <div className="flex justify-end gap-4 mb-4 border-t pt-6">
            <button
              onClick={handleSubmitTentative}
              className="px-6 py-2 bg-[#0f3460] hover:bg-[#0a2545] text-white rounded cursor-pointer"
            >
              Submit Tentative
            </button>

            <button
              onClick={handleSubmitFinal}
              className="px-6 py-2 bg-[#0f3460] hover:bg-[#0a2545] text-white rounded cursor-pointer"
            >
              Submit Final
            </button>
          </div>
        )}

{isPurchase && normalizedStatus === 'sample request accepted' && (
  <div className="flex justify-end mt-10 border-t pt-6">
    <button
      onClick={handleSubmitCompletion}
      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
    >
      Submit Completion
    </button>
  </div>
)}


</div>
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Reject Request</h3>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full border rounded p-2 mb-4"
              rows={4}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border rounded cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    alert('Please enter a reason for rejection');
                    return;
                  }

                  try {
                    await api.post('/api/activity-program/reject/', {
                      activity_program_status_id: id,
                      reason: rejectReason,
                    });

                    setCurrentStatus('rejected');
                    setShowRejectModal(false);
                    setRejectReason('');
                    alert('Request rejected successfully');
                  } catch (err) {
                    console.error('Error rejecting:', err);
                    alert('Failed to reject the request');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}









      {/* CUSTOMIZED POPUP NOTIFICATION */}
{showErrorPopup && (
  <div className="fixed inset-0 h-[129vh] bg-black/50 flex items-center justify-center z-[9999] p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in duration-200">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl font-bold">!</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6">
        The attachment link is currently broken or the file is missing (404 Error). Please try again later.
      </p>
      <button
        onClick={() => setShowErrorPopup(false)}
        className="w-full cursor-pointer py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors"
      >
        Close Notification
      </button>
    </div>
  </div>
)}
    </>
  );
}

export default CartonView;
