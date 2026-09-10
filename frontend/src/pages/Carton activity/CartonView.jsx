// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../../api/axiosInstance';
// import { ArrowLeft, Paperclip, Eye } from 'lucide-react';
// import Table from '../Form/Table';
// import CartonCalculationResults from './CartonCalculationResults';
// import { toast } from 'react-toastify';

// function CartonView() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [currentStatus, setCurrentStatus] = useState(null);
//   const role = localStorage.getItem('userRole')?.toLowerCase();
//   const normalizedStatus = currentStatus
//     ?.toLowerCase()
//     ?.trim()
//     ?.replace(/\s+/g, ' ');

//   const [details, setDetails] = useState(null);
//   const [calculationMode, setCalculationMode] = useState(false);
//   const [subprograms, setSubprograms] = useState([]);
//   const [samples, setSamples] = useState([]);
//   const [attachments, setAttachments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showRejectModal, setShowRejectModal] = useState(false);
//   const [rejectReason, setRejectReason] = useState('');
//   const [requestSample, setRequestSample] = useState(false);
//   const [requestCartonSizing, setRequestCartonSizing] = useState(false);
//   const [checkingLink, setCheckingLink] = useState(null);
//   const [showErrorPopup, setShowErrorPopup] = useState(false);

//   const isMarketing = role === 'marketing';
//   const isTTQM = role === 'ttqm';
//   const isPurchase = role === 'purchase';
//   const isPPC = role === 'ppc';

//   const canApprove = (role === 'ttqm' || role === 'ppc') && normalizedStatus === 'pending';
//   const canStartCalculation = role === 'ttqm' && (normalizedStatus === 'in progress' || normalizedStatus === 'tentative working submitted');
//   const isCalculationActive = calculationMode;

//   const hasCalculationData = subprograms.some(sp =>
//     sp.carton_length || sp.carton_width || sp.carton_height || sp.ribbon || sp.belly_band || sp.remark
//   );
//   const hasPdqData = subprograms.some(sp =>
//     sp.pdq_length || sp.pdq_width || sp.pdq_height || sp.net_wt_pdq
//   );
//   const hasPalletData = subprograms.some(sp =>
//     sp.cartons_per_20ft || sp.cartons_per_40ft || sp.pdq_per_20ft || sp.pdq_per_40ft || sp.pallet_per_20ft || sp.pallet_per_40ft
//   );

//   const purchase_sent_to = import.meta.env.VITE_Purchase_Sent_To;

//   useEffect(() => {
//     const fetchDetails = async () => {
//       try {
//         setLoading(true);
//         const response = await api.post(
//           `/api/carton-program/details/`,
//           { activity_program_status_id: id }
//         );
//         const data = response.data;
//         setDetails(data);
//         setCurrentStatus(data.status);
//         setSubprograms(
//           (data.subprograms || [])
//             .filter(sp => {
//               const hasValidDimensions = sp.width_in || sp.length_in || sp.width_cm || sp.length_cm;
//               const hasValidGsm = sp.gsm;
//               const hasValidUnits = sp.unit_per_carton;
//               const hasStyle = sp.style && sp.style.trim() !== '';
//               return hasValidDimensions || hasValidGsm || hasValidUnits || hasStyle;
//             })
//             .map(sp => ({
//               ...sp,
//               carton_length: sp.carton_length ?? '',
//               carton_width: sp.carton_width ?? '',
//               carton_height: sp.carton_height ?? '',
//               calculated_net_wt_carton: sp.calculated_net_wt_carton ?? '',
//               calculated_cbm_per_carton: sp.calculated_cbm_per_carton ?? '',
//               ribbon: sp.ribbon || '',
//               belly_band: sp.belly_band || '',
//               remark: sp.remark || '',
//               pdq_length: sp.pdq_length ?? '',
//               pdq_width: sp.pdq_width ?? '',
//               pdq_height: sp.pdq_height ?? '',
//               net_wt_pdq: sp.net_wt_pdq ?? '',
//               pallet_length: sp.pallet_length ?? '',
//               pallet_width: sp.pallet_width ?? '',
//               pallet_height: sp.pallet_height ?? '',
//               pallet_wt_pdq: sp.pallet_wt_pdq ?? '',
//               cartons_per_20ft: sp.cartons_per_20ft ?? '',
//               cartons_per_40ft: sp.cartons_per_40ft ?? '',
//               pdq_per_20ft: sp.pdq_per_20ft ?? '',
//               pdq_per_40ft: sp.pdq_per_40ft ?? '',
//               pallet_per_20ft: sp.pallet_per_20ft ?? '',
//               pallet_per_40ft: sp.pallet_per_40ft ?? '',
//             }))
//         );
//         setSamples(data.samples || []);
//         setAttachments(data.attachments || []);
//         setError(null);
//       } catch (err) {
//         console.error(err);
//         setError('Failed to load details.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (id) fetchDetails();
//   }, [id]);

//   const handleAttachmentClick = async (attachment, index) => {
//     const fileUrl = attachment.file_url;
//     const attachmentId = attachment.id || index;
//     if (!fileUrl) return;
//     setCheckingLink(attachmentId);
//     try {
//       const response = await fetch(fileUrl, { method: 'HEAD' });
//       if (response.ok) {
//         window.open(fileUrl, '_blank', 'noopener,noreferrer');
//       } else {
//         setShowErrorPopup(true);
//       }
//     } catch (err) {
//       setShowErrorPopup(true);
//     } finally {
//       setCheckingLink(null);
//     }
//   };

//   const handleAccept = async () => {
//     try {
//       const endpoint = role === 'ppc' ? '/api/activity-program/accept-ppc/' : '/api/activity-program/accept/';
//       await api.post(endpoint, { activity_program_status_id: id });
//       setCurrentStatus('In Progress');
//       toast.success("Request accepted successfully");
//     } catch (err) {
//       console.error('Error accepting:', err);
//       toast.error('Failed to accept the request');
//     }
//   };

//   const handlePPCAcceptAndComplete = async () => {
//     try {
//       toast.info('Processing request...');
//       let acceptSuccess = false;
//       try {
//         await api.post('/api/purchase/accept-request/', { activity_program_status_id: id });
//         acceptSuccess = true;
//         toast.success("Request accepted successfully");
//       } catch (acceptErr) {
//         console.error('PPC: Accept request failed:', acceptErr);
//         throw new Error(`Accept failed: ${acceptErr.response?.data?.detail || acceptErr.message}`);
//       }
//       await new Promise(resolve => setTimeout(resolve, 500));
//       try {
//         await api.post('/api/purchase/submit-completion/', { activity_program_status_id: id });
//         toast.success("Completion submitted successfully");
//       } catch (completeErr) {
//         console.error('PPC: Submit completion failed:', completeErr);
//         if (acceptSuccess) {
//           toast.warning('Request accepted but completion failed. Status: In Progress');
//           window.location.reload();
//           return;
//         }
//         throw new Error(`Completion failed: ${completeErr.response?.data?.detail || completeErr.message}`);
//       }
//       toast.success("Request processed successfully");
//       setTimeout(() => navigate('/'), 1000);
//     } catch (err) {
//       console.error('PPC Combined Process Error:', err);
//       const errorMessage = err.message || 'Failed to process request';
//       if (errorMessage.includes('Accept failed')) {
//         toast.error('Unable to accept the request. Please try again.');
//       } else if (errorMessage.includes('Completion failed')) {
//         toast.error('Unable to complete the request. Please try again.');
//       } else {
//         toast.error(errorMessage);
//       }
//     }
//   };

//   const handleSubmitTentative = async () => {
//     try {
//       const hasEmptyFields = subprograms.some(sp => !sp.carton_length || !sp.carton_width || !sp.carton_height);
//       if (hasEmptyFields) {
//         toast.warning('Please fill in all carton dimensions (Length, Width, Height) for all programs');
//         return;
//       }
//       const payload = {
//         activity_program_status_id: parseInt(id),
//         btn: "tentative_submit",
//         purchase_sent_to: purchase_sent_to,
//         request_sample: requestSample,
//         request_carton_sizing: requestCartonSizing,
//         subprograms: subprograms.map(sp => ({
//           subprogram_id: sp.subprogram_id,
//           carton_length: parseFloat(sp.carton_length) || 0,
//           carton_width: parseFloat(sp.carton_width) || 0,
//           carton_height: parseFloat(sp.carton_height) || 0,
//           ribbon: sp.ribbon || "",
//           belly_band: sp.belly_band || '',
//           remark: sp.remark || '',
//           pdq_length: parseFloat(sp.pdq_length) || 0,
//           pdq_width: parseFloat(sp.pdq_width) || 0,
//           pdq_height: parseFloat(sp.pdq_height) || 0,
//           net_wt_pdq: parseFloat(sp.net_wt_pdq) || 0,
//           pallet_length: parseFloat(sp.pallet_length) || 0,
//           pallet_width: parseFloat(sp.pallet_width) || 0,
//           pallet_height: parseFloat(sp.pallet_height) || 0,
//           pallet_wt_pdq: parseFloat(sp.pallet_wt_pdq) || 0,
//         }))
//       };
//       await api.post('/api/subprogram/tqm-update/', payload);
//       setCurrentStatus('Tentative Working Submitted');
//       setCalculationMode(false);
//       toast.success("Tentative calculation submitted successfully");
//       setTimeout(() => navigate('/'), 1500);
//     } catch (err) {
//       console.error('Error submitting tentative:', err);
//       toast.error('Failed to submit tentative calculation');
//     }
//     setRequestSample(false);
//     setRequestCartonSizing(false);
//   };

