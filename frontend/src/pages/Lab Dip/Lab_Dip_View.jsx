import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Paperclip, Eye } from 'lucide-react';
import Table from '../Form/Table';
import { toast } from 'react-toastify';

function LabDipView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(null);
  const role = localStorage.getItem('userRole')?.toLowerCase();
  const normalizedStatus = currentStatus
    ?.toLowerCase()
    ?.trim()
    ?.replace(/\s+/g, ' ');

  const [details, setDetails] = useState(null);
  const [samples, setSamples] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [checkingLink, setCheckingLink] = useState(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const isMarketing = role === 'marketing';
  const isTTQM = role === 'ttqm';
  const isPurchase = role === 'purchase';
  const isPPC = role === 'ppc';

  const canApprove = (role === 'ttqm' || role === 'ppc') && normalizedStatus === 'pending';

  const getProgramTypeDisplay = (type) => {
    const typeMap = {
      'TOWEL': 'Towel',
      'BEDSHEET': 'Bedsheet',
      'TERRY_TOWEL': 'Terry Towel',
      'BATH_ROBE': 'Bath Robe',
      'SOLID_TOWEL': 'Solid Towel',
    };
    return typeMap[type] || type;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await api.post(
          `/api/labdip/details/`,
          { labdip_id: id }
        );
        const data = response.data;
        setDetails(data);
        setCurrentStatus(data.status || 'Pending');
        setSamples(data.samples || []);
        setAttachments(data.attachments || []);
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

  const handleAccept = async () => {
    try {
      const endpoint = role === 'ppc' ? '/api/activity-program/accept-ppc/' : '/api/activity-program/accept/';
      await api.post(endpoint, { labdip_id: id });
      setCurrentStatus('In Progress');
      toast.success("Request accepted successfully");
    } catch (err) {
      console.error('Error accepting:', err);
      toast.error('Failed to accept the request');
    }
  };

  const handleSubmitLabDip = async () => {
    try {
      await api.post('/api/labdip/submit-labdip/', { labdip_id: parseInt(id) });
      setCurrentStatus('Labdip Submitted');
      toast.success("Labdip submitted successfully");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Error submitting labdip:', err);
      toast.error('Failed to submit Labdip');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Please enter a reason for rejection');
      return;
    }
    try {
      await api.post('/api/activity-program/reject/', {
        labdip_id: id,
        reason: rejectReason
      });
      setCurrentStatus('Rejected');
      setShowRejectModal(false);
      setRejectReason('');
      toast.success('Request rejected successfully');
    } catch (err) {
      toast.error('Failed to reject the request');
    }
  };

  // ====================== PRODUCT SPECIFIC DETAILS ======================
  const renderProductSpecificDetails = () => {
    if (!details) return null;
    const programType = details.category;

    // TERRY TOWEL (kept for backward compatibility if present)
    if (programType === 'TERRY_TOWEL' && details.terry_details) {
      const terry = details.terry_details;
      return (
        <div className="bg-green-50 p-5 rounded-lg border border-green-100 mt-4">
          <h3 className="text-md font-semibold text-green-900 mb-4">Terry Towel Specific Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem label="Towel Sizes" value={terry.towel_sizes} />
            <DetailItem label="Required Pcs/Carton (Size-wise)" value={terry.required_pcs_carton_size} />
            <DetailItem label="Required Polybags/Carton (Size-wise)" value={terry.required_polybags_carton_size} />
            <DetailItem label="Towel Dimensions" value={terry.towel_dimensions} />
            <DetailItem label="Towel Weight Per Piece" value={terry.towel_weight_per_piece} />
            <DetailItem label="Folding Details" value={terry.folding_details} />
            <DetailItem label="Required Pcs/Polybag" value={terry.required_pcs_per_polybag} />
            <DetailItem label="Special Carton Details" value={terry.special_carton_details} />
          </div>
        </div>
      );
    }

    // RUGS (new field from current API)
    if (programType === 'RUGS' && details.rugs_details) {
      const rugs = details.rugs_details;
      return (
        <div className="bg-amber-50 p-5 rounded-lg border border-amber-100 mt-4">
          <h3 className="text-md font-semibold text-amber-900 mb-4">Rugs Specific Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Add fields as per your backend schema when available */}
            <DetailItem label="Rug Details" value={JSON.stringify(rugs)} />
          </div>
        </div>
      );
    }

    return null;
  };

  const DetailItem = ({ label, value, boolean = false }) => (
    <div>
      <p className="text-sm text-gray-600 capitalize">{label}</p>
      <p className="font-medium text-gray-900">
        {boolean ? (value ? "Yes" : "No") : (value || '-')}
      </p>
    </div>
  );

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
        <button onClick={() => navigate(-1)} className='cursor-pointer px-4 py-2 bg-[#003366] text-white rounded hover:bg-[#002244] transition-colors'>Go Back</button>
      </div>
    );
  }

  const programType = details.category;
  const canSubmitLabDip = role === 'lab' && normalizedStatus === 'in progress';

  return (
    <>
      <div className="h-full flex flex-col max-w-7xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gray-50 p-4 md:p-6 lg:p-8 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => navigate(-1)} className='cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors'>
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Lab Dip – {details.design_name || details.enquiry || 'View'}</h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Type:</span>
                  <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    {getProgramTypeDisplay(programType)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 mt-2 sm:mt-0">
              {canApprove && (
                <div className='flex items-center gap-4'>
                  {role !== 'ppc' && (
                    <button 
                      onClick={() => setShowRejectModal(true)} 
                      className="px-5 py-2 bg-red-50 text-red-600 rounded cursor-pointer border border-red-600 font-semibold hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                  <button 
                    onClick={handleAccept} 
                    className="px-5 py-2 bg-green-50 text-green-600 rounded cursor-pointer border border-green-600 font-semibold hover:bg-green-100 transition-colors"
                  >
                    Accept
                  </button>
                </div>
              )}

              {canSubmitLabDip && (
                <button 
                  onClick={handleSubmitLabDip}
                  className="px-5 py-2 bg-[#003366] text-white rounded cursor-pointer hover:bg-[#002244] transition-colors"
                >
                  Submit LabDip
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Program Information */}
          <div className="bg-white shadow-sm rounded-lg border mb-8">
            <div className="p-5 border-b">
              <h2 className="text-lg font-semibold">Program Information</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem label="Category" value={details.category} />
                <DetailItem label="Customer Name" value={details.customer_name} />
                <DetailItem label="No of Shade" value={details.no_of_shade} />
                <DetailItem label="Enquiry" value={details.enquiry} />
                <DetailItem label="Design Name" value={details.design_name} />
                <DetailItem label="Greige Mat Code" value={details.greige_mat_code} />
                <DetailItem label="Towel Type" value={details.towel_type} />
                <DetailItem label="Yarn Type" value={details.yarn_type} />
                <DetailItem label="Border Type" value={details.border_type} />
                <DetailItem label="Mix & Match" value={details.mix_match} boolean />
                <DetailItem label="Light Source" value={details.light_source} />
                <DetailItem label="Party Protocol Attached" value={details.party_protocol_attached} boolean />
                <DetailItem label="Shade Match With" value={details.shade_match_with} />
                <DetailItem label="Approval" value={details.approval} />
                <DetailItem label="Special Features" value={details.special_features} />
                <DetailItem label="Created On" value={details.created_on} />
              </div>

              {renderProductSpecificDetails()}

            </div>
          </div>

          {/* Shades */}
          {details.shades && details.shades.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg border mb-8">
              <div className="p-3 border-b">
                <h2 className="text-lg font-semibold">Shades</h2>
              </div>
              <div className="p-2 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="text-white bg-[#0f3460]">
                    <tr>
                      <th className="px-4 py-3 text-left">Shade ID</th>
                      <th className="px-4 py-3 text-left">Shade Name</th>
                      <th className="px-4 py-3 text-left">Archroma Name</th>
                      <th className="px-4 py-3 text-left">Pantone Reference</th>
                      <th className="px-4 py-3 text-left">Shade Details</th>
                      <th className="px-4 py-3 text-left">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.shades.map((shade) => (
                      <tr key={shade.shade_id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">{shade.shade_id}</td>
                        <td className="px-4 py-3">{shade.shade_name}</td>
                        <td className="px-4 py-3">{shade.archroma_name || '-'}</td>
                        <td className="px-4 py-3">{shade.pantone_reference || '-'}</td>
                        <td className="px-4 py-3">{shade.shade_details || '-'}</td>
                        <td className="px-4 py-3">{shade.remark || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Samples Table */}
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
                    { label: "GSM", key: "gsm" },
                    { label: "Shade", key: "shade" },
                    { label: "Lbs/Dz", key: "lbs_per_dz" },
                    { label: "Width (In)", key: "width_in" },
                    { label: "Width (Cm)", key: "width_cm" },
                    { label: "Length (In)", key: "length_in" },
                    { label: "Length (Cm)", key: "length_cm" },
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Reject Request</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full border rounded p-2 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 h-[129vh] bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">The attachment link is currently broken or the file is missing (404 Error).</p>
            <button onClick={() => setShowErrorPopup(false)} className="w-full cursor-pointer py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors">Close Notification</button>
          </div>
        </div>
      )}
    </>
  );
}

export default LabDipView;