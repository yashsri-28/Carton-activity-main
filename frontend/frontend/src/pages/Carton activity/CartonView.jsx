import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { ArrowLeft, Paperclip, Eye, Download } from 'lucide-react';
import Table from '../Form/Table';
import CartonCalculationResults from './CartonCalculationResults';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import { XCircle, CheckCircle } from "lucide-react";

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
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestSample, setRequestSample] = useState(false);
  const [requestCartonSizing, setRequestCartonSizing] = useState(false);
  const [checkingLink, setCheckingLink] = useState(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [ppcRemark, setPpcRemark] = useState('');
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
  console.log(subprograms);

  const hasInnerPackData = subprograms.some(
    sp =>
      sp.inner_pack_unit_qty !== null &&
      sp.inner_pack_unit_qty !== undefined &&
      sp.inner_pack_unit_qty !== ""
  );

  const hasPdqData = subprograms.some(sp =>
    sp.pdq_length || sp.pdq_width || sp.pdq_height || sp.net_wt_pdq
  );
  const hasPalletData = subprograms.some(sp =>
    sp.cartons_per_20ft || sp.cartons_per_40ft || sp.pdq_per_20ft || sp.pdq_per_40ft || sp.pallet_per_20ft || sp.pallet_per_40ft
  );

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
        setSubprograms(
          (data.subprograms || [])
            .filter(sp => {
              const hasValidDimensions = sp.width_in || sp.length_in || sp.width_cm || sp.length_cm;
              const hasValidGsm = sp.gsm;
              const hasValidUnits = sp.unit_per_carton || sp.pcs_per_set;
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
              cartons_per_20ft: sp.cartons_per_20ft ?? '',
              cartons_per_40ft: sp.cartons_per_40ft ?? '',
              pdq_per_20ft: sp.pdq_per_20ft ?? '',
              pdq_per_40ft: sp.pdq_per_40ft ?? '',
              pallet_per_20ft: sp.pallet_per_20ft ?? '',
              pallet_per_40ft: sp.pallet_per_40ft ?? '',
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

  const handleSubmitTentative = async () => {
    try {
      const hasEmptyFields = subprograms.some(sp => !sp.carton_length || !sp.carton_width || !sp.carton_height);
      if (hasEmptyFields) {
        toast.warning('Please fill in all carton dimensions (Length, Width, Height) for all programs');
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
          packed_pb_length: parseFloat(sp.packed_pb_length) || 0,
          packed_pb_width: parseFloat(sp.packed_pb_width) || 0,
          packed_pb_height: parseFloat(sp.packed_pb_height) || 0,

        }))
      };
      await api.post('/api/subprogram/tqm-update/', payload);
      setCurrentStatus('Tentative Working Submitted');
      setCalculationMode(false);
      toast.success("Tentative calculation submitted successfully");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Error submitting tentative:', err);
      toast.error('Failed to submit tentative calculation');
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
          packed_pb_length: parseFloat(sp.packed_pb_length) || 0,
          packed_pb_width: parseFloat(sp.packed_pb_width) || 0,
          packed_pb_height: parseFloat(sp.packed_pb_height) || 0,
        }))
      };
      await api.post('/api/subprogram/tqm-update/', payload);
      setCurrentStatus('Final Working Submitted');
      setCalculationMode(false);
      toast.success("Final calculation submitted successfully");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Error submitting final:', err);
      toast.error('Failed to submit final calculation');
    }
    setRequestSample(false);
    setRequestCartonSizing(false);
  };

  const updateCalculationField = (index, field, value) => {
    setSubprograms(prev =>
      prev.map((sp, i) => (i === index ? { ...sp, [field]: value } : sp))
    );
  };

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

  // ────────────────────────────────────────────────
  //     Excel Export with ExcelJS
  // ────────────────────────────────────────────────

  const exportProgramSpecifications = async () => {
    if (!subprograms || subprograms.length === 0) {
      toast.info("No program specification data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Program Specifications', {
      properties: { defaultColWidth: 14, defaultRowHeight: 22 },
      views: [{ state: 'frozen', ySplit: 2 }],
    });

    // Colors
    const headerBg = 'FF0F3460';
    const subHeaderBg = 'FF04162B';   // Packed PB / Carton
    const pdqHeaderBg = 'FF062F88';
    const palletHeaderBg = 'FF146DD8';
    const extraHeaderBg = 'FF083B77';   // Additional Details
    const textWhite = 'FFFFFFFF';
    const lightGray = 'FFF5F5F5';

    // ── Build headers ────────────────────────────────────────────
    let col = 1;

    const row1 = ws.getRow(1);
    const row2 = ws.getRow(2);

    // 1. Fixed columns – label only in row 1, row 2 empty → will be merged vertically
    const fixedColumns = [
      'Program', 'Style', 'W-In', 'W-Cm', 'L-In', 'L-Cm',
      'Wt/Unit', gsmLabel, 'Unit/Carton', 'Inner Pack Unit Quantity', 'Fold'
    ];

    fixedColumns.forEach((title) => {
      row1.getCell(col).value = title;
      // row2.getCell(col) remains empty → we will merge 1→2 later
      col++;
    });

    // 2. Dynamic grouped sections
    const groups = [];

    // Packed PB
    if (showInnerPackSizing) {
      const start = col;
      row1.getCell(col).value = 'Packed PB';
      row2.getCell(col++).value = 'L (cm)';
      row2.getCell(col++).value = 'W (cm)';
      row2.getCell(col++).value = 'H (cm)';
      groups.push({ title: 'Packed PB', startCol: start, endCol: col - 1, bg: subHeaderBg });
    }

    // Carton Sizing
    if (showCartonSizing) {
      const start = col;
      row1.getCell(col).value = 'Carton Sizing';
      row2.getCell(col++).value = 'L (cm)';
      row2.getCell(col++).value = 'W (cm)';
      row2.getCell(col++).value = 'H (cm)';
      row2.getCell(col++).value = 'Net Weight';
      row2.getCell(col++).value = 'CBM';
      groups.push({ title: 'Carton Sizing', startCol: start, endCol: col - 1, bg: subHeaderBg });

      // Additional Details – right after Carton Sizing
      const extraStart = col;
      row1.getCell(col).value = 'Additional Details';
      row2.getCell(col++).value = 'Ribbon';
      row2.getCell(col++).value = 'Belly Band';
      row2.getCell(col++).value = 'Remark';
      groups.push({ title: 'Additional Details', startCol: extraStart, endCol: col - 1, bg: extraHeaderBg });
    }

    // PDQ Sizing
    if (showPdqSizing) {
      const start = col;
      row1.getCell(col).value = 'PDQ Sizing';
      row2.getCell(col++).value = 'L (cm)';
      row2.getCell(col++).value = 'W (cm)';
      row2.getCell(col++).value = 'H (cm)';
      row2.getCell(col++).value = 'Net Weight';
      groups.push({ title: 'PDQ Sizing', startCol: start, endCol: col - 1, bg: pdqHeaderBg });
    }

    // Pallet Sizing
    if (showPalletSizing) {
      const start = col;
      row1.getCell(col).value = 'Pallet Sizing';
      row2.getCell(col++).value = 'L (cm)';
      row2.getCell(col++).value = 'W (cm)';
      row2.getCell(col++).value = 'H (cm)';
      row2.getCell(col++).value = 'Net Weight';
      groups.push({ title: 'Pallet Sizing', startCol: start, endCol: col - 1, bg: palletHeaderBg });
    }

    // Container load columns (only if carton sizing shown)
    let containerStartCol = col;
    if (showCartonSizing) {
      row2.getCell(col++).value = 'Cartons/20ft';
      row2.getCell(col++).value = 'Cartons/40ft';
      row2.getCell(col++).value = 'PDQ/20ft';
      row2.getCell(col++).value = 'PDQ/40ft';
      row2.getCell(col++).value = 'Pallet/20ft';
      row2.getCell(col++).value = 'Pallet/40ft';
    }

    // ── Merges ───────────────────────────────────────────────────

    // A. Vertical merge for fixed columns (row 1 + row 2)
    fixedColumns.forEach((_, index) => {
      const c = index + 1;
      ws.mergeCells(1, c, 2, c);
    });

    // B. Horizontal merge for group titles in row 1
    groups.forEach(group => {
      if (group.endCol > group.startCol) {
        ws.mergeCells(1, group.startCol, 1, group.endCol);
      }
    });

    // ── Header styling ───────────────────────────────────────────
    [1, 2].forEach(r => {
      ws.getRow(r).eachCell({ includeEmpty: true }, (cell, c) => {
        cell.font = { bold: true, color: { argb: textWhite } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        let bg = headerBg;

        // Find which group this column belongs to
        const group = groups.find(g => c >= g.startCol && c <= g.endCol);
        if (group) bg = group.bg;

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // ── Data rows ────────────────────────────────────────────────
    subprograms.forEach(sp => {
      const row = ws.addRow([
        sp.program_name || '-',
        sp.style || '-',
        sp.width_in || '-',
        sp.width_cm || '-',
        sp.length_in || '-',
        sp.length_cm || '-',
        sp.wt_per_unit || '-',
        sp.gsm || '-',
        sp.unit_per_carton || '-',
        sp.inner_pack_unit_qty || '-',
        sp.fold || '-',

        ...(showInnerPackSizing ? [sp.pdq_length || '-', sp.pdq_width || '-', sp.pdq_height || '-'] : []),

        ...(showCartonSizing ? [
          sp.carton_length || '-', sp.carton_width || '-', sp.carton_height || '-',
          sp.calculated_net_wt_carton || '-', sp.calculated_cbm_per_carton || '-',
          sp.ribbon || '-', sp.belly_band || '-', sp.remark || '-'
        ] : []),

        ...(showPdqSizing ? [sp.pdq_length || '-', sp.pdq_width || '-', sp.pdq_height || '-', sp.net_wt_pdq || '-'] : []),

        ...(showPalletSizing ? [sp.pallet_length || '-', sp.pallet_width || '-', sp.pallet_height || '-', sp.pallet_wt_pdq || '-'] : []),

        ...(showCartonSizing ? [
          sp.cartons_per_20ft || '-', sp.cartons_per_40ft || '-',
          sp.pdq_per_20ft || '-', sp.pdq_per_40ft || '-',
          sp.pallet_per_20ft || '-', sp.pallet_per_40ft || '-'
        ] : []),
      ]);

      // Light gray for fixed columns (visual rowspan effect)
      for (let i = 1; i <= fixedColumns.length; i++) {
        const cell = row.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGray } };
      }

      // Center most columns
      row.eachCell({ includeEmpty: true }, (cell, c) => {
        if (c >= 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Auto-fit columns
    ws.columns.forEach(column => {
      let max = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > max) max = len;
      });
      column.width = Math.min(32, Math.max(10, max + 3));
    });

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, `Program_Specs_${carton_program?.program_name || 'export'}_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast.success("Program Specifications exported to Excel");
  };

  // ────────────────────────────────────────────────
  //     Export Sample Specifications – Full version
  // ────────────────────────────────────────────────

  const exportSampleSpecifications = async () => {
    if (!samples || samples.length === 0) {
      toast.info("No sample data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Sample Specifications', {
      properties: { defaultColWidth: 16, defaultRowHeight: 22 },
    });

    const headerBg = 'FF0F3460';
    const textWhite = 'FFFFFFFF';

    const headers = [
      'Program', 'Sample', 'Size', 'Quality', gsmLabel,
      'Shade', 'Lbs/Dz', 'Width (In)', 'Width (Cm)',
      'Length (In)', 'Length (Cm)'
    ];

    const headerRow = ws.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: textWhite }, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    samples.forEach(sample => {
      const row = ws.addRow([
        sample.program_name || '-',
        sample.sample || '-',
        sample.size || '-',
        sample.quality || '-',
        sample.gsm || '-',
        sample.shade || '-',
        sample.lbs_per_dz || '-',
        sample.width_in || '-',
        sample.width_cm || '-',
        sample.length_in || '-',
        sample.length_cm || '-',
      ]);

      row.eachCell((cell, col) => {
        if (col >= 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Auto column widths
    ws.columns.forEach(col => {
      col.width = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Samples_${carton_program?.program_name || 'export'}_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast.success("Sample Specifications exported to Excel");
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

  // ====================== DYNAMIC GSM / TC LABEL ======================
  const gsmLabel = details?.program_type === 'BEDSHEET' ? 'TC' : 'GSM';

  // ====================== PRODUCT SPECIFIC DETAILS ======================
  const renderProductSpecificDetails = () => {
    if (!details) return null;
    const programType = details.program_type;

    // BEDSHEET
    if (programType === 'BEDSHEET' && details.bedsheet_details) {
      const bedsheet = details.bedsheet_details;
      return (
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 mt-4">
          <h3 className="text-md font-semibold text-blue-900 mb-4">Bedsheet Specific Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem label="Fabric TC" value={bedsheet.fabric_tc} />
            <DetailItem label="Folding Details" value={bedsheet.folding_details} />
            <DetailItem label="Required Pcs/Polybag" value={bedsheet.required_pcs_per_polybag} />
            <DetailItem label="Polybag Size" value={bedsheet.polybag_size} />
            <DetailItem label="Product Type" value={bedsheet.product_type} />
            <DetailItem label="Special Packing Requirement" value={bedsheet.special_packing_requirement} />
            <DetailItem label="Packing Type" value={bedsheet.packing_type} />
            <DetailItem label="Product Dimension" value={bedsheet.product_dimension} />
            <DetailItem label="Fold Size" value={bedsheet.fold_size} />
            <DetailItem label="Blister Packing Required" value={bedsheet.blister_packing_required} boolean />
            <DetailItem label="Blister Packing Details" value={bedsheet.blister_packing_details} />
            <DetailItem label="Bag Type" value={bedsheet.bag_type} />
            <DetailItem label="Special Box Required" value={bedsheet.special_box_required} />
            <DetailItem label="Required Sets/Carton" value={bedsheet.required_sets_per_carton} />
            <DetailItem label="PolyFold Condition" value={bedsheet.polyfold_condition} />
            <DetailItem label="Filled Product GSM" value={bedsheet.filled_product_gsm} />
          </div>
        </div>
      );
    }

    // TERRY TOWEL
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

    // BATH ROBE
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
  const showInnerPackSizing = isCalculationActive || hasInnerPackData;
  const showPdqSizing = isCalculationActive || hasPdqData;
  const showPalletSizing = isCalculationActive || hasPalletData;

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
                <div className="flex items-center gap-3">

                  {isPPC && (
                    <div className="flex flex-col items-end gap-3 w-full max-w-md">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {/* Remark <span classNam="text-red-500">*</span> */}
                        </label>
                        <textarea
                          value={ppcRemark}
                          onChange={(e) => setPpcRemark(e.target.value)}
                          placeholder="Enter remark"
                          rows={2}
                          className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y min-h-[40px]"
                        />
                      </div>
                    </div>
                  )}
                  {role !== "ppc" && (
                    <button
                      onClick={() => setShowRejectModal(true)}
                      // disabled={actionLoading}
                      className="flex items-center gap-2 px-6 py-2.5 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  )}

                  <button
                    onClick={handleAccept}
                    // disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
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

              {canStartCalculation && !calculationMode && (
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
                  if (hiddenFields.includes(key)) return null;

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

          {/* Program Specifications Table */}
          {subprograms && subprograms.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg border mb-8">
              <div className="p-3 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Program Specifications</h2>
                <button
                  onClick={exportProgramSpecifications}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                  title="Download as Excel"
                >
                  <Download size={16} />
                  Export Excel
                </button>
              </div>
              <div className="p-2 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="text-white">
                    <tr>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Program</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Style</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">PC/Set</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">W-In</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">W-Cm</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">L-In</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">L-Cm</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Wt/Unit</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">{gsmLabel}</th> {/* ← DYNAMIC LABEL */}
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Unit/Carton</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Inner Pack Unit Quantity</th>
                      <th rowSpan="2" className="px-4 py-3 text-left bg-[#0f3460]">Fold</th>

                      {showInnerPackSizing && (
                        <th colSpan="3" className="px-4 py-3 text-center bg-[#04162B]">Packed PB</th>
                      )}
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
                      {showInnerPackSizing && (
                        <>
                          <th className="px-4 py-3 text-center bg-[#04162B]">L (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#04162B]">W (cm)</th>
                          <th className="px-4 py-3 text-center bg-[#04162B]">H (cm)</th>
                        </>
                      )}
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
                        <td className="px-4 py-3">{sp.pcs_per_set ?? "-"}</td>
                        <td className="px-4 py-3">{sp.width_in ?? "-"}</td>
                        <td className="px-4 py-3">{sp.width_cm ?? "-"}</td>
                        <td className="px-4 py-3">{sp.length_in ?? "-"}</td>
                        <td className="px-4 py-3">{sp.length_cm ?? "-"}</td>
                        <td className="px-4 py-3">{sp.wt_per_unit ?? "-"}</td>
                        <td className="px-4 py-3">{sp.gsm ?? "-"}</td>

                        {index === 0 && (
                          <>
                            <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-x text-center">{sp.unit_per_carton ?? "-"}</td>
                            <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-r text-center">{sp.inner_pack_unit_qty ?? "-"}</td>
                            <td rowSpan={subprograms.length} className="px-4 py-3 bg-gray-50 align-middle border-r">{sp.fold ?? "-"}</td>
                          </>
                        )}

                        {showInnerPackSizing && (
                          <>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.packed_pb_length} onChange={(e) => updateCalculationField(index, 'packed_pb_length', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.packed_pb_length ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.packed_pb_width} onChange={(e) => updateCalculationField(index, 'packed_pb_width', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.packed_pb_width ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.packed_pb_height} onChange={(e) => updateCalculationField(index, 'packed_pb_height', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.packed_pb_height ?? "-")}
                            </td>
                          </>
                        )}

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
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.calculated_net_wt_carton} readOnly className="border px-2 py-1 rounded w-20 bg-gray-100 cursor-not-allowed" />
                              ) : (sp.calculated_net_wt_carton ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="number" value={sp.calculated_cbm_per_carton} readOnly className="border px-2 py-1 rounded w-20 bg-gray-100 cursor-not-allowed" />
                              ) : (sp.calculated_cbm_per_carton ?? "-")}
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
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="text" value={sp.ribbon} onChange={(e) => updateCalculationField(index, 'ribbon', e.target.value)} className="border px-2 py-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                              ) : (sp.ribbon ?? "-")}
                            </td>
                            <td className="px-4 py-3">
                              {isCalculationActive ? (
                                <input type="text" value={sp.belly_band} onChange={(e) => updateCalculationField(index, 'belly_band', e.target.value)} className="border px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
                            <td className="px-4 py-3">{sp.cartons_per_20ft ?? "-"}</td>
                            <td className="px-4 py-3">{sp.cartons_per_40ft ?? "-"}</td>
                            <td className="px-4 py-3">{sp.pdq_per_20ft ?? "-"}</td>
                            <td className="px-4 py-3">{sp.pdq_per_40ft ?? "-"}</td>
                            <td className="px-4 py-3">{sp.pallet_per_20ft ?? "-"}</td>
                            <td className="px-4 py-3">{sp.pallet_per_40ft ?? "-"}</td>
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
              <div className="p-3 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sample Specifications</h2>
                <button
                  onClick={exportSampleSpecifications}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                  title="Download as Excel"
                >
                  <Download size={16} />
                  Export Excel
                </button>
              </div>
              <div className="p-2 overflow-x-auto">
                <Table
                  // title="Sample Specifications"
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
                  ]}
                  data={samples}
                  type="flat"
                  readOnly={true}
                />
              </div>
            </div>
          )}

          {/* AI Carton Calculations */}
          {/* {(isMarketing || isTTQM) && ( */}
          <CartonCalculationResults
            programId={id}
            apiBaseUrl={import.meta.env.VITE_API_BASE_URL || 'http://your-api-url'}
          />
          {/* )} */}

          {calculationMode && (
            <div className="flex justify-end gap-4 mb-4 border-t pt-6">
              <button onClick={handleSubmitTentative} className="px-6 py-2 bg-[#0f3460] hover:bg-[#0a2545] text-white rounded cursor-pointer transition-colors">Submit Tentative</button>
              <button onClick={handleSubmitFinal} className="px-6 py-2 bg-[#0f3460] hover:bg-[#0a2545] text-white rounded cursor-pointer transition-colors">Submit Final</button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal & Error Popup unchanged */}
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

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../../api/axiosInstance';
// import { ArrowLeft, Paperclip, Eye } from 'lucide-react';
// import Table from '../Form/Table';
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
//             </div>

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
//                           className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer border ${
//                             noUrl
//                               ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
//                               : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100'
//                           }`}
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