//   const handleSubmitFinal = async () => {
//     try {
//       const hasEmptyFields = subprograms.some(sp => !sp.carton_length || !sp.carton_width || !sp.carton_height);
//       if (hasEmptyFields) {
//         toast.warning('Please fill in all carton dimensions (Length, Width, Height) for all programs');
//         return;
//       }
//       const payload = {
//         activity_program_status_id: parseInt(id),
//         btn: "final_submit",
//         purchase_sent_to: purchase_sent_to,
//         request_sample: requestSample,
//         request_carton_sizing: requestCartonSizing,
//         subprograms: subprograms.map(sp => ({
//           subprogram_id: sp.subprogram_id,
//           carton_length: parseFloat(sp.carton_length) || 0,
//           carton_width: parseFloat(sp.carton_width) || 0,
//           carton_height: parseFloat(sp.carton_height) || 0,
//           ribbon: sp.ribbon || "",
//           belly_band: sp.belly_band || '',
//           remark: sp.remark || '',
//           pdq_length: parseFloat(sp.pdq_length) || 0,
//           pdq_width: parseFloat(sp.pdq_width) || 0,
//           pdq_height: parseFloat(sp.pdq_height) || 0,
//           net_wt_pdq: parseFloat(sp.net_wt_pdq) || 0,
//           pallet_length: parseFloat(sp.pallet_length) || 0,
//           pallet_width: parseFloat(sp.pallet_width) || 0,
//           pallet_height: parseFloat(sp.pallet_height) || 0,
//           pallet_wt_pdq: parseFloat(sp.pallet_wt_pdq) || 0,
//         }))
//       };
//       await api.post('/api/subprogram/tqm-update/', payload);
//       setCurrentStatus('Final Working Submitted');
//       setCalculationMode(false);
//       toast.success("Final calculation submitted successfully");
//       setTimeout(() => navigate('/'), 1500);
//     } catch (err) {
//       console.error('Error submitting final:', err);
//       toast.error('Failed to submit final calculation');
//     }
//     setRequestSample(false);
//     setRequestCartonSizing(false);
//   };

//   const updateCalculationField = (index, field, value) => {
//     setSubprograms(prev =>
//       prev.map((sp, i) => (i === index ? { ...sp, [field]: value } : sp))
//     );
//   };

//   const handlePurchaseAccept = async () => {
//     try {
//       await api.post('/api/purchase/accept-request/', { activity_program_status_id: id });
//       setCurrentStatus('In Progress');
//       window.location.reload();
//       toast.success("Request accepted");
//       setTimeout(() => navigate('/'), 1500);
//     } catch (err) {
//       console.error(err);
//       toast.error('Failed to accept request');
//     }
//   };

//   const handleSubmitCompletion = async () => {
//     try {
//       await api.post('/api/purchase/submit-completion/', { activity_program_status_id: id });
//       setCurrentStatus('Final Submitted');
//       toast.success("Completion submitted successfully");
//       setTimeout(() => navigate('/'), 1500);
//     } catch (err) {
//       console.error(err);
//       toast.error('Failed to submit completion');
//     }
//   };

//   // ====================== MANUAL FIELD VISIBILITY PER PROGRAM TYPE ======================
//   const hiddenFieldsByType = {
//     BEDSHEET: [
//       'original_towel',
//       'towel_folded_and_poly_packed_before_carton',
//       'polybag_type',
//       'warehouse_store_handling_method',
//     ],
//     BATH_ROBE: [
//       'original_towel',
//       'towel_folded_and_poly_packed_before_carton',
//       'polybag_type',
//       'polybag_manual_or_automatic',
//       'shipped_as_single_pdq_or_monster_pdq',
//       'warehouse_store_handling_method'
//     ],
//     TERRY_TOWEL: [
//       // Add fields you want to hide ONLY for Terry Towel here (if any)
//       // e.g. 'original_bath_robe' if it ever appears
//     ],
//   };

//   // ====================== PRODUCT SPECIFIC DETAILS ======================
//   const renderProductSpecificDetails = () => {
//     if (!details) return null;
//     const programType = details.program_type;

//     // BEDSHEET
//     if (programType === 'BEDSHEET' && details.bedsheet_details) {
//       const bedsheet = details.bedsheet_details;
//       return (
//         <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 mt-4">
//           <h3 className="text-md font-semibold text-blue-900 mb-4">Bedsheet Specific Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <DetailItem label="Fabric TC" value={bedsheet.fabric_tc} />
//             <DetailItem label="Folding Details" value={bedsheet.folding_details} />
//             <DetailItem label="Required Pcs/Polybag" value={bedsheet.required_pcs_per_polybag} />
//             <DetailItem label="Polybag Size" value={bedsheet.polybag_size} />
//             <DetailItem label="Product Type" value={bedsheet.product_type} />
//             <DetailItem label="Special Packing Requirement" value={bedsheet.special_packing_requirement} />
//             <DetailItem label="Packing Type" value={bedsheet.packing_type} />
//             <DetailItem label="Product Dimension" value={bedsheet.product_dimension} />
//             <DetailItem label="Fold Size" value={bedsheet.fold_size} />
//             <DetailItem label="Blister Packing Required" value={bedsheet.blister_packing_required} boolean />
//             <DetailItem label="Blister Packing Details" value={bedsheet.blister_packing_details} />
//             <DetailItem label="Bag Type" value={bedsheet.bag_type} />
//             <DetailItem label="Special Box Required" value={bedsheet.special_box_required} />
//             <DetailItem label="Required Sets/Carton" value={bedsheet.required_sets_per_carton} />
//             <DetailItem label="PolyFold Condition" value={bedsheet.polyfold_condition} />
//             <DetailItem label="Filled Product GSM" value={bedsheet.filled_product_gsm} />
{/* <DetailItem label="Elastic Required" value={bedsheet.elastic_required} boolean /> */}
//           </div>
//         </div>
//       );
//     }

//     // TERRY TOWEL
//     if (programType === 'TERRY_TOWEL' && details.terry_details) {
//       const terry = details.terry_details;
//       return (
//         <div className="bg-green-50 p-5 rounded-lg border border-green-100 mt-4">
//           <h3 className="text-md font-semibold text-green-900 mb-4">Terry Towel Specific Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <DetailItem label="Towel Sizes" value={terry.towel_sizes} />
//             <DetailItem label="Required Pcs/Carton (Size-wise)" value={terry.required_pcs_carton_size} />
//             <DetailItem label="Required Polybags/Carton (Size-wise)" value={terry.required_polybags_carton_size} />
//             <DetailItem label="Towel Dimensions" value={terry.towel_dimensions} />
//             <DetailItem label="Towel Weight Per Piece" value={terry.towel_weight_per_piece} />
//             <DetailItem label="Folding Details" value={terry.folding_details} />
//             <DetailItem label="Required Pcs/Polybag" value={terry.required_pcs_per_polybag} />
//             <DetailItem label="Special Carton Details" value={terry.special_carton_details} />
//           </div>
//         </div>
//       );
//     }

//     // BATH ROBE
//     if (programType === 'BATH_ROBE' && details.bathrobe_details) {
//       const bathrobe = details.bathrobe_details;
//       return (
//         <div className="bg-purple-50 p-5 rounded-lg border border-purple-100 mt-4">
//           <h3 className="text-md font-semibold text-purple-900 mb-4">Bath Robe Specific Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <DetailItem label="Original Bath Robe" value={bathrobe.original_bath_robe} />
//             <DetailItem label="Bath Robe Sizes" value={bathrobe.bath_robe_sizes} />
//             <DetailItem label="Bath Robe Dimensions" value={bathrobe.bath_robe_dimensions} />
//             <DetailItem label="Bath Robe Weight" value={bathrobe.bath_robe_weight} />
//             <DetailItem label="Folding Details" value={bathrobe.folding_details} />
//             <DetailItem label="Required Pcs/Polybag" value={bathrobe.required_pcs_per_polybag} />
//             <DetailItem label="Required Pcs/Carton" value={bathrobe.required_pcs_per_carton} />
//             <DetailItem label="Polybag Type" value={bathrobe.polybag_type} />
//             <DetailItem label="Polybag Size/Carton" value={bathrobe.polybag_size_carton} />
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   const DetailItem = ({ label, value, boolean = false }) => (
//     <div>
//       <p className="text-sm text-gray-600 capitalize">{label}</p>
//       <p className="font-medium text-gray-900">
//         {boolean ? (value ? "Yes" : "No") : (value || '-')}
//       </p>
//     </div>
//   );

//   const getProgramTypeDisplay = (type) => {
//     const typeMap = {
//       'TOWEL': 'Towel',
//       'BEDSHEET': 'Bedsheet',
//       'TERRY_TOWEL': 'Terry Towel',
//       'BATH_ROBE': 'Bath Robe'
//     };
//     return typeMap[type] || type;
//   };

//   if (loading) {
//     return (
//       <div className="p-8 flex justify-center items-center min-h-[60vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
//       </div>
//     );
//   }

//   if (error || !details) {
//     return (
//       <div className="p-8 text-center">
//         <p className="text-red-600 mb-4">{error || 'Not found'}</p>
//         <button onClick={() => navigate(-1)} className='cursor-pointer px-4 py-2 bg-[#003366] text-white rounded hover:bg-[#002244] transition-colors'>Go Back</button>
//       </div>
//     );
//   }

//   const { carton_program } = details;
//   const programType = details.program_type;

//   const isPDQRequired = carton_program?.pdq_required === "True" || carton_program?.pdq_required === true;
//   const isPallet_or_slipsheet_requirement = carton_program?.pallet_or_slipsheet_requirement === "True" || carton_program?.pallet_or_slipsheet_requirement === true;

//   const showCartonSizing = isCalculationActive || hasCalculationData;
//   const showPdqSizing = isCalculationActive || hasPdqData;
//   const showPalletSizing = isCalculationActive || hasPalletData;

//   return (
//     <>
//       <div className="h-full flex flex-col max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="sticky top-0 z-20 bg-gray-50 p-4 md:p-6 lg:p-8 border-b">
//           <div className="flex flex-col sm:flex-row justify-between items-start">
//             <div>
//               <div className="flex items-center gap-3 mb-2">
//                 <button onClick={() => navigate(-1)} className='cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors'>
//                   <ArrowLeft size={20} />
//                 </button>
//                 <h1 className="text-2xl font-bold">Carton Program – {carton_program?.program_name}</h1>
//               </div>
//               <div className="flex items-center gap-3 flex-wrap">
//                 <div className="flex items-center gap-2">
//                   <span className="font-semibold">Status:</span>
//                   <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 capitalize">{currentStatus}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="font-semibold">Type:</span>
//                   <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
//                     {getProgramTypeDisplay(programType)}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-col items-end gap-3 mt-2 sm:mt-0">
//               {canApprove && (
//                 <div className='flex items-center gap-4'>
//                   {role !== 'ppc' && (
//                     <button onClick={() => setShowRejectModal(true)} className="px-5 py-2 bg-red-50 text-red-600 rounded cursor-pointer border border-red-600 font-semibold hover:bg-red-100 transition-colors">
//                       Reject
//                     </button>
//                   )}
//                   <button onClick={handleAccept} className="px-5 py-2 bg-green-50 text-green-600 rounded cursor-pointer border border-green-600 font-semibold hover:bg-green-100 transition-colors">
//                     Accept
//                   </button>
//                 </div>
//               )}

//               {isPurchase && (normalizedStatus === 'tentative working submitted' || normalizedStatus === 'final working submitted') && (
//                 <button onClick={handlePurchaseAccept} className="px-5 py-2 bg-blue-50 text-blue-600 rounded cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200">Accept Request</button>
//               )}

//               {isPurchase && normalizedStatus === 'sample request accepted' && (
//                 <button onClick={handleSubmitCompletion} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer transition-colors">Submit Completion</button>
//               )}

//               {isPPC && (normalizedStatus === 'tentative working submitted' || normalizedStatus === 'final working submitted') && (
//                 <button onClick={handlePPCAcceptAndComplete} className="px-5 py-2 bg-green-50 text-green-600 rounded cursor-pointer hover:bg-green-100 transition-colors border border-green-200 font-medium">
//                   Accept & Complete Request
//                 </button>
//               )}

//               {canStartCalculation && !calculationMode && (
//                 <button onClick={() => setCalculationMode(true)} className="px-5 py-2 bg-[#003366] text-white rounded cursor-pointer hover:bg-[#002244] transition-colors">
//                   {hasCalculationData ? 'Update Calculation' : 'Submit Calculation'}
//                 </button>
//               )}

//               {calculationMode && (
//                 <div className="flex items-center gap-6 mt-2">
//                   <label className="flex items-center gap-2 text-sm cursor-pointer">
//                     <input type="checkbox" checked={requestSample} onChange={(e) => setRequestSample(e.target.checked)} className="w-4 h-4 cursor-pointer" /> Request Sample
//                   </label>
//                   <label className="flex items-center gap-2 text-sm cursor-pointer">
//                     <input type="checkbox" checked={requestCartonSizing} onChange={(e) => setRequestCartonSizing(e.target.checked)} className="w-4 h-4 cursor-pointer" /> Request Carton Sizing
//                   </label>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
//           {/* Program Information */}
//           <div className="bg-white shadow-sm rounded-lg border mb-8">
//             <div className="p-5 border-b">
//               <h2 className="text-lg font-semibold">Program Information</h2>
//             </div>
//             <div className="p-5">
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {Object.entries(carton_program || {}).map(([key, value]) => {
//                   if (key === 'program_name') return null;

//                   // ==================== MANUAL PER-TYPE CONDITION ====================
//                   const hiddenFields = hiddenFieldsByType[programType] || [];
//                   if (hiddenFields.includes(key)) {
//                     return null;
//                   }

//                   const label = key.replace(/_/g, ' ');
//                   return (
//                     <div key={key}>
//                       <p className="text-sm text-gray-500 capitalize">{label}</p>
//                       <p className="font-medium">
//                         {value === true ? "Yes" : value === false ? "No" : value || '-'}
//                       </p>
//                     </div>
//                   );
//                 })}
//               </div>

//               {renderProductSpecificDetails()}

//               {/* Attachments */}
//               <div className="mt-6 pt-4 border-t border-gray-200">
//                 <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
//                 {(!attachments || attachments.length === 0) ? (
//                   <p className="text-sm text-gray-400 italic">No attachments available</p>
//                 ) : (
//                   <div className="flex flex-wrap gap-2">
//                     {attachments.map((attachment, index) => {
//                       const attachmentId = attachment.id || index;
//                       const isChecking = checkingLink === attachmentId;
//                       const noUrl = !attachment.file_url;
//                       return (
//                         <button
//                           key={attachmentId}
//                           disabled={isChecking || noUrl}
//                           onClick={() => handleAttachmentClick(attachment, index)}
//                           className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer border ${noUrl
//                               ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
//                               : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100'
//                             }`}
//                         >
//                           {isChecking ? (
//                             <div className="animate-spin h-3 w-3 border-2 border-blue-700 border-t-transparent rounded-full" />
//                           ) : (
//                             <Paperclip size={14} />
//                           )}
//                           <span className="text-sm font-medium">
//                             {noUrl ? "No Link" : `View Attachment ${attachments.length > 1 ? index + 1 : ''}`}
//                           </span>
//                           {!noUrl && <Eye size={14} />}
//                         </button>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Program Specifications Table */}
//           {subprograms && subprograms.length > 0 && (
//             <div className="bg-white shadow-sm rounded-lg border mb-8">
//               <div className="p-3 border-b">
//                 <h2 className="text-lg font-semibold">Program Specifications</h2>
//               </div>
//               <div className="p-2 overflow-x-auto">
//                 <table className="min-w-full border-collapse text-sm">
//                   <thead className="text-white">
//                     <tr>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Program</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Style</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">W-In</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">W-Cm</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">L-In</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">L-Cm</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Wt/Unit</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">GSM</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Unit/Carton</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Inner Pack Unit Quantity</th>
//                       <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Fold</th>

//                       {showCartonSizing && (
//                         <th colSpan="5" className="px-4 py-3 text-center bg-[#04162B]">Carton Sizing</th>
//                       )}
//                       {showPdqSizing && (
//                         <th colSpan="4" className="px-4 py-3 text-center bg-[#062F88]">PDQ Sizing</th>
//                       )}
//                       {showPalletSizing && (
//                         <th colSpan="4" className="px-4 py-3 text-center bg-[#146DD8]">Pallet Sizing</th>
//                       )}
//                       {showCartonSizing && (
//                         <th colSpan="3" className="px-4 py-3 text-center bg-[#083B77]">Additional Details</th>
//                       )}

//                       {showCartonSizing && (
//                         <>
//                           <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Cartons/20ft</th>
//                           <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Cartons/40ft</th>
//                           <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">PDQ/20ft</th>
//                           <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">PDQ/40ft</th>
//                           <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Pallet/20ft</th>
//                           <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Pallet/40ft</th>
//                         </>
//                       )}
//                     </tr>
//                     <tr>
//                       {showCartonSizing && (
//                         <>
//                           <th className="px-4 py-3 text-center bg-[#04162B]">L (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#04162B]">W (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#04162B]">H (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#04162B]">Net Weight</th>
//                           <th className="px-4 py-3 text-center bg-[#04162B]">CBM</th>
//                         </>
//                       )}
//                       {showPdqSizing && (
//                         <>
//                           <th className="px-4 py-3 text-center bg-[#062F88]">L (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#062F88]">W (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#062F88]">H (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#062F88]">Net Weight</th>
//                         </>
//                       )}
//                       {showPalletSizing && (
//                         <>
//                           <th className="px-4 py-3 text-center bg-[#146DD8]">L (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#146DD8]">W (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#146DD8]">H (cm)</th>
//                           <th className="px-4 py-3 text-center bg-[#146DD8]">Net Weight</th>
//                         </>
//                       )}
//                       {showCartonSizing && (
//                         <>
//                           <th className="px-4 py-3 text-center bg-[#083B77]">Ribbon</th>
//                           <th className="px-4 py-3 text-center bg-[#083B77]">Belly Band</th>
//                           <th className="px-4 py-3 text-center bg-[#083B77]">Remark</th>
//                         </>
//                       )}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {subprograms.map((sp, index) => (
//                       <tr key={sp.subprogram_id} className="border-t">
//                         {index === 0 && (
//                           <td rowSpan={subprograms.length} className="px-4 py-3 font-medium bg-gray-50 align-middle border-r">
//                             {sp.program_name}
//                           </td>
//                         )}
//                         <td className="px-4 py-3">{sp.style ?? "-"}</td>
//                         <td className="px-4 py-3">{sp.width_in ?? "-"}</td>
//                         <td className="px-4 py-3">{sp.width_cm ?? "-"}</td>
//                         <td className="px-4 py-3">{sp.length_in ?? "-"}</td>
//                         <td className="px-4 py-3">{sp.length_cm ?? "-"}</td>
//                         <td className="px-4 py-3">{sp.wt_per_unit ?? "-"}</td>
//                         <td className="px-4 py-3">{sp.gsm ?? "-"}</td>

//                         {index === 0 && (
//                           <>
//                             <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-x text-center">{sp.unit_per_carton ?? "-"}</td>
//                             <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-r text-center">{sp.inner_pack_unit_qty ?? "-"}</td>
//                             <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-r">{sp.fold ?? "-"}</td>
//                           </>
//                         )}

//                         {showCartonSizing && (
//                           <>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.carton_length} onChange={(e) => updateCalculationField(index, 'carton_length', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.carton_length ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.carton_width} onChange={(e) => updateCalculationField(index, 'carton_width', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.carton_width ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.carton_height} onChange={(e) => updateCalculationField(index, 'carton_height', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.carton_height ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.calculated_net_wt_carton} readOnly className="border px-2 py-1 rounded w-20 bg-gray-100 cursor-not-allowed" />
//                               ) : (sp.calculated_net_wt_carton ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.calculated_cbm_per_carton} readOnly className="border px-2 py-1 rounded w-20 bg-gray-100 cursor-not-allowed" />
//                               ) : (sp.calculated_cbm_per_carton ?? "-")}
//                             </td>
//                           </>
//                         )}

//                         {showPdqSizing && (
//                           <>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.pdq_length} onChange={(e) => updateCalculationField(index, 'pdq_length', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.pdq_length ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.pdq_width} onChange={(e) => updateCalculationField(index, 'pdq_width', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.pdq_width ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.pdq_height} onChange={(e) => updateCalculationField(index, 'pdq_height', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.pdq_height ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.net_wt_pdq} onChange={(e) => updateCalculationField(index, 'net_wt_pdq', e.target.value)} className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.net_wt_pdq ?? "-")}
//                             </td>
//                           </>
//                         )}

//                         {showPalletSizing && (
//                           <>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.pallet_length} onChange={(e) => updateCalculationField(index, 'pallet_length', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.pallet_length ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.pallet_width} onChange={(e) => updateCalculationField(index, 'pallet_width', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.pallet_width ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.pallet_height} onChange={(e) => updateCalculationField(index, 'pallet_height', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.pallet_height ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="number" value={sp.pallet_wt_pdq} onChange={(e) => updateCalculationField(index, 'pallet_wt_pdq', e.target.value)} className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.pallet_wt_pdq ?? "-")}
//                             </td>
//                           </>
//                         )}

//                         {showCartonSizing && (
//                           <>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="text" value={sp.ribbon} onChange={(e) => updateCalculationField(index, 'ribbon', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.ribbon ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="text" value={sp.belly_band} onChange={(e) => updateCalculationField(index, 'belly_band', e.target.value)} className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.belly_band ?? "-")}
//                             </td>
//                             <td className="px-4 py-3">
//                               {isCalculationActive ? (
//                                 <input type="text" value={sp.remark} onChange={(e) => updateCalculationField(index, 'remark', e.target.value)} className="border px-2 py-1 rounded w-32 focus:outline-none focus:ring-1 focus:ring-blue-500" />
//                               ) : (sp.remark ?? "-")}
//                             </td>
//                           </>
//                         )}

//                         {showCartonSizing && (
//                           <>
//                             <td className="px-4 py-3">{sp.cartons_per_20ft ?? "-"}</td>
//                             <td className="px-4 py-3">{sp.cartons_per_40ft ?? "-"}</td>
//                             <td className="px-4 py-3">{sp.pdq_per_20ft ?? "-"}</td>
//                             <td className="px-4 py-3">{sp.pdq_per_40ft ?? "-"}</td>
//                             <td className="px-4 py-3">{sp.pallet_per_20ft ?? "-"}</td>
//                             <td className="px-4 py-3">{sp.pallet_per_40ft ?? "-"}</td>
//                           </>
//                         )}
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Samples Table */}
//           {samples && samples.length > 0 && (
//             <div className="bg-white shadow-sm rounded-lg border mb-8">
//               <div className="p-2 overflow-x-auto">
//                 <Table
//                   title="Sample Specifications"
//                   headers={[
//                     { label: "Program", key: "program_name" },
//                     { label: "Sample", key: "sample" },
//                     { label: "Size", key: "size" },
//                     { label: "Quality", key: "quality" },
//                     { label: "GSM", key: "gsm" },
//                     { label: "Shade", key: "shade" },
//                     { label: "Lbs/Dz", key: "lbs_per_dz" },
//                     { label: "Width (In)", key: "width_in" },
//                     { label: "Width (Cm)", key: "width_cm" },
//                     { label: "Length (In)", key: "length_in" },
//                     { label: "Length (Cm)", key: "length_cm" },
//                   ]}
//                   data={samples}
//                   type="flat"
//                   readOnly={true}
//                 />
//               </div>
//             </div>
//           )}

//           {/* AI Carton Calculations */}
//           {/* {(isMarketing || isTTQM) && ( */}
//             <CartonCalculationResults
//               programId={id}
//               apiBaseUrl={import.meta.env.VITE_API_BASE_URL || 'http://your-api-url'}
//             />
//           {/* )} */}

//           {calculationMode && (
//             <div className="flex justify-end gap-4 mb-4 border-t pt-6">
//               <button onClick={handleSubmitTentative} className="px-6 py-2 bg-[#0f3460] hover:bg-[#0a2545] text-white rounded cursor-pointer transition-colors">Submit Tentative</button>
//               <button onClick={handleSubmitFinal} className="px-6 py-2 bg-[#0f3460] hover:bg-[#0a2545] text-white rounded cursor-pointer transition-colors">Submit Final</button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Reject Modal */}
//       {showRejectModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
//             <h3 className="text-lg font-semibold mb-4">Reject Request</h3>
//             <textarea
//               value={rejectReason}
//               onChange={(e) => setRejectReason(e.target.value)}
//               placeholder="Enter reason for rejection"
//               className="w-full border rounded p-2 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               rows={4}
//             />
//             <div className="flex justify-end gap-3">
//               <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors">Cancel</button>
//               <button
//                 onClick={async () => {
//                   if (!rejectReason.trim()) {
//                     toast.warning('Please enter a reason for rejection');
//                     return;
//                   }
//                   try {
//                     await api.post('/api/activity-program/reject/', {
//                       activity_program_status_id: id,
//                       reason: rejectReason
//                     });
//                     setCurrentStatus('rejected');
//                     setShowRejectModal(false);
//                     setRejectReason('');
//                     toast.success('Request rejected successfully');
//                   } catch (err) {
//                     toast.error('Failed to reject the request');
//                   }
//                 }}
//                 className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors"
//               >
//                 Confirm Reject
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Popup */}
//       {showErrorPopup && (
//         <div className="fixed inset-0 h-[129vh] bg-black/50 flex items-center justify-center z-[9999] p-4">
//           <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
//             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
//               <span className="text-3xl font-bold">!</span>
//             </div>
//             <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
//             <p className="text-gray-600 mb-6">The attachment link is currently broken or the file is missing (404 Error).</p>
//             <button onClick={() => setShowErrorPopup(false)} className="w-full cursor-pointer py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors">Close Notification</button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default CartonView;



import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Paperclip, Eye } from 'lucide-react';
import Table from '../Form/Table';
import AICalculationsDisplay from './AICalculationsDisplay';
import { toast } from 'react-toastify';
import FreezingNoteTable from '../Form/FreezingNoteTable';

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
  const [actualProgramId, setActualProgramId] = useState(null);
  const [freezingNoteRows, setFreezingNoteRows] = useState([]);
  const [linkedGusset, setLinkedGusset] = useState(null);
  const [canEditFreezingNote, setCanEditFreezingNote] = useState(false);
  const [savingFreezingNote, setSavingFreezingNote] = useState(false);
  const [freezingNoteCalcMode, setFreezingNoteCalcMode] = useState(false);
  const [recalculatingFreezingNote, setRecalculatingFreezingNote] = useState(false);
  const [calculationMode, setCalculationMode] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [subprograms, setSubprograms] = useState([]);
  const [samples, setSamples] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestSample, setRequestSample] = useState(false);
  const [requestCartonSizing, setRequestCartonSizing] = useState(false);
  const [checkingLink, setCheckingLink] = useState(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const isMarketing = role === 'marketing';
  const isTTQM = role === 'ttqm';
  const isPurchase = role === 'purchase';
  const isPPC = role === 'ppc';

  const canApprove = (role === 'ttqm' || role === 'ppc') && normalizedStatus === 'pending';
  const canStartCalculation = role === 'ttqm' && (normalizedStatus === 'in progress' || normalizedStatus === 'tentative working submitted');
  const isCalculationActive = calculationMode;

  const hasCalculationData = subprograms.some(sp =>
    sp.carton_length || sp.carton_width || sp.carton_height || sp.ribbon || sp.belly_band || sp.remark
  );
  const hasPdqData = subprograms.some(sp =>
    sp.pdq_length || sp.pdq_width || sp.pdq_height || sp.net_wt_pdq
  );
  const hasPalletData = subprograms.some(sp =>
    sp.cartons_per_20ft || sp.cartons_per_40ft || sp.pdq_per_20ft || sp.pdq_per_40ft || sp.pallet_per_20ft || sp.pallet_per_40ft
  );

  // Submit is only allowed once EVERY subprogram has been recalculated.
  // Backend (bulk_update_tqm_subprogram) enforces this too - this is just
  // the frontend gate so the buttons show as disabled/grey.
  const allRecalculated = subprograms.length > 0 && subprograms.every(sp => sp.is_recalculated === true);

  const purchase_sent_to = import.meta.env.VITE_Purchase_Sent_To;

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
        setActualProgramId(data.program_id);
        setFreezingNoteRows(data.freezing_note_rows || []);
        setCanEditFreezingNote(data.can_edit_freezing_note === true);
        setLinkedGusset(data.linked_gusset || null);
        setSubprograms(
          (data.subprograms || [])
            .filter(sp => {
              const hasValidDimensions = sp.width_in || sp.length_in || sp.width_cm || sp.length_cm;
              const hasValidGsm = sp.gsm;
              const hasValidUnits = sp.unit_per_carton;
              const hasStyle = sp.style && sp.style.trim() !== '';
              return hasValidDimensions || hasValidGsm || hasValidUnits || hasStyle;
            })
            .map(sp => ({
              ...sp,
              carton_length: sp.carton_length ?? '',
              carton_width: sp.carton_width ?? '',
              carton_height: sp.carton_height ?? '',
              calculated_net_wt_carton: sp.calculated_net_wt_carton ?? '',
              calculated_cbm_per_carton: sp.calculated_cbm_per_carton ?? '',
              saved_net_wt_carton: sp.saved_net_wt_carton ?? '',
              saved_cbm_per_carton: sp.saved_cbm_per_carton ?? '',
              ribbon: sp.ribbon || '',
              belly_band: sp.belly_band || '',
              remark: sp.remark || '',
              pdq_length: sp.pdq_length ?? '',
              pdq_width: sp.pdq_width ?? '',
              pdq_height: sp.pdq_height ?? '',
              net_wt_pdq: sp.net_wt_pdq ?? '',
              pallet_length: sp.pallet_length ?? '',
              pallet_width: sp.pallet_width ?? '',
              pallet_height: sp.pallet_height ?? '',
              pallet_wt_pdq: sp.pallet_wt_pdq ?? '',
              cartons_per_20ft: sp.saved_cartons_per_20ft ?? sp.cartons_per_20ft ?? '',
              cartons_per_40ft: sp.saved_cartons_per_40ft ?? sp.cartons_per_40ft ?? '',
              pdq_per_20ft: sp.saved_pdq_per_20ft ?? sp.pdq_per_20ft ?? '',
              pdq_per_40ft: sp.saved_pdq_per_40ft ?? sp.pdq_per_40ft ?? '',
              pallet_per_20ft: sp.saved_pallet_per_20ft ?? sp.pallet_per_20ft ?? '',
              pallet_per_40ft: sp.saved_pallet_per_40ft ?? sp.pallet_per_40ft ?? '',
              saved_cartons_per_20ft: sp.saved_cartons_per_20ft ?? '',
              saved_cartons_per_40ft: sp.saved_cartons_per_40ft ?? '',
              saved_pdq_per_20ft: sp.saved_pdq_per_20ft ?? '',
              saved_pdq_per_40ft: sp.saved_pdq_per_40ft ?? '',
              saved_pallet_per_20ft: sp.saved_pallet_per_20ft ?? '',
              saved_pallet_per_40ft: sp.saved_pallet_per_40ft ?? '',
              is_recalculated: sp.is_recalculated ?? false,
            }))
        );
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
      await api.post(endpoint, { activity_program_status_id: id });
      setCurrentStatus('In Progress');
      toast.success("Request accepted successfully");
    } catch (err) {
      console.error('Error accepting:', err);
      toast.error('Failed to accept the request');
    }
  };

  const handlePPCAcceptAndComplete = async () => {
    try {
      toast.info('Processing request...');
      let acceptSuccess = false;
      try {
        await api.post('/api/purchase/accept-request/', { activity_program_status_id: id });
        acceptSuccess = true;
        toast.success("Request accepted successfully");
      } catch (acceptErr) {
        console.error('PPC: Accept request failed:', acceptErr);
        throw new Error(`Accept failed: ${acceptErr.response?.data?.detail || acceptErr.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        await api.post('/api/purchase/submit-completion/', { activity_program_status_id: id });
        toast.success("Completion submitted successfully");
      } catch (completeErr) {
        console.error('PPC: Submit completion failed:', completeErr);
        if (acceptSuccess) {
          toast.warning('Request accepted but completion failed. Status: In Progress');
          window.location.reload();
          return;
        }
        throw new Error(`Completion failed: ${completeErr.response?.data?.detail || completeErr.message}`);
      }
      toast.success("Request processed successfully");
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error('PPC Combined Process Error:', err);
      const errorMessage = err.message || 'Failed to process request';
      if (errorMessage.includes('Accept failed')) {
        toast.error('Unable to accept the request. Please try again.');
      } else if (errorMessage.includes('Completion failed')) {
        toast.error('Unable to complete the request. Please try again.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // --------------------------------------------------
  // RECALCULATE — saves current typed dimensions to DB,
  // computes container-fit numbers, marks is_recalculated=true
  // --------------------------------------------------
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const payload = {
        subprograms: subprograms.map(sp => ({
          subprogram_id: sp.subprogram_id,
          carton_length: parseFloat(sp.carton_length) || 0,
          carton_width: parseFloat(sp.carton_width) || 0,
          carton_height: parseFloat(sp.carton_height) || 0,
          pdq_length: parseFloat(sp.pdq_length) || 0,
          pdq_width: parseFloat(sp.pdq_width) || 0,
          pdq_height: parseFloat(sp.pdq_height) || 0,
          pallet_length: parseFloat(sp.pallet_length) || 0,
          pallet_width: parseFloat(sp.pallet_width) || 0,
          pallet_height: parseFloat(sp.pallet_height) || 0,
          ribbon: sp.ribbon || null,
          belly_band: sp.belly_band || null,
          remark: sp.remark || '',
          saved_net_wt_carton: sp.saved_net_wt_carton !== '' ? parseFloat(sp.saved_net_wt_carton) : null,
          saved_cbm_per_carton: sp.saved_cbm_per_carton !== '' ? parseFloat(sp.saved_cbm_per_carton) : null,
        }))
      };

      const response = await api.post('/api/subprogram/recalculate-preview/', payload);
      const results = response.data.results || [];

      setSubprograms(prev => prev.map(sp => {
        const match = results.find(r => r.subprogram_id === sp.subprogram_id);
        if (!match) return sp;

        // Helper: true if user hasn't manually typed a value yet
        const isEmpty = (v) => v === '' || v === null || v === undefined;

        return {
          ...sp,
          carton_length: match.carton.length ?? sp.carton_length,
          carton_width: match.carton.width ?? sp.carton_width,
          carton_height: match.carton.height ?? sp.carton_height,
          saved_cbm_per_carton: match.carton.cbm ?? sp.saved_cbm_per_carton,
          saved_net_wt_carton: match.net_wt_carton ?? sp.saved_net_wt_carton,
          // Only fill from Recalculate if user hasn't already typed a value manually
          cartons_per_20ft: isEmpty(sp.cartons_per_20ft) ? match.cartons_per_20ft : sp.cartons_per_20ft,
          cartons_per_40ft: isEmpty(sp.cartons_per_40ft) ? match.cartons_per_40ft : sp.cartons_per_40ft,
          pdq_per_20ft: isEmpty(sp.pdq_per_20ft) ? match.pdq_per_20ft : sp.pdq_per_20ft,
          pdq_per_40ft: isEmpty(sp.pdq_per_40ft) ? match.pdq_per_40ft : sp.pdq_per_40ft,
          pallet_per_20ft: isEmpty(sp.pallet_per_20ft) ? match.pallet_per_20ft : sp.pallet_per_20ft,
          pallet_per_40ft: isEmpty(sp.pallet_per_40ft) ? match.pallet_per_40ft : sp.pallet_per_40ft,
          ribbon: match.ribbon ?? sp.ribbon,
          belly_band: match.belly_band ?? sp.belly_band,
          remark: match.remark ?? sp.remark,
          is_recalculated: true,
        };
      }));

      toast.success("Recalculated successfully — you can now submit");
    } catch (err) {
      console.error('Recalculate failed:', err);
      const msg = err.response?.data?.error || 'Failed to recalculate';
      toast.error(msg);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSubmitTentative = async () => {
    try {
      const hasEmptyFields = subprograms.some(sp => !sp.carton_length || !sp.carton_width || !sp.carton_height);
      if (hasEmptyFields) {
        toast.warning('Please fill in all carton dimensions (Length, Width, Height) for all programs');
        return;
      }
      if (!allRecalculated) {
        toast.warning('Please click Recalculate before submitting');
        return;
      }
      const payload = {
        activity_program_status_id: parseInt(id),
        btn: "tentative_submit",
        purchase_sent_to: purchase_sent_to,
        request_sample: requestSample,
        request_carton_sizing: requestCartonSizing,
        subprograms: subprograms.map(sp => ({
          subprogram_id: sp.subprogram_id,
          carton_length: parseFloat(sp.carton_length) || 0,
          carton_width: parseFloat(sp.carton_width) || 0,
          carton_height: parseFloat(sp.carton_height) || 0,
          ribbon: sp.ribbon || "",
          belly_band: sp.belly_band || '',
          remark: sp.remark || '',
          pdq_length: parseFloat(sp.pdq_length) || 0,
          pdq_width: parseFloat(sp.pdq_width) || 0,
          pdq_height: parseFloat(sp.pdq_height) || 0,
          net_wt_pdq: parseFloat(sp.net_wt_pdq) || 0,
          pallet_length: parseFloat(sp.pallet_length) || 0,
          pallet_width: parseFloat(sp.pallet_width) || 0,
          pallet_height: parseFloat(sp.pallet_height) || 0,
          pallet_wt_pdq: parseFloat(sp.pallet_wt_pdq) || 0,
          saved_cartons_per_20ft: sp.cartons_per_20ft !== '' && sp.cartons_per_20ft != null ? parseInt(sp.cartons_per_20ft) : null,
          saved_cartons_per_40ft: sp.cartons_per_40ft !== '' && sp.cartons_per_40ft != null ? parseInt(sp.cartons_per_40ft) : null,
          saved_pdq_per_20ft: sp.pdq_per_20ft !== '' && sp.pdq_per_20ft != null ? parseInt(sp.pdq_per_20ft) : null,
          saved_pdq_per_40ft: sp.pdq_per_40ft !== '' && sp.pdq_per_40ft != null ? parseInt(sp.pdq_per_40ft) : null,
          saved_pallet_per_20ft: sp.pallet_per_20ft !== '' && sp.pallet_per_20ft != null ? parseInt(sp.pallet_per_20ft) : null,
          saved_pallet_per_40ft: sp.pallet_per_40ft !== '' && sp.pallet_per_40ft != null ? parseInt(sp.pallet_per_40ft) : null,
          saved_cbm_per_carton: parseFloat(sp.saved_cbm_per_carton) || null,
          saved_net_wt_carton: parseFloat(sp.saved_net_wt_carton) || null,
        }))
      };
      await api.post('/api/subprogram/tqm-update/', payload);
      setCurrentStatus('Tentative Working Submitted');
      setCalculationMode(false);
      toast.success("Tentative calculation submitted successfully");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Error submitting tentative:', err);
      const msg = err.response?.data?.error || 'Failed to submit tentative calculation';
      toast.error(msg);
    }
    setRequestSample(false);
    setRequestCartonSizing(false);
  };

  const handleSubmitFinal = async () => {
    try {
      const hasEmptyFields = subprograms.some(sp => !sp.carton_length || !sp.carton_width || !sp.carton_height);
      if (hasEmptyFields) {
        toast.warning('Please fill in all carton dimensions (Length, Width, Height) for all programs');
        return;
      }
      if (!allRecalculated) {
        toast.warning('Please click Recalculate before submitting');
        return;
      }
      const payload = {
        activity_program_status_id: parseInt(id),
        btn: "final_submit",
        purchase_sent_to: purchase_sent_to,
        request_sample: requestSample,
        request_carton_sizing: requestCartonSizing,
        subprograms: subprograms.map(sp => ({
          subprogram_id: sp.subprogram_id,
          carton_length: parseFloat(sp.carton_length) || 0,
          carton_width: parseFloat(sp.carton_width) || 0,
          carton_height: parseFloat(sp.carton_height) || 0,
          ribbon: sp.ribbon || "",
          belly_band: sp.belly_band || '',
          remark: sp.remark || '',
          pdq_length: parseFloat(sp.pdq_length) || 0,
          pdq_width: parseFloat(sp.pdq_width) || 0,
          pdq_height: parseFloat(sp.pdq_height) || 0,
          net_wt_pdq: parseFloat(sp.net_wt_pdq) || 0,
          pallet_length: parseFloat(sp.pallet_length) || 0,
          pallet_width: parseFloat(sp.pallet_width) || 0,
          pallet_height: parseFloat(sp.pallet_height) || 0,
          pallet_wt_pdq: parseFloat(sp.pallet_wt_pdq) || 0,
          saved_cartons_per_20ft: sp.cartons_per_20ft !== '' && sp.cartons_per_20ft != null ? parseInt(sp.cartons_per_20ft) : null,
          saved_cartons_per_40ft: sp.cartons_per_40ft !== '' && sp.cartons_per_40ft != null ? parseInt(sp.cartons_per_40ft) : null,
          saved_pdq_per_20ft: sp.pdq_per_20ft !== '' && sp.pdq_per_20ft != null ? parseInt(sp.pdq_per_20ft) : null,
          saved_pdq_per_40ft: sp.pdq_per_40ft !== '' && sp.pdq_per_40ft != null ? parseInt(sp.pdq_per_40ft) : null,
          saved_pallet_per_20ft: sp.pallet_per_20ft !== '' && sp.pallet_per_20ft != null ? parseInt(sp.pallet_per_20ft) : null,
          saved_pallet_per_40ft: sp.pallet_per_40ft !== '' && sp.pallet_per_40ft != null ? parseInt(sp.pallet_per_40ft) : null,
          saved_cbm_per_carton: parseFloat(sp.saved_cbm_per_carton) || null,
          saved_net_wt_carton: parseFloat(sp.saved_net_wt_carton) || null,
        }))
      };
      await api.post('/api/subprogram/tqm-update/', payload);
      setCurrentStatus('Final Working Submitted');
      setCalculationMode(false);
      toast.success("Final calculation submitted successfully");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Error submitting final:', err);
      const msg = err.response?.data?.error || 'Failed to submit final calculation';
      toast.error(msg);
    }
    setRequestSample(false);
    setRequestCartonSizing(false);
  };

  // Dimension fields that, when edited, must reset is_recalculated so the
  // Submit buttons grey out again until Recalculate is pressed.
  const DIMENSION_FIELDS = [
    'carton_length', 'carton_width', 'carton_height',
    'pdq_length', 'pdq_width', 'pdq_height',
    'pallet_length', 'pallet_width', 'pallet_height'
  ];

  const updateCalculationField = (index, field, value) => {
    setSubprograms(prev =>
      prev.map((sp, i) => {
        if (i !== index) return sp;
        const updated = { ...sp, [field]: value };
        if (DIMENSION_FIELDS.includes(field)) {
          updated.is_recalculated = false;
        }
        return updated;
      })
    );
  };

  // ==================== FREEZING NOTE HANDLERS (Marketing only) ====================
  const handleFreezingNoteFieldChange = (idx, field, value) => {
    setFreezingNoteRows(prev =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const updated = { ...row, [field]: value };
        if (['carton_length_cm', 'carton_width_cm', 'carton_height_cm'].includes(field)) {
          updated.is_recalculated = false;
        }
        return updated;
      })
    );
  };

  const handleSaveFreezingNote = async () => {
    setSavingFreezingNote(true);
    try {
      await api.post('/api/carton-program/edit/', {
        activity_program_status_id: parseInt(id),
        program_type: programType,
        carton_program: details.carton_program,
        bedsheet_details: details.bedsheet_details,
        terry_details: details.terry_details,
        bathrobe_details: details.bathrobe_details,
        subprograms: subprograms,
        samples: samples,
        freezing_note_rows: freezingNoteRows,
      });
      toast.success('Freezing Note updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update Freezing Note.');
    } finally {
      setSavingFreezingNote(false);
    }
  };
  // ==================== FREEZING NOTE — TQM RECALCULATE FLOW ====================
  // Carton Length/Width/Height are TQM-only fields, filled after PPC
  // accepts (not by Marketing at submit time). Same "Recalculate" pattern
  // as the Towel subprogram flow.
  const CARTON_DIM_FIELDS = ['carton_length_cm', 'carton_width_cm', 'carton_height_cm'];

  const handleFreezingNoteDimChange = (idx, field, value) => {
    setFreezingNoteRows(prev =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const updated = { ...row, [field]: value };
        if (CARTON_DIM_FIELDS.includes(field)) {
          updated.is_recalculated = false;
        }
        return updated;
      })
    );
  };

  const handleRecalculateFreezingNote = async () => {
    setRecalculatingFreezingNote(true);
    try {
      const payload = {
        freezing_note_rows: freezingNoteRows.map(row => ({
          freezing_note_id: row.freezing_note_id,
          carton_length_cm: row.carton_length_cm !== '' ? parseFloat(row.carton_length_cm) : null,
          carton_width_cm: row.carton_width_cm !== '' ? parseFloat(row.carton_width_cm) : null,
          carton_height_cm: row.carton_height_cm !== '' ? parseFloat(row.carton_height_cm) : null,
        }))
      };

      const response = await api.post('/api/freezing-note/recalculate/', payload);
      const results = response.data.results || [];

      setFreezingNoteRows(prev => prev.map(row => {
        const match = results.find(r => r.freezing_note_id === row.freezing_note_id);
        if (!match) return row;
        return {
          ...row,
          carton_length_cm: match.carton_length_cm,
          carton_width_cm: match.carton_width_cm,
          carton_height_cm: match.carton_height_cm,
          is_recalculated: true,
        };
      }));

      toast.success('Carton dimensions recalculated successfully');
    } catch (err) {
      console.error('Freezing note recalculate failed:', err);
      const msg = err.response?.data?.error || 'Failed to recalculate';
      toast.error(msg);
    } finally {
      setRecalculatingFreezingNote(false);
    }
  };
  const handleSubmitFreezingNoteTentative = async () => {
    if (!allFreezingNoteRecalculated) {
      toast.warning('Please click Recalculate before submitting');
      return;
    }
    try {
      await api.post('/api/freezing-note/submit/', {
        activity_program_status_id: parseInt(id),
        btn: 'tentative_submit',
      });
      setCurrentStatus('Tentative Working Submitted');
      setFreezingNoteCalcMode(false);
      toast.success('Tentative Freezing Note submitted successfully');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to submit tentative';
      toast.error(msg);
    }
  };

  const handleSubmitFreezingNoteFinal = async () => {
    if (!allFreezingNoteRecalculated) {
      toast.warning('Please click Recalculate before submitting');
      return;
    }
    try {
      await api.post('/api/freezing-note/submit/', {
        activity_program_status_id: parseInt(id),
        btn: 'final_submit',
      });
      setCurrentStatus('Final Working Submitted');
      setFreezingNoteCalcMode(false);
      toast.success('Final Freezing Note submitted successfully');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to submit final';
      toast.error(msg);
    }
  };
  const allFreezingNoteRecalculated =
    freezingNoteRows.length > 0 && freezingNoteRows.every(row => row.is_recalculated === true);
  const handlePurchaseAccept = async () => {
    try {
      await api.post('/api/purchase/accept-request/', { activity_program_status_id: id });
      setCurrentStatus('In Progress');
      window.location.reload();
      toast.success("Request accepted");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept request');
    }
  };

  const handleSubmitCompletion = async () => {
    try {
      await api.post('/api/purchase/submit-completion/', { activity_program_status_id: id });
      setCurrentStatus('Final Submitted');
      toast.success("Completion submitted successfully");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit completion');
    }
  };

  // ====================== MANUAL FIELD VISIBILITY PER PROGRAM TYPE ======================
  const hiddenFieldsByType = {
    BEDSHEET: [
      'original_towel',
      'towel_folded_and_poly_packed_before_carton',
      'polybag_type',
      'warehouse_store_handling_method',
    ],
    BATH_ROBE: [
      'original_towel',
      'towel_folded_and_poly_packed_before_carton',
      'polybag_type',
      'polybag_manual_or_automatic',
      'shipped_as_single_pdq_or_monster_pdq',
      'warehouse_store_handling_method'
    ],
    TERRY_TOWEL: [],
  };

  // ====================== PRODUCT SPECIFIC DETAILS ======================
  const renderProductSpecificDetails = () => {
    if (!details) return null;
    const programType = details.program_type;

    if (programType === 'BEDSHEET' && details.bedsheet_details) {
      const bedsheet = details.bedsheet_details;
      return (
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 mt-4">
          <h3 className="text-md font-semibold text-blue-900 mb-4">Bedsheet Specific Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem label="Fabric TC" value={bedsheet.fabric_tc} />
            <DetailItem label="Folding Details" value={bedsheet.folding_details} />
            <DetailItem label="Product Type" value={bedsheet.product_type} />
            <DetailItem label="Special Packing Requirement" value={bedsheet.special_packing_requirement} />
            <DetailItem label="Packing Type" value={bedsheet.packing_type} />
            <DetailItem
              label="Fold Length x Fold Width"
              value={
                bedsheet.fold_length && bedsheet.fold_width
                  ? `${bedsheet.fold_length} x ${bedsheet.fold_width}`
                  : (bedsheet.fold_length || bedsheet.fold_width || null)
              }
            />
            <DetailItem label="Blister Packing Required" value={bedsheet.blister_packing_required} boolean />
            <DetailItem label="Blister Packing Details" value={bedsheet.blister_packing_details} />
            <DetailItem label="Bag Type" value={bedsheet.bag_type} />
            <DetailItem label="Special Box Required" value={bedsheet.special_box_required} />
            <DetailItem label="PolyFold Condition" value={bedsheet.polyfold_condition} />
            <DetailItem label="Filled Product GSM" value={bedsheet.filled_product_gsm} />
            <DetailItem label="Elastic Required" value={bedsheet.elastic_required} boolean />
          </div>
        </div>
      );
    }

    // if (programType === 'TERRY_TOWEL' && details.terry_details) {
    //   const terry = details.terry_details;
    if ((programType === 'TERRY_TOWEL' || programType === 'TOWEL') && details.terry_details) {
      const terry = details.terry_details;
      return (
        <div className="bg-green-50 p-5 rounded-lg border border-green-100 mt-4">
          <h3 className="text-md font-semibold text-green-900 mb-4">Terry Towel Specific Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem label="Towel Sizes" value={terry.towel_sizes} />
            <DetailItem label="Special Carton Details" value={terry.special_carton_details} />
          </div>
        </div>
      );
    }

    if (programType === 'BATH_ROBE' && details.bathrobe_details) {
      const bathrobe = details.bathrobe_details;
      return (
        <div className="bg-purple-50 p-5 rounded-lg border border-purple-100 mt-4">
          <h3 className="text-md font-semibold text-purple-900 mb-4">Bath Robe Specific Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem label="Original Bath Robe" value={bathrobe.original_bath_robe} />
            <DetailItem label="Bath Robe Sizes" value={bathrobe.bath_robe_sizes} />
            <DetailItem label="Bath Robe Dimensions" value={bathrobe.bath_robe_dimensions} />
            <DetailItem label="Bath Robe Weight" value={bathrobe.bath_robe_weight} />
            <DetailItem label="Folding Details" value={bathrobe.folding_details} />
            <DetailItem label="Required Pcs/Polybag" value={bathrobe.required_pcs_per_polybag} />
            <DetailItem label="Required Pcs/Carton" value={bathrobe.required_pcs_per_carton} />
            <DetailItem label="Polybag Type" value={bathrobe.polybag_type} />
            <DetailItem label="Polybag Size/Carton" value={bathrobe.polybag_size_carton} />
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

  const getProgramTypeDisplay = (type) => {
    const typeMap = {
      'TOWEL': 'Towel',
      'BEDSHEET': 'Bedsheet',
      'TERRY_TOWEL': 'Terry Towel',
      'BATH_ROBE': 'Bath Robe'
    };
    return typeMap[type] || type;
  };

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

  const { carton_program } = details;
  const programType = details.program_type;

  const isPDQRequired = carton_program?.pdq_required === "True" || carton_program?.pdq_required === true;
  const isPallet_or_slipsheet_requirement = carton_program?.pallet_or_slipsheet_requirement === "True" || carton_program?.pallet_or_slipsheet_requirement === true;

  const showCartonSizing = isCalculationActive || hasCalculationData;
  const showPdqSizing = isCalculationActive || hasPdqData;
  const showPalletSizing = isCalculationActive || hasPalletData;

  return (
    <>
      <div className="h-full flex flex-col max-w-8xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gray-50 p-4 md:p-6 lg:p-8 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => navigate(-1)} className='cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors'>
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Carton Program – {carton_program?.program_name}</h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Status:</span>
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 capitalize">{currentStatus}</span>
                </div>
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
                    <button onClick={() => setShowRejectModal(true)} className="px-5 py-2 bg-red-50 text-red-600 rounded cursor-pointer border border-red-600 font-semibold hover:bg-red-100 transition-colors">
                      Reject
                    </button>
                  )}
                  <button onClick={handleAccept} className="px-5 py-2 bg-green-50 text-green-600 rounded cursor-pointer border border-green-600 font-semibold hover:bg-green-100 transition-colors">
                    Accept
                  </button>
                </div>
              )}

              {isPurchase && (normalizedStatus === 'tentative working submitted' || normalizedStatus === 'final working submitted') && (
                <button onClick={handlePurchaseAccept} className="px-5 py-2 bg-blue-50 text-blue-600 rounded cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200">Accept Request</button>
              )}

              {isPurchase && normalizedStatus === 'sample request accepted' && (
                <button onClick={handleSubmitCompletion} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer transition-colors">Submit Completion</button>
              )}

              {isPPC && (normalizedStatus === 'tentative working submitted' || normalizedStatus === 'final working submitted') && (
                <button onClick={handlePPCAcceptAndComplete} className="px-5 py-2 bg-green-50 text-green-600 rounded cursor-pointer hover:bg-green-100 transition-colors border border-green-200 font-medium">
                  Accept & Complete Request
                </button>
              )}

              {/* TEMP: Bedsheet carton-dimension entry flow is being
                  redesigned (Freezing Note now owns those fields but TQM
                  can't edit it yet) — hide the old Submit Calculation
                  button for Bedsheet until that's resolved. */}
              {canStartCalculation && !calculationMode && programType !== 'BEDSHEET' && (
                <button onClick={() => setCalculationMode(true)} className="px-5 py-2 bg-[#003366] text-white rounded cursor-pointer hover:bg-[#002244] transition-colors">
                  {hasCalculationData ? 'Update Calculation' : 'Submit Calculation'}
                </button>
              )}

              {calculationMode && (
                <div className="flex items-center gap-6 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={requestSample} onChange={(e) => setRequestSample(e.target.checked)} className="w-4 h-4 cursor-pointer" /> Request Sample
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={requestCartonSizing} onChange={(e) => setRequestCartonSizing(e.target.checked)} className="w-4 h-4 cursor-pointer" /> Request Carton Sizing
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">

          {/* Linked Gusset Section — shown for combined (Gusset+Bedsheet)
              submissions, or when Standard Bedsheet was added later on
              top of an existing Gusset program. Read-only summary here;
              full Gusset editing/accept-reject still happens on its own
              GussetView page if needed separately. */}
          {linkedGusset && (
            <div className="bg-purple-50 shadow-sm rounded-lg border border-purple-100 mb-8">
              <div className="p-5 border-b border-purple-100">
                <h2 className="text-lg font-semibold text-purple-900">Gusset Finalization (Linked)</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailItem label="Customer Name" value={linkedGusset.customer_name} />
                  <DetailItem label="Program Name" value={linkedGusset.program_name} />
                  <DetailItem label="TC" value={linkedGusset.tc} />
                  <DetailItem label="Weave" value={linkedGusset.weave} />
                  <DetailItem label="Product Group" value={linkedGusset.product_group} />
                  <DetailItem
                    label="Size"
                    value={linkedGusset.size === "Other" ? linkedGusset.other_size : linkedGusset.size}
                  />
                  <DetailItem
                    label="Fold Length x Fold Width"
                    value={
                      linkedGusset.fold_length && linkedGusset.fold_width
                        ? `${linkedGusset.fold_length} x ${linkedGusset.fold_width}`
                        : (linkedGusset.fold_length || linkedGusset.fold_width || null)
                    }
                  />
                  {/* <DetailItem label="Gusset Bank" value={linkedGusset.gusset_bank} /> */}
                  <DetailItem label="Reference Program" value={linkedGusset.reference_program} />
                  <DetailItem label="Comments" value={linkedGusset.comments} />
                </div>

                <div className="mt-6 pt-4 border-t border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3">Cardboard Stiffener</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DetailItem label="Cardboard Required" value={linkedGusset.cardboard_required} boolean />
                    {linkedGusset.cardboard_required && (
                      <>
                        <DetailItem label="Fold Type" value={linkedGusset.fold_type} />
                        <DetailItem label="Ply" value={linkedGusset.ply} />
                        <DetailItem label="Fold on Side" value={linkedGusset.fold_on_side} />
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3">Polybag</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <DetailItem label="Polybag Required" value={linkedGusset.polybag_required} boolean />
                    {linkedGusset.polybag_required && (
                      <>
                        <DetailItem label="Material Type" value={linkedGusset.material_type} />
                        <DetailItem label="Opening Type" value={linkedGusset.opening_type} />
                        <DetailItem label="Opening on Side" value={linkedGusset.opening_on_side} />
                        <DetailItem label="Inlay / Belly Band" value={linkedGusset.inlay_or_belly_band} />
                        <DetailItem label="Polybag Type" value={linkedGusset.polybag_type} />
                      </>
                    )}
                  </div>
                </div>

                {linkedGusset.program_specifications?.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-800 mb-3">Gusset Program Specifications</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-purple-700 text-white">
                            <th className="px-3 py-2 text-left">Size</th>
                            <th className="px-3 py-2 text-left">Fold Length</th>
                            <th className="px-3 py-2 text-left">Fold Width</th>
                            <th className="px-3 py-2 text-left">Gusset Name</th>
                            <th className="px-3 py-2 text-left">WT</th>
                            <th className="px-3 py-2 text-left">GSM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linkedGusset.program_specifications.map((sp, i) => (
                            <tr key={i} className="border-t border-purple-100">
                              <td className="px-3 py-2">{sp.size ?? '-'}</td>
                              <td className="px-3 py-2">{sp.fold_length ?? '-'}</td>
                              <td className="px-3 py-2">{sp.fold_width ?? '-'}</td>
                              <td className="px-3 py-2">{sp.gusset_name ?? '-'}</td>
                              <td className="px-3 py-2">{sp.wt ?? '-'}</td>
                              <td className="px-3 py-2">{sp.gsm ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Program Information */}
          <div className="bg-white shadow-sm rounded-lg border mb-8">
            <div className="p-5 border-b">
              <h2 className="text-lg font-semibold">Program Information</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(carton_program || {}).map(([key, value]) => {
                  if (key === 'program_name') return null;

                  const hiddenFields = hiddenFieldsByType[programType] || [];
                  if (hiddenFields.includes(key)) {
                    return null;
                  }

                  const label = key.replace(/_/g, ' ');
                  return (
                    <div key={key}>
                      <p className="text-sm text-gray-500 capitalize">{label}</p>
                      <p className="font-medium">
                        {value === true ? "Yes" : value === false ? "No" : value || '-'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {renderProductSpecificDetails()}

              {/* Attachments */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
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
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer border ${noUrl
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
                            {noUrl ? "No Link" : `View Attachment ${attachments.length > 1 ? index + 1 : ''}`}
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

          {/* Program Specifications Table — hidden for Bedsheet now
              (replaced by Freezing Note + Gusset Specifications) */}
          {programType !== 'BEDSHEET' && subprograms && subprograms.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg border mb-8">
              <div className="p-3 border-b">
                <h2 className="text-lg font-semibold">Program Specifications</h2>
              </div>
              <div className="p-2 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="text-white">
                    <tr>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Program</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Size</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">W-In</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">L-In</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Wt/Unit</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">GSM</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Units/Polybag</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Units/Carton</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Polybags/Carton</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Folding Details</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Fold W</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Fold L</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Carton W</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Carton L</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Carton H</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">CBM</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Wt/Carton</th>

                      {showCartonSizing && (
                        <th colSpan="5" className="px-4 py-3 text-center bg-[#04162B]">Carton Sizing</th>
                      )}
                      {showPdqSizing && (
                        <th colSpan="4" className="px-4 py-3 text-center bg-[#062F88]">PDQ Sizing</th>
                      )}
                      {showPalletSizing && (
                        <th colSpan="4" className="px-4 py-3 text-center bg-[#146DD8]">Pallet Sizing</th>
                      )}
                      {showCartonSizing && (
                        <th colSpan="3" className="px-4 py-3 text-center bg-[#083B77]">Additional Details</th>
                      )}

                      {showCartonSizing && (
                        <>
                          <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Cartons/20ft</th>
                          <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Cartons/40ft</th>
                          <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">PDQ/20ft</th>
                          <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">PDQ/40ft</th>
                          <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Pallet/20ft</th>
                          <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Pallet/40ft</th>
                        </>
                      )}
                    </tr>
                    <tr>
                      {showCartonSizing && (
                        <>
                          <th className="px-4 py-3 text-center bg-[#04162B]">L (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#04162B]">W (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#04162B]">H (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#04162B]">Net Weight</th>
                          <th className="px-4 py-3 text-center bg-[#04162B]">CBM</th>
                        </>
                      )}
                      {showPdqSizing && (
                        <>
                          <th className="px-4 py-3 text-center bg-[#062F88]">L (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#062F88]">W (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#062F88]">H (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#062F88]">Net Weight</th>
                        </>
                      )}
                      {showPalletSizing && (
                        <>
                          <th className="px-4 py-3 text-center bg-[#146DD8]">L (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#146DD8]">W (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#146DD8]">H (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#146DD8]">Net Weight</th>
                        </>
                      )}
                      {showCartonSizing && (
                        <>
                          <th className="px-4 py-3 text-center bg-[#083B77]">Ribbon</th>
                          <th className="px-4 py-3 text-center bg-[#083B77]">Belly Band</th>
                          <th className="px-4 py-3 text-center bg-[#083B77]">Remark</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {subprograms.map((sp, index) => (
                      <tr key={sp.subprogram_id} className="border-t">
                        {index === 0 && (
                          <td rowSpan={subprograms.length} className="px-4 py-3 font-medium bg-gray-50 align-middle border-r">
                            {sp.program_name}
                          </td>
                        )}
                        <td className="px-4 py-3">{sp.style ?? "-"}</td>
                        <td className="px-4 py-3">{sp.width_in ?? "-"}</td>
                        <td className="px-4 py-3">{sp.length_in ?? "-"}</td>
                        <td className="px-4 py-3">{sp.wt_per_unit ?? "-"}</td>
                        <td className="px-4 py-3">{sp.gsm ?? "-"}</td>

                        {index === 0 && (
                          <>
                            <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-x text-center">{sp.inner_pack_unit_qty ?? "-"}</td>
                            <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-x text-center">{sp.unit_per_carton ?? "-"}</td>
                            <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-r text-center">{sp.polybags_per_carton ?? "-"}</td>
                            <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-r">{sp.fold ?? "-"}</td>
                          </>
                        )}
                        <td className="px-4 py-3">{sp.folded_width ?? "-"}</td>
                        <td className="px-4 py-3">{sp.folded_length ?? "-"}</td>
                        <td className="px-4 py-3 text-sky-700 font-semibold">{sp.carton_width ?? "-"}</td>
                        <td className="px-4 py-3 text-sky-700 font-semibold">{sp.carton_length ?? "-"}</td>
                        <td className="px-4 py-3 text-sky-700 font-semibold">{sp.carton_height ?? "-"}</td>
                        <td className="px-4 py-3 text-sky-700 font-semibold">{sp.calculated_cbm_per_carton ?? "-"}</td>
                        <td className="px-4 py-3 text-sky-700 font-semibold">{sp.calculated_net_wt_carton ?? "-"}</td>

                        {showCartonSizing && (
                          <>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.carton_length} onChange={(e) => updateCalculationField(index, 'carton_length', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.carton_length ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.carton_width} onChange={(e) => updateCalculationField(index, 'carton_width', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.carton_width ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.carton_height} onChange={(e) => updateCalculationField(index, 'carton_height', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.carton_height ?? "-")}
                            </td>
                            {/* Net Weight — now editable */}
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input
                                  type="number"
                                  value={sp.saved_net_wt_carton !== '' ? sp.saved_net_wt_carton : sp.calculated_net_wt_carton}
                                  onChange={(e) => updateCalculationField(index, 'saved_net_wt_carton', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (sp.saved_net_wt_carton || sp.calculated_net_wt_carton || "-")}
                            </td>
                            {/* CBM — editable */}
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input
                                  type="number"
                                  value={sp.saved_cbm_per_carton !== '' ? sp.saved_cbm_per_carton : sp.calculated_cbm_per_carton}
                                  onChange={(e) => updateCalculationField(index, 'saved_cbm_per_carton', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (sp.saved_cbm_per_carton || sp.calculated_cbm_per_carton || "-")}
                            </td>
                          </>
                        )}

                        {showPdqSizing && (
                          <>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.pdq_length} onChange={(e) => updateCalculationField(index, 'pdq_length', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.pdq_length ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.pdq_width} onChange={(e) => updateCalculationField(index, 'pdq_width', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.pdq_width ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.pdq_height} onChange={(e) => updateCalculationField(index, 'pdq_height', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.pdq_height ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.net_wt_pdq} onChange={(e) => updateCalculationField(index, 'net_wt_pdq', e.target.value)} className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.net_wt_pdq ?? "-")}
                            </td>
                          </>
                        )}

                        {showPalletSizing && (
                          <>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.pallet_length} onChange={(e) => updateCalculationField(index, 'pallet_length', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.pallet_length ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.pallet_width} onChange={(e) => updateCalculationField(index, 'pallet_width', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.pallet_width ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.pallet_height} onChange={(e) => updateCalculationField(index, 'pallet_height', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.pallet_height ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.pallet_wt_pdq} onChange={(e) => updateCalculationField(index, 'pallet_wt_pdq', e.target.value)} className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.pallet_wt_pdq ?? "-")}
                            </td>
                          </>
                        )}

                        {showCartonSizing && (
                          <>
                            {/* Ribbon — Yes/No dropdown */}
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <select
                                  value={sp.ribbon || ''}
                                  onChange={(e) => updateCalculationField(index, 'ribbon', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">Select</option>
                                  <option value="YES">Yes</option>
                                  <option value="NO">No</option>
                                </select>
                              ) : (sp.ribbon ?? "-")}
                            </td>
                            {/* Belly Band — Yes/No dropdown */}
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <select
                                  value={sp.belly_band || ''}
                                  onChange={(e) => updateCalculationField(index, 'belly_band', e.target.value)}
                                  className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">Select</option>
                                  <option value="YES">Yes</option>
                                  <option value="NO">No</option>
                                </select>
                              ) : (sp.belly_band ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="text" value={sp.remark} onChange={(e) => updateCalculationField(index, 'remark', e.target.value)} className="border px-2 py-1 rounded w-32 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.remark ?? "-")}
                            </td>
                          </>
                        )}

                        {showCartonSizing && (
                          <>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input
                                  type="number"
                                  value={sp.cartons_per_20ft ?? ''}
                                  onChange={(e) => updateCalculationField(index, 'cartons_per_20ft', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (sp.saved_cartons_per_20ft ?? sp.cartons_per_20ft ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input
                                  type="number"
                                  value={sp.cartons_per_40ft ?? ''}
                                  onChange={(e) => updateCalculationField(index, 'cartons_per_40ft', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (sp.saved_cartons_per_40ft ?? sp.cartons_per_40ft ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input
                                  type="number"
                                  value={sp.pdq_per_20ft ?? ''}
                                  onChange={(e) => updateCalculationField(index, 'pdq_per_20ft', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (sp.saved_pdq_per_20ft ?? sp.pdq_per_20ft ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input
                                  type="number"
                                  value={sp.pdq_per_40ft ?? ''}
                                  onChange={(e) => updateCalculationField(index, 'pdq_per_40ft', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (sp.saved_pdq_per_40ft ?? sp.pdq_per_40ft ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input
                                  type="number"
                                  value={sp.pallet_per_20ft ?? ''}
                                  onChange={(e) => updateCalculationField(index, 'pallet_per_20ft', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (sp.saved_pallet_per_20ft ?? sp.pallet_per_20ft ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input
                                  type="number"
                                  value={sp.pallet_per_40ft ?? ''}
                                  onChange={(e) => updateCalculationField(index, 'pallet_per_40ft', e.target.value)}
                                  className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (sp.saved_pallet_per_40ft ?? sp.pallet_per_40ft ?? "-")}
                            </td>
                          </>
                        )}
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
                    { label: "Sample Code", key: "sample_code" },
                    { label: "Attachment", key: "attachments", type: "attachment_list" },
                  ]}
                  data={samples}
                  type="flat"
                  readOnly={true}
                />
              </div>
            </div>
          )}
          
          {/* Freezing Note — Bedsheet only.
              - Marketing: can edit everything EXCEPT carton dimensions (canEditFreezingNote).
              - TQM: can ONLY edit carton dimensions, via Recalculate flow, after clicking
                "Enter Carton Dimensions" (freezingNoteCalcMode).
              - PPC / everyone else: fully read-only. */}
          {programType === 'BEDSHEET' && freezingNoteRows.length > 0 && (
            <div className="mb-8">
              <FreezingNoteTable
                rows={freezingNoteRows}
                onCellChange={canEditFreezingNote ? handleFreezingNoteFieldChange : undefined}
                onDeleteRow={undefined}
                onAddRow={undefined}
                readOnly={!canEditFreezingNote}
                hideTqmOnlyFields={false}
              />

              {/* Save — Marketing always; TQM too, now that backend grants
                  can_edit_freezing_note to both roles. */}
              {canEditFreezingNote && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSaveFreezingNote}
                    disabled={savingFreezingNote}
                    className="px-6 py-2 bg-[#0f3460] hover:bg-[#0a2545] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {savingFreezingNote ? 'Saving...' : 'Save Freezing Note'}
                  </button>
                </div>
              )}

              {/* TQM: Recalculate + Submit Tentative/Final — table above is
                  already fully editable for TQM (via canEditFreezingNote),
                  these buttons handle the is_recalculated gate and move
                  the program status forward. */}
              {isTTQM && canStartCalculation && (
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={handleRecalculateFreezingNote}
                    disabled={recalculatingFreezingNote}
                    className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                      recalculatingFreezingNote ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
                    }`}
                  >
                    {recalculatingFreezingNote ? 'Recalculating...' : 'Recalculate'}
                  </button>
                  <button
                    onClick={handleSubmitFreezingNoteTentative}
                    disabled={!allFreezingNoteRecalculated}
                    className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                      allFreezingNoteRecalculated ? 'bg-[#0f3460] hover:bg-[#0a2545] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Submit Tentative
                  </button>
                  <button
                    onClick={handleSubmitFreezingNoteFinal}
                    disabled={!allFreezingNoteRecalculated}
                    className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                      allFreezingNoteRecalculated ? 'bg-[#0f3460] hover:bg-[#0a2545] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Submit Final
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Carton Calculations */}
  
          {/* AI Carton Calculations */}
          {actualProgramId && (
            <AICalculationsDisplay
              programId={actualProgramId}
              apiInstance={api}
            />
          )}

          {calculationMode && (
            <div className="flex justify-end gap-4 mb-4 border-t pt-6">
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className={`px-6 py-2 rounded text-white transition-colors ${recalculating ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
                  }`}
              >
                {recalculating ? 'Recalculating...' : 'Recalculate'}
              </button>
              <button
                onClick={handleSubmitTentative}
                disabled={!allRecalculated}
                className={`px-6 py-2 rounded text-white transition-colors ${allRecalculated ? 'bg-[#0f3460] hover:bg-[#0a2545] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                Submit Tentative
              </button>
              <button
                onClick={handleSubmitFinal}
                disabled={!allRecalculated}
                className={`px-6 py-2 rounded text-white transition-colors ${allRecalculated ? 'bg-[#0f3460] hover:bg-[#0a2545] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                Submit Final
              </button>
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
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    toast.warning('Please enter a reason for rejection');
                    return;
                  }
                  try {
                    await api.post('/api/activity-program/reject/', {
                      activity_program_status_id: id,
                      reason: rejectReason
                    });
                    setCurrentStatus('rejected');
                    setShowRejectModal(false);
                    setRejectReason('');
                    toast.success('Request rejected successfully');
                  } catch (err) {
                    toast.error('Failed to reject the request');
                  }
                }}
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

export default CartonView;