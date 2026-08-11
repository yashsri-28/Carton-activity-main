import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from './Form';
import Table from './Table';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

function FormMain({ onBack }) {
  const navigate = useNavigate();

  // ==================== STATE ====================
  const [formData, setFormData] = useState({
    productCategory: "",
    companyName: '',
    customerName: '',
    customerType: 'old',
    programName: '',
    customerProtocol: '',
    newOrShifted: '',
    original_towel: '',
    polybagManualAuto: '',
    polybag_type: '',
    palletRequirement: '',
    specialCarton: '',
    specialPDQ: '',
    specialCDU: '',
    sampleCarton: '',
    samplePDQ: '',
    sampleCDU: '',
    singleOrMonsterPDQ: '',
    pdqLayers: '',
    commonPDQ: '',
    smallPDQRequirement: '',
    smallPDQQuantity: '',
    warehouse_store_handling_method: '',
    towel_folded_and_poly_packed_before_carton: '',
    separatorRequired: '',
    ribbonPacking: '',
    bellyBandPacking: '',
    remark: '',
    pcs_per_set: '',
    // ===== BEDSHEET FIELDS =====
    fabric: '',
    folding: '',
    required_pcs_per_polybag: '',
    polybagSize: '',
    productType: '',
    productRequirements: '',
    packingRequirements: '',
    PackingType: '',
    ProductDimension: '',
    FoldSize: '',
    pallet: '',
    BlisterPacking: '',
    BlisterRequired: '',
    BoxRequired: '',
    required_sets_per_carton: '',
    warehouse: '',
    PolyFoldCondition: '',
    filled_product_gsm: '',
    Bagtype: '',

    // ===== TERRY TOWEL FIELDS =====
    towelSizes: '',
    requiredPcsCartonSize: '',
    requiredPolybagsCartonSize: '',
    towelDimensions: '',
    towelWeightPerPiece: '',
    terryFoldingDetails: '',
    terryPcsPerPolybag: '',
    terrySpecialCartonDetails: '',

    // ===== BATH ROBE FIELDS =====
    originalBathRobe: '',
    bathRobeSizes: '',
    bathRobeDimensions: '',
    bathRobeWeight: '',
    bathRobeFoldingDetails: '',
    bathRobePcsPerPolybag: '',
    bathRobePcsPerCarton: '',
    bathRobePolybagType: '',
    bathRobePolybagSizeCarton: '',

    // ==================== NEW: GUSSET MODE & FIELDS ====================
    formMode: "bedsheet",           // ← default is Standard Bedsheet
    gussetWeave: '',
    gussetProductGroup: '',
    gussetSize: '',
    gussetOtherSize: '',
    gussetValueAdditionFlatSheet: '',
    gussetValueAdditionDuvetCover: '',
    gussetValueAdditionFittedSheet: '',
    gussetValueAdditionPillowcase: '',
    gussetFoldSizeInInches: '',
    cardboardRequired: '',
    cardboardFoldType: '',
    cardboardPly: '',
    cardboardFoldOnSide: '',
    polybagRequired: '',
    polybagMaterialType: '',
    polybagOpeningType: '',
    polybagOpeningOnSide: '',
    polybagInlayOrBellyBand: '',
    polybagType: '',
    referenceProgram: '',
    comments: '',
  });

  const [companies, setCompanies] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [lastProgramId, setLastProgramId] = useState(null);

  // Table States
  const [setsTables, setSetsTables] = useState([]);
  const [unitTables, setUnitTables] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);

  // User dropdown
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  useEffect(() => {
    const savedCompany = localStorage.getItem('companyName');
    if (savedCompany && companies.length > 0) {
      const matchingCompany = companies.find(c => c.company_name === savedCompany);
      setFormData(prev => ({
        ...prev,
        companyName: matchingCompany ? matchingCompany.company_name : savedCompany
      }));
    }
  }, [companies]);

  useEffect(() => {
    if (setsTables.length === 0) {
      setSetsTables([createEmptyGroup()]);
    }
    if (unitTables.length === 0) {
      setUnitTables([createEmptyGroup()]);
    }
    if (sampleRows.length === 0) {
      setSampleRows([{}]);
    }
  }, []);

  // ==================== AUTO-POPULATE PROGRAM NAME ====================
  useEffect(() => {
    const programName = formData.programName?.trim();
    if (!programName) return;

    setSetsTables(prev => prev.map(group => ({
      ...group,
      program: programName
    })));

    setUnitTables(prev => prev.map(group => ({
      ...group,
      program: programName
    })));

    setSampleRows(prev => prev.map(row => ({
      ...row,
      col3: programName
    })));
  }, [formData.programName]);

  // ==================== API CALLS ====================
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await api.get('/companies/');
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      const saved = localStorage.getItem('companyName');
      if (saved) {
        setFormData(prev => ({ ...prev, companyName: saved }));
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/users/list/');
      const filteredUsers = response.data.filter(
        user => user.username !== 'admin'
      );
      setUsers(filteredUsers);
      if (filteredUsers.length > 0) {
        setSelectedUserId(filteredUsers[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  // ==================== DYNAMIC GSM / TC LABEL ====================
  const gsmLabel = useMemo(() => {
    return formData.productCategory === 'Bedsheet' ? 'TC' : 'GSM';
  }, [formData.productCategory]);

  // ==================== DYNAMIC HEADERS ====================
  const programHeaders = useMemo(() => [
    { label: "Program", key: "program" },
    { label: "Style", key: "style", hasAddBtn: true },
    { label: "PC/Set", key: "pcs_per_set" },
    { label: "W-In", key: "w_in" },
    { label: "W-Cm", key: "w_cm" },
    { label: "L-In", key: "l_in" },
    { label: "L-Cm", key: "l_cm" },
    { label: "Wt/Unit(gm)", key: "wt_unit" },
    { label: gsmLabel, key: "gsm" },           // ← label changes, key stays "gsm"
    { label: "Unit/Carton", key: "unit_carton" },
    { label: "Inner Pack Unit Quantity", key: "inner_pack" },
    { label: "Fold", key: "fold", tall: true },
    { label: "Remark", key: "remark", tall: true },
    { label: "", key: "actions" }
  ], [gsmLabel]);

  const sampleHeaders = useMemo(() => [
    { label: "Sample", key: "col1", hasAddBtn: true },
    { label: "Size", key: "col2" },
    { label: "Program", key: "col3" },
    { label: "Quality", key: "col4" },
    { label: "LBS/DZ", key: "col5" },
    { label: gsmLabel, key: "col6" },          // ← label changes, key stays "col6"
    { label: "Shade", key: "col7" },
    { label: "W-In", key: "col8" },
    { label: "W-Cm", key: "col9" },
    { label: "L-In", key: "col10" },
    { label: "L-Cm", key: "col11" },
    { label: "", key: "actions" }
  ], [gsmLabel]);

  // ==================== HANDLERS ====================
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCompanyChange = useCallback((e) => {
    const companyName = e.target.value;
    setFormData(prev => ({ ...prev, companyName }));
    if (companyName) {
      localStorage.setItem('companyName', companyName);
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const handleRemoveFile = useCallback((e) => {
    e.stopPropagation();
    setSelectedFile(null);
  }, []);

  // ==================== TABLE HELPERS ====================
  const createEmptyGroup = useCallback(() => ({
    program: formData.programName || '',
    unit_carton: '',
    pcs_per_set: '',
    inner_pack: '',
    fold: '',
    remark: '',
    variants: [{
      style: '',
      pc_set: '',
      w_in: '',
      w_cm: '',
      l_in: '',
      l_cm: '',
      wt_unit: '',
      gsm: '',
    }]
  }), [formData.programName]);

  // Table Action Handlers (Sets)
  const handleSetsActions = {
    onAddRow: (idx) => setSetsTables(prev => prev.map((t, i) => i === idx ? { ...t, variants: [...t.variants, {}] } : t)),
    onDeleteRow: (groupIdx, rowIdx) => setSetsTables(prev => prev.map((g, i) => i === groupIdx ? { ...g, variants: g.variants.filter((_, r) => r !== rowIdx) } : g)),
    onAddTable: (idx) => setSetsTables(prev => [...prev.slice(0, idx + 1), createEmptyGroup(), ...prev.slice(idx + 1)]),
    onCopyTable: (idx) => setSetsTables(prev => [...prev, structuredClone(prev[idx])]),
    onDeleteTable: (idx) => setSetsTables(prev => prev.filter((_, i) => i !== idx))
  };

  // Table Action Handlers (Units)
  const handleUnitActions = {
    onAddRow: (idx) => setUnitTables(prev => prev.map((t, i) => i === idx ? { ...t, variants: [...t.variants, {}] } : t)),
    onDeleteRow: (groupIdx, rowIdx) => setUnitTables(prev => prev.map((g, i) => i === groupIdx ? { ...g, variants: g.variants.filter((_, r) => r !== rowIdx) } : g)),
    onAddTable: (idx) => setUnitTables(prev => [...prev.slice(0, idx + 1), createEmptyGroup(), ...prev.slice(idx + 1)]),
    onCopyTable: (idx) => setUnitTables(prev => [...prev, structuredClone(prev[idx])]),
    onDeleteTable: (idx) => setUnitTables(prev => prev.filter((_, i) => i !== idx))
  };

  // Sample Actions
  const handleSampleActions = {
    onAddRow: () => setSampleRows(prev => [...prev, { col3: formData.programName || '' }]),
    onDeleteRow: (idx) => setSampleRows(prev => prev.filter((_, i) => i !== idx))
  };

  const handleUpdateSetsCell = useCallback((groupIdx, variantIdx, field, value) => {
    setSetsTables(prev => prev.map((group, gIdx) => {
      if (gIdx !== groupIdx) return group;
      if (variantIdx === null) {
        return { ...group, [field]: value };
      }
      const newVariants = group.variants.map((v, vI) =>
        vI === variantIdx ? { ...v, [field]: value } : v
      );
      return { ...group, variants: newVariants };
    }));
  }, []);

  const handleUpdateUnitCell = useCallback((groupIdx, variantIdx, field, value) => {
    setUnitTables(prev => prev.map((group, gIdx) => {
      if (gIdx !== groupIdx) return group;
      if (variantIdx === null) {
        return { ...group, [field]: value };
      }
      const newVariants = group.variants.map((v, vI) =>
        vI === variantIdx ? { ...v, [field]: value } : v
      );
      return { ...group, variants: newVariants };
    }));
  }, []);

  const handleUpdateSampleCell = useCallback((rowIdx, _, field, value) => {
    setSampleRows(prev => prev.map((row, rIdx) =>
      rIdx === rowIdx ? { ...row, [field]: value } : row
    ));
  }, []);

  const addVariantToLastGroup = (setTables) => {
    setTables(prev => {
      if (prev.length === 0) {
        return [{
          program: formData.programName || '',
          unit_carton: '',
          pcs_per_set: '',
          inner_pack: '',
          fold: '',
          remark: '',
          variants: [{
            style: '',
            pc_set: '',
            w_in: '',
            w_cm: '',
            l_in: '',
            l_cm: '',
            wt_unit: '',
            gsm: '',
          }]
        }];
      }
      return prev.map((group, i) =>
        i === prev.length - 1
          ? {
            ...group,
            variants: [
              ...group.variants,
              {
                style: '',
                w_in: '',
                w_cm: '',
                l_in: '',
                l_cm: '',
                wt_unit: '',
                gsm: '',
              }
            ]
          }
          : group
      );
    });
  };

  // ==================== ATTACHMENT UPLOAD FUNCTION ====================
  const uploadAttachment = async (programId, file) => {
    try {
      const formData = new FormData();
      formData.append('program_id', programId);
      formData.append('file', file);

      const response = await api.post(
        '/api/carton-program/attachment/upload/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      return {
        success: true,
        message: response.data?.message || 'Attachment uploaded successfully'
      };
    } catch (error) {
      console.warn('Attachment upload failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Attachment upload failed'
      };
    }
  };

  // ==================== GET PROGRAM TYPE ====================
  const getProgramType = () => {
    switch (formData.productCategory) {
      case 'Bedsheet':
        return 'BEDSHEET';
      case 'Terry Towel':
        return 'TERRY_TOWEL';
      case 'Bath Robe':
        return 'BATH_ROBE';
      default:
        return 'TOWEL';
    }
  };

  // ==================== BUILD PRODUCT-SPECIFIC DETAILS ====================
  const buildProductDetails = () => {
    const programType = getProgramType();

    if (programType === 'BEDSHEET') {
      return {
        bedsheet_details: {
          fabric_tc: formData.fabric?.trim() || "",
          folding_details: formData.folding?.trim() || "",
          required_pcs_per_polybag: (formData.required_pcs_per_polybag) || 0,
          polybag_size: formData.polybagSize?.trim() || "",
          product_type: formData.productType?.trim() || "",
          special_packing_requirement: formData.packingRequirements?.trim() || "",
          packing_type: formData.PackingType?.trim() || "",
          product_dimension: formData.ProductDimension?.trim() || "",
          fold_size: formData.FoldSize?.trim() || "",
          blister_packing_required: formData.BlisterPacking === "Yes",
          blister_packing_details: formData.BlisterRequired?.trim() || "",
          bag_type: formData.Bagtype?.trim() || "",
          special_box_required: formData.BoxRequired?.trim() || "",
          required_sets_per_carton: (formData.required_sets_per_carton) || 0,
          polyfold_condition: formData.PolyFoldCondition?.trim() || "",
          filled_product_gsm: (formData.filled_product_gsm) || 0,
          // remark: (formData.remark) || "",
        }
      };
    }

    if (programType === 'TERRY_TOWEL') {
      return {
        terry_details: {
          towel_sizes: formData.towelSizes?.trim() || "",
          required_pcs_carton_size: formData.requiredPcsCartonSize?.trim() || "",
          required_polybags_carton_size: formData.requiredPolybagsCartonSize?.trim() || "",
          towel_dimensions: formData.towelDimensions?.trim() || "",
          towel_weight_per_piece: Number(formData.towelWeightPerPiece) || 0,
          folding_details: formData.terryFoldingDetails?.trim() || "",
          required_pcs_per_polybag: Number(formData.terryPcsPerPolybag) || 0,
          special_carton_details: formData.terrySpecialCartonDetails?.trim() || "",
          remark: (formData.remark) || "",
        }
      };
    }

    if (programType === 'BATH_ROBE') {
      return {
        bathrobe_details: {
          original_bath_robe: formData.originalBathRobe?.trim() || "",
          bath_robe_sizes: formData.bathRobeSizes?.trim() || "",
          bath_robe_dimensions: formData.bathRobeDimensions?.trim() || "",
          bath_robe_weight: Number(formData.bathRobeWeight) || 0,
          folding_details: formData.bathRobeFoldingDetails?.trim() || "",
          required_pcs_per_polybag: Number(formData.bathRobePcsPerPolybag) || 0,
          required_pcs_per_carton: Number(formData.bathRobePcsPerCarton) || 0,
          polybag_type: formData.bathRobePolybagType?.trim() || "",
          polybag_size_carton: formData.bathRobePolybagSizeCarton?.trim() || "",
          remark: (formData.remark) || "",
        }
      };
    }

    return {};
  };

  // ==================== MAIN SUBMIT ====================
  const handleSubmit = async (status = 'Pending') => {
    if (!formData.programName?.trim() || !formData.customerName?.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Program Name and Customer Name are required');
      setTimeout(() => setSubmitStatus(null), 5000);
      return;
    }

    setLoading(true);
    setSubmitStatus(null);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (formData.formMode === "gusset") {
        // ====================== GUSSET PAYLOAD ======================
        const gussetPayload = {
          customer_name: formData.customerName.trim(),
          program_name: formData.programName.trim(),
          tc: formData.fabric?.trim() || "",
          weave: formData.gussetWeave?.trim() || "",
          product_group: formData.gussetProductGroup?.trim() || "",
          size: formData.gussetSize?.trim() || "",
          down: formData.gussetOtherSize?.trim() || "",
          value_addition_flat_sheet: formData.gussetValueAdditionFlatSheet?.trim() || "",
          value_addition_duvet_cover: formData.gussetValueAdditionDuvetCover?.trim() || "",
          value_addition_fitted_sheet: formData.gussetValueAdditionFittedSheet?.trim() || "",
          value_addition_pillowcase: formData.gussetValueAdditionPillowcase?.trim() || "",
          fold_size_inches: formData.gussetFoldSizeInInches?.toString() || "",
          cardboard_required: formData.cardboardRequired === "Yes",
          fold_type: formData.cardboardFoldType?.trim() || "",
          ply: formData.cardboardPly?.trim() || "",
          fold_on_side: formData.cardboardFoldOnSide?.trim() || "",
          reference_program: formData.referenceProgram?.trim() || "",
          comments: formData.comments?.trim() || "",
          polybag_required: formData.polybagRequired === "Yes",
          material_type: formData.polybagMaterialType?.trim() || "",
          opening_type: formData.polybagOpeningType?.trim() || "",
          opening_on_side: formData.polybagOpeningOnSide?.trim() || "",
          inlay_or_belly_band: formData.polybagInlayOrBellyBand?.trim() || "",
          polybag_type: formData.polybagType?.trim() || "",

          program_specifications: [...setsTables, ...unitTables]
            .flatMap(group =>
              group.variants
                .filter(v => v.style || v.w_in || v.gsm)
                .map(v => ({
                  program: group.program?.trim() || "",
                  style: v.style?.trim() || "",
                  width_in: Number(v.w_in) || 0,
                  width_cm: Number(v.w_cm) || 0,
                  length_in: Number(v.l_in) || 0,
                  length_cm: Number(v.l_cm) || 0,
                  wt_per_unit: Number(v.wt_unit) || 0,
                  gsm: Number(v.gsm) || 0,
                  unit_per_carton: Number(group.unit_carton)|| 0,
                  inner_pack_unit_qty: group.inner_pack?.trim() || "",
                  fold: group.fold?.trim() || ""
                }))
            ),

          samples: sampleRows
            .filter(r => r.col1 || r.col2)
            .map(r => ({
              program_name: r.col3?.trim() || "",
              size: r.col2?.trim() || "",
              sample: r.col1?.trim() || "",
              quality: r.col4?.trim() || "",
              lbs_per_dz: Number(r.col5) || 0,
              gsm: Number(r.col6) || 0,
              shade: r.col7?.trim() || "",
              width_in: Number(r.col8) || 0,
              length_in: Number(r.col10) || 0,
              width_cm: Number(r.col9) || 0,
              length_cm: Number(r.col11) || 0
            }))
        };

        await api.post('/api/submit/', gussetPayload);
        toast.success("Gusset Program Submitted Successfully");
      } else {
        const programType = getProgramType();
        const productDetails = buildProductDetails();
        const toBool = (val) => val === "True" || val === "Yes" || val === true;

        const payload = {
          activity_name: formData.activityName?.trim() || '',
          program_name: formData.programName.trim(),
          program_type: programType,
          btn: status,
          sent_to_user_id: selectedUserId,

          carton_program: {
            customer_name: formData.customerName.trim(),
            customer_protocol: formData.customerProtocol?.trim() || "",
            confirm_new_or_shifted_from_vapi: formData.newOrShifted?.trim() || "",
            original_towel: formData.original_towel?.trim() || "",
            polybag_manual_or_automatic: formData.polybagManualAuto?.trim() || "",
            polybag_type: formData.polybag_type?.trim() || "",
            special_carton_required: toBool(formData.specialCarton),
            pdq_required: toBool(formData.specialPDQ),
            cdu_required: toBool(formData.specialCDU),
            sample_carton_arranged: toBool(formData.sampleCarton),
            pdq_arranged: toBool(formData.samplePDQ),
            cdu_arranged: toBool(formData.sampleCDU),
            pallet_or_slipsheet_requirement: toBool(formData.palletRequirement),

            shipped_as_single_pdq_or_monster_pdq: formData.singleOrMonsterPDQ?.trim() || "",
            pdq_layers_stacking_details: formData.pdqLayers?.trim() || "",
            common_pdq_same_dimension_for_all_sizes: formData.commonPDQ?.trim() || "",
            small_pdq_on_pallet_or_slipsheet: formData.smallPDQRequirement?.trim() || "",
            small_pdq_count_on_pallet_or_slipsheet: formData.smallPDQQuantity?.trim() || "",
            warehouse_store_handling_method: formData.warehouse_store_handling_method?.trim() || "",
            towel_folded_and_poly_packed_before_carton: formData.towel_folded_and_poly_packed_before_carton?.trim() || "",
            separator_protector_stiffener_required: formData.separatorRequired?.trim() || "",
            ribbon_packing_required: formData.ribbonPacking?.trim() || "",
            belly_band_packing_required: formData.bellyBandPacking?.trim() || "",
            remark: formData.remark?.trim() || ""
          },

          subprograms: [...setsTables, ...unitTables]
            .filter(group => group.program?.trim())
            .flatMap(group => {
              return group.variants
                .filter(variant =>
                  variant.style?.trim() ||
                  variant.w_in?.trim() ||
                  variant.w_cm?.trim() ||
                  variant.l_in?.trim() ||
                  variant.l_cm?.trim() ||
                  variant.wt_unit?.trim() ||
                  variant.gsm?.trim()
                )
                .map(variant => ({
                  program_name: group.program?.trim() || "",
                  style: variant.style?.trim() || "",
                  width_in: Number(variant.w_in) || 0,
                  width_cm: Number(variant.w_cm) || 0,
                  length_in: Number(variant.l_in) || 0,
                  length_cm: Number(variant.l_cm) || 0,
                  wt_per_unit: Number(variant.wt_unit) || 0,
                  gsm: Number(variant.gsm) || 0,
                  unit_per_carton: Number(group.unit_carton) || 0,
                  pcs_per_set: Number(group.pcs_per_set) || 0,
                  inner_pack_unit_qty: group.inner_pack?.trim() || "",
                  fold: group.fold?.trim() || "",
                  remark: group.remark?.trim() || ""
                }));
            }),

          samples: sampleRows
            .filter(row => row.col1 || row.col2)
            .map(row => ({
              program_name: row.col3?.trim() || "",
              size: row.col2?.trim() || "",
              sample: row.col1?.trim() || "",
              quality: row.col4?.trim() || "",
              lbs_per_dz: Number(row.col5) || 0,
              gsm: Number(row.col6) || 0,
              shade: row.col7?.trim() || "",
              width_in: Number(row.col8) || 0,
              width_cm: Number(row.col9) || 0,
              length_in: Number(row.col10) || 0,
              length_cm: Number(row.col11) || 0
            })),

          ...productDetails
        };

        const submitResponse = await api.post('/api/carton-program/submit/', payload, {
          headers: { 'Content-Type': 'application/json' }
        });

        const { program_id } = submitResponse.data;
        setLastProgramId(program_id);
        localStorage.setItem('last_submitted_program_id', program_id);

        let attachmentResult = null;
        if (selectedFile && program_id) {
          attachmentResult = await uploadAttachment(program_id, selectedFile);
        }

        let successMsg = `Carton Program ${status === 'Draft' ? 'Saved as Draft' : 'Submitted'} Successfully`;
        if (attachmentResult) {
          successMsg += attachmentResult.success
            ? ` • Attachment Uploaded`
            : ` • Attachment upload failed: ${attachmentResult.message}`;
        }

        toast.success(successMsg);
      }
      setTimeout(() => navigate('/'), 1500);

    } catch (error) {
      console.error('❌ Submit failed:', error);
      const errMsg = error.response?.data?.error || error.response?.data?.detail || error.message || 'Unknown error';
      setErrorMessage(`Submission failed: ${errMsg}`);
      toast.error(`Submission failed: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="h-full overflow-y-auto bg-gray-50 font-sans text-sm">
      <div className="pb-4 pr-4 pl-4 max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-gray-50 mb-6 border-b border-gray-200 py-4">
          <div className="flex items-center gap-4 max-w-7xl mx-auto px-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white shadow cursor-pointer hover:bg-gray-100 rounded-full transition-colors group"
              disabled={loading}
            >
              <svg className="w-5 h-5 text-gray-500 group-hover:text-[#0f3460]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Fill Carton Program Details</h1>
          </div>
        </div>

        {/* Form */}
        <Form
          formData={formData}
          onInputChange={handleInputChange}
          onCompanyChange={handleCompanyChange}
          companies={companies}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          loading={loading}
        />

        {/* Tables */}
        <div className="space-y-10 mt-8">
          <Table
            title="Program Specifications"
            headers={programHeaders}
            data={setsTables}
            type="grouped"
            onAddRow={() => addVariantToLastGroup(setSetsTables)}
            onDeleteRow={handleSetsActions.onDeleteRow}
            onAddTable={handleSetsActions.onAddTable}
            onCopyTable={handleSetsActions.onCopyTable}
            onDeleteTable={handleSetsActions.onDeleteTable}
            onUpdateCell={handleUpdateSetsCell}
          />

          <Table
            title="Sample Specifications"
            headers={sampleHeaders}
            data={sampleRows}
            type="flat"
            onAddRow={handleSampleActions.onAddRow}
            onDeleteRow={handleSampleActions.onDeleteRow}
            onUpdateCell={handleUpdateSampleCell}
          />
        </div>

        {/* Footer */}
        <div className="bg-white p-6 my-12 rounded-lg shadow-sm border border-gray-100 flex justify-between items-end">
          <div className="w-72">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Request Sent To
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-3 bg-white text-gray-700 focus:outline-none focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460] cursor-pointer"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              disabled={loading}
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => handleSubmit('Save As Draft')}
              disabled={loading}
              className={`px-10 mr-3 py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer text-white ${loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#0f3460] hover:bg-[#0a2545]'}`}
            >
              {loading ? 'Saving Draft...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSubmit('Pending')}
              disabled={loading}
              className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer text-white ${loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#0f3460] hover:bg-[#0a2545]'}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : 'Submit Carton Program'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormMain;

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Form from './Form';
// import Table from './Table';
// import api from '../../api/axiosInstance';
// import { toast } from 'react-toastify';

// function FormMain({ onBack }) {
//   const navigate = useNavigate();

//   // ==================== STATE ====================
//   const [formData, setFormData] = useState({
//     productCategory: "",
//     companyName: '',
//     customerName: '',
//     customerType: 'old', // Add this for old/new toggle
//     programName: '',
//     customerProtocol: '',
//     newOrShifted: '',
//     original_towel: '',
//     polybagManualAuto: '',
//     polybag_type: '',
//     palletRequirement: '',
//     specialCarton: '',
//     specialPDQ: '',
//     specialCDU: '',
//     sampleCarton: '',
//     samplePDQ: '',
//     sampleCDU: '',
//     singleOrMonsterPDQ: '',
//     pdqLayers: '',
//     commonPDQ: '',
//     smallPDQRequirement: '',
//     smallPDQQuantity: '',
//     warehouse_store_handling_method: '',
//     towel_folded_and_poly_packed_before_carton: '',
//     separatorRequired: '',
//     ribbonPacking: '',
//     bellyBandPacking: '',

//     // ===== BEDSHEET FIELDS =====
//     fabric: '',
//     folding: '',
//     required_pcs_per_polybag: '',
//     polybagSize: '',
//     productType: '',
//     productRequirements: '',
//     packingRequirements: '',
//     PackingType: '',
//     ProductDimension: '',
//     FoldSize: '',
//     pallet: '',
//     BlisterPacking: '',
//     BlisterRequired: '',
//     BoxRequired: '',
//     required_sets_per_carton: '',
//     warehouse: '',
//     PolyFoldCondition: '',
//     filled_product_gsm: '',
//     Bagtype: '',

//     // ===== TERRY TOWEL FIELDS =====
//     towelSizes: '',
//     requiredPcsCartonSize: '',
//     requiredPolybagsCartonSize: '',
//     towelDimensions: '',
//     towelWeightPerPiece: '',
//     terryFoldingDetails: '',
//     terryPcsPerPolybag: '',
//     terrySpecialCartonDetails: '',

//     // ===== BATH ROBE FIELDS =====
//     originalBathRobe: '',
//     bathRobeSizes: '',
//     bathRobeDimensions: '',
//     bathRobeWeight: '',
//     bathRobeFoldingDetails: '',
//     bathRobePcsPerPolybag: '',
//     bathRobePcsPerCarton: '',
//     bathRobePolybagType: '',
//     bathRobePolybagSizeCarton: '',
//   });

//   const [companies, setCompanies] = useState([]);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [submitStatus, setSubmitStatus] = useState(null);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [lastProgramId, setLastProgramId] = useState(null);

//   // Table States
//   const [setsTables, setSetsTables] = useState([]);
//   const [unitTables, setUnitTables] = useState([]);
//   const [sampleRows, setSampleRows] = useState([]);

//   // User dropdown
//   const [users, setUsers] = useState([]);
//   const [selectedUserId, setSelectedUserId] = useState('');

//   // ==================== EFFECTS ====================
//   useEffect(() => {
//     fetchUsers();
//     fetchCompanies();
//   }, []);

//   useEffect(() => {
//     const savedCompany = localStorage.getItem('companyName');
//     if (savedCompany && companies.length > 0) {
//       const matchingCompany = companies.find(c => c.company_name === savedCompany);
//       setFormData(prev => ({
//         ...prev,
//         companyName: matchingCompany ? matchingCompany.company_name : savedCompany
//       }));
//     }
//   }, [companies]);

//   useEffect(() => {
//     if (setsTables.length === 0) {
//       setSetsTables([createEmptyGroup()]);
//     }
//     if (unitTables.length === 0) {
//       setUnitTables([createEmptyGroup()]);
//     }
//     if (sampleRows.length === 0) {
//       setSampleRows([{}]);
//     }
//   }, []);

//   // ==================== AUTO-POPULATE PROGRAM NAME ====================
//   useEffect(() => {
//     const programName = formData.programName?.trim();
//     if (!programName) return;

//     setSetsTables(prev => prev.map(group => ({
//       ...group,
//       program: programName
//     })));

//     setUnitTables(prev => prev.map(group => ({
//       ...group,
//       program: programName
//     })));

//     setSampleRows(prev => prev.map(row => ({
//       ...row,
//       col3: programName
//     })));
//   }, [formData.programName]);

//   // ==================== API CALLS ====================
//   const fetchCompanies = useCallback(async () => {
//     try {
//       const response = await api.get('/companies/');
//       setCompanies(response.data);
//     } catch (error) {
//       console.error('Failed to fetch companies:', error);
//       const saved = localStorage.getItem('companyName');
//       if (saved) {
//         setFormData(prev => ({ ...prev, companyName: saved }));
//       }
//     }
//   }, []);

//   const fetchUsers = useCallback(async () => {
//     try {
//       const response = await api.get('/api/users/list/');
//       const filteredUsers = response.data.filter(
//         user => user.username !== 'admin'
//       );
//       setUsers(filteredUsers);
//       if (filteredUsers.length > 0) {
//         setSelectedUserId(filteredUsers[0].id);
//       }
//     } catch (error) {
//       console.error('Failed to fetch users:', error);
//     }
//   }, []);

//   // ==================== HANDLERS ====================
//   const handleInputChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   }, []);

//   const handleCompanyChange = useCallback((e) => {
//     const companyName = e.target.value;
//     setFormData(prev => ({ ...prev, companyName }));
//     if (companyName) {
//       localStorage.setItem('companyName', companyName);
//     }
//   }, []);

//   const handleFileChange = useCallback((e) => {
//     if (e.target.files?.[0]) {
//       setSelectedFile(e.target.files[0]);
//     }
//   }, []);

//   const handleRemoveFile = useCallback((e) => {
//     e.stopPropagation();
//     setSelectedFile(null);
//   }, []);

//   // ==================== TABLE HELPERS ====================
//   const createEmptyGroup = useCallback(() => ({
//     program: formData.programName || '',
//     unit_carton: '',
//     inner_pack: '',
//     fold: '',
//     variants: [{
//       style: '',
//       w_in: '',
//       w_cm: '',
//       l_in: '',
//       l_cm: '',
//       wt_unit: '',
//       gsm: '',
//     }]
//   }), [formData.programName]);

//   const programHeaders = [
//     { label: "Program", key: "program" },
//     { label: "Style", key: "style", hasAddBtn: true },
//     { label: "W-In", key: "w_in" },
//     { label: "W-Cm", key: "w_cm" },
//     { label: "L-In", key: "l_in" },
//     { label: "L-Cm", key: "l_cm" },
//     { label: "Wt/Unit", key: "wt_unit" },
//     { label: "GSM", key: "gsm" },
//     { label: "Unit/Carton", key: "unit_carton" },
//     { label: "Inner Pack Unit Quantity", key: "inner_pack" },
//     { label: "Fold", key: "fold" },
//     { label: "", key: "actions" }
//   ];

//   const sampleHeaders = [
//     { label: "Sample", key: "col1", hasAddBtn: true },
//     { label: "Size", key: "col2" },
//     { label: "Program", key: "col3" },
//     { label: "Quality", key: "col4" },
//     { label: "LBS/DZ", key: "col5" },
//     { label: "GSM", key: "col6" },
//     { label: "Shade", key: "col7" },
//     { label: "W-In", key: "col8" },
//     { label: "W-Cm", key: "col9" },
//     { label: "L-In", key: "col10" },
//     { label: "L-Cm", key: "col11" },
//     { label: "", key: "actions" }
//   ];

//   // Table Action Handlers (Sets)
//   const handleSetsActions = {
//     onAddRow: (idx) => setSetsTables(prev => prev.map((t, i) => i === idx ? { ...t, variants: [...t.variants, {}] } : t)),
//     onDeleteRow: (groupIdx, rowIdx) => setSetsTables(prev => prev.map((g, i) => i === groupIdx ? { ...g, variants: g.variants.filter((_, r) => r !== rowIdx) } : g)),
//     onAddTable: (idx) => setSetsTables(prev => [...prev.slice(0, idx + 1), createEmptyGroup(), ...prev.slice(idx + 1)]),
//     onCopyTable: (idx) => setSetsTables(prev => [...prev, structuredClone(prev[idx])]),
//     onDeleteTable: (idx) => setSetsTables(prev => prev.filter((_, i) => i !== idx))
//   };

//   // Table Action Handlers (Units)
//   const handleUnitActions = {
//     onAddRow: (idx) => setUnitTables(prev => prev.map((t, i) => i === idx ? { ...t, variants: [...t.variants, {}] } : t)),
//     onDeleteRow: (groupIdx, rowIdx) => setUnitTables(prev => prev.map((g, i) => i === groupIdx ? { ...g, variants: g.variants.filter((_, r) => r !== rowIdx) } : g)),
//     onAddTable: (idx) => setUnitTables(prev => [...prev.slice(0, idx + 1), createEmptyGroup(), ...prev.slice(idx + 1)]),
//     onCopyTable: (idx) => setUnitTables(prev => [...prev, structuredClone(prev[idx])]),
//     onDeleteTable: (idx) => setUnitTables(prev => prev.filter((_, i) => i !== idx))
//   };

//   // Sample Actions
//   const handleSampleActions = {
//     onAddRow: () => setSampleRows(prev => [...prev, { col3: formData.programName || '' }]),
//     onDeleteRow: (idx) => setSampleRows(prev => prev.filter((_, i) => i !== idx))
//   };

//   const handleUpdateSetsCell = useCallback((groupIdx, variantIdx, field, value) => {
//     setSetsTables(prev => prev.map((group, gIdx) => {
//       if (gIdx !== groupIdx) return group;
//       if (variantIdx === null) {
//         return { ...group, [field]: value };
//       }
//       const newVariants = group.variants.map((v, vI) =>
//         vI === variantIdx ? { ...v, [field]: value } : v
//       );
//       return { ...group, variants: newVariants };
//     }));
//   }, []);

//   const handleUpdateUnitCell = useCallback((groupIdx, variantIdx, field, value) => {
//     setUnitTables(prev => prev.map((group, gIdx) => {
//       if (gIdx !== groupIdx) return group;
//       if (variantIdx === null) {
//         return { ...group, [field]: value };
//       }
//       const newVariants = group.variants.map((v, vI) =>
//         vI === variantIdx ? { ...v, [field]: value } : v
//       );
//       return { ...group, variants: newVariants };
//     }));
//   }, []);

//   const handleUpdateSampleCell = useCallback((rowIdx, _, field, value) => {
//     setSampleRows(prev => prev.map((row, rIdx) =>
//       rIdx === rowIdx ? { ...row, [field]: value } : row
//     ));
//   }, []);

//   const addVariantToLastGroup = (setTables) => {
//     setTables(prev => {
//       if (prev.length === 0) {
//         return [{
//           program: formData.programName || '',
//           unit_carton: '',
//           inner_pack: '',
//           fold: '',
//           variants: [{
//             style: '',
//             w_in: '',
//             w_cm: '',
//             l_in: '',
//             l_cm: '',
//             wt_unit: '',
//             gsm: '',
//           }]
//         }];
//       }
//       return prev.map((group, i) =>
//         i === prev.length - 1
//           ? {
//             ...group,
//             variants: [
//               ...group.variants,
//               {
//                 style: '',
//                 w_in: '',
//                 w_cm: '',
//                 l_in: '',
//                 l_cm: '',
//                 wt_unit: '',
//                 gsm: '',
//               }
//             ]
//           }
//           : group
//       );
//     });
//   };

//   const resetForm = () => {
//     setFormData(prev => ({
//       ...prev,
//       customerName: '',
//       programName: '',
//       customerProtocol: '',
//       newOrShifted: '',
//       original_towel: '',
//       polybagManualAuto: '',
//       polybag_type: '',
//       palletRequirement: '',
//       specialCarton: '',
//       sampleCarton: '',
//       singleOrMonsterPDQ: '',
//       pdqLayers: '',
//       commonPDQ: '',
//       smallPDQRequirement: '',
//       smallPDQQuantity: '',
//       warehouse_store_handling_method: '',
//       towel_folded_and_poly_packed_before_carton: '',
//       separatorRequired: '',
//       ribbonPacking: '',
//       bellyBandPacking: ''
//     }));
//     setSelectedFile(null);
//     setSetsTables([createEmptyGroup()]);
//     setUnitTables([createEmptyGroup()]);
//     setSampleRows([{}]);
//     setLastProgramId(null);
//     setSuccessMessage('');
//   };

//   // ==================== ATTACHMENT UPLOAD FUNCTION ====================
//   const uploadAttachment = async (programId, file) => {
//     try {
//       const formData = new FormData();
//       formData.append('program_id', programId);
//       formData.append('file', file);

//       const response = await api.post(
//         '/api/carton-program/attachment/upload/',
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           }
//         }
//       );

//       return {
//         success: true,
//         message: response.data?.message || 'Attachment uploaded successfully'
//       };
//     } catch (error) {
//       console.warn('Attachment upload failed:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Attachment upload failed'
//       };
//     }
//   };

//   // ==================== GET PROGRAM TYPE ====================
//   const getProgramType = () => {
//     switch (formData.productCategory) {
//       case 'Bedsheet':
//         return 'BEDSHEET';
//       case 'Terry Towel':
//         return 'TERRY_TOWEL';
//       case 'Bath Robe':
//         return 'BATH_ROBE';
//       default:
//         return 'TOWEL';
//     }
//   };

//   // ==================== BUILD PRODUCT-SPECIFIC DETAILS ====================
//   const buildProductDetails = () => {
//     const programType = getProgramType();

//     if (programType === 'BEDSHEET') {
//       return {
//         bedsheet_details: {
//           fabric_tc: formData.fabric?.trim() || "",
//           folding_details: formData.folding?.trim() || "",
//           required_pcs_per_polybag: (formData.required_pcs_per_polybag) || 0,
//           polybag_size: formData.polybagSize?.trim() || "",
//           product_type: formData.productType?.trim() || "",
//           special_packing_requirement: formData.packingRequirements?.trim() || "",
//           packing_type: formData.PackingType?.trim() || "",
//           product_dimension: formData.ProductDimension?.trim() || "",
//           fold_size: formData.FoldSize?.trim() || "",
//           blister_packing_required: formData.BlisterPacking === "Yes",
//           blister_packing_details: formData.BlisterRequired?.trim() || "",
//           bag_type: formData.Bagtype?.trim() || "",
//           special_box_required: formData.BoxRequired?.trim() || "",
//           required_sets_per_carton: (formData.required_sets_per_carton) || 0,
//           polyfold_condition: formData.PolyFoldCondition?.trim() || "",
//           filled_product_gsm: (formData.filled_product_gsm) || 0,
//         }
//       };
//     }

//     if (programType === 'TERRY_TOWEL') {
//       return {
//         terry_details: {
//           towel_sizes: formData.towelSizes?.trim() || "",
//           required_pcs_carton_size: formData.requiredPcsCartonSize?.trim() || "",
//           required_polybags_carton_size: formData.requiredPolybagsCartonSize?.trim() || "",
//           towel_dimensions: formData.towelDimensions?.trim() || "",
//           towel_weight_per_piece: Number(formData.towelWeightPerPiece) || 0,
//           folding_details: formData.terryFoldingDetails?.trim() || "",
//           required_pcs_per_polybag: Number(formData.terryPcsPerPolybag) || 0,
//           special_carton_details: formData.terrySpecialCartonDetails?.trim() || "",
//         }
//       };
//     }

//     if (programType === 'BATH_ROBE') {
//       return {
//         bathrobe_details: {
//           original_bath_robe: formData.originalBathRobe?.trim() || "",
//           bath_robe_sizes: formData.bathRobeSizes?.trim() || "",
//           bath_robe_dimensions: formData.bathRobeDimensions?.trim() || "",
//           bath_robe_weight: Number(formData.bathRobeWeight) || 0,
//           folding_details: formData.bathRobeFoldingDetails?.trim() || "",
//           required_pcs_per_polybag: Number(formData.bathRobePcsPerPolybag) || 0,
//           required_pcs_per_carton: Number(formData.bathRobePcsPerCarton) || 0,
//           polybag_type: formData.bathRobePolybagType?.trim() || "",
//           polybag_size_carton: formData.bathRobePolybagSizeCarton?.trim() || "",
//         }
//       };
//     }

//     return {};
//   };

//   // ==================== MAIN SUBMIT WITH SEQUENTIAL API CALLS ====================
//   const handleSubmit = async (status = 'Pending') => {
//     // Validation
//     if (!formData.programName?.trim() || !formData.customerName?.trim()) {
//       setSubmitStatus('error');
//       setErrorMessage('Program Name and Customer Name are required');
//       setTimeout(() => setSubmitStatus(null), 5000);
//       return;
//     }

//     setLoading(true);
//     setSubmitStatus(null);
//     setErrorMessage('');
//     setSuccessMessage('');

//     try {
//       const programType = getProgramType();
//       const productDetails = buildProductDetails();
//       const toBool = (val) => val === "True" || val === "Yes" || val === true;
//       // ========== STEP 1: BUILD BASE PAYLOAD ==========
//       const payload = {
//         activity_name: formData.activityName?.trim() || '',
//         program_name: formData.programName.trim(),
//         program_type: programType,
//         btn: status,
//         sent_to_user_id: selectedUserId,

//         carton_program: {
//           customer_name: formData.customerName.trim(),
//           customer_protocol: formData.customerProtocol?.trim() || "",
//           confirm_new_or_shifted_from_vapi: formData.newOrShifted?.trim() || "",
//           original_towel: formData.original_towel?.trim() || "",
//           polybag_manual_or_automatic: formData.polybagManualAuto?.trim() || "",
//           polybag_type: formData.polybag_type?.trim() || "",
//           // pallet_or_slipsheet_requirement: formData.palletRequirement === "True",
//           // special_carton_required: formData.specialCarton === "True",
//           // pdq_required: formData.specialPDQ === "True",
//           // cdu_required: formData.specialCDU === "True",
//           // sample_carton_arranged: formData.sampleCarton === "True",
//           // pdq_arranged: formData.samplePDQ === "True",
//           // cdu_arranged: formData.sampleCDU === "True",
//           special_carton_required: toBool(formData.specialCarton),
//           pdq_required: toBool(formData.specialPDQ),
//           cdu_required: toBool(formData.specialCDU),
//           sample_carton_arranged: toBool(formData.sampleCarton),
//           pdq_arranged: toBool(formData.samplePDQ),
//           cdu_arranged: toBool(formData.sampleCDU),
//           pallet_or_slipsheet_requirement: toBool(formData.palletRequirement),

//           shipped_as_single_pdq_or_monster_pdq: formData.singleOrMonsterPDQ?.trim() || "",
//           pdq_layers_stacking_details: formData.pdqLayers?.trim() || "",
//           common_pdq_same_dimension_for_all_sizes: formData.commonPDQ?.trim() || "",
//           small_pdq_on_pallet_or_slipsheet: formData.smallPDQRequirement?.trim() || "",
//           small_pdq_count_on_pallet_or_slipsheet: formData.smallPDQQuantity?.trim() || "",
//           warehouse_store_handling_method: formData.warehouse_store_handling_method?.trim() || "",
//           towel_folded_and_poly_packed_before_carton: formData.towel_folded_and_poly_packed_before_carton?.trim() || "",
//           separator_protector_stiffener_required: formData.separatorRequired?.trim() || "",
//           ribbon_packing_required: formData.ribbonPacking?.trim() || "",
//           belly_band_packing_required: formData.bellyBandPacking?.trim() || ""
//         },

//         subprograms: [...setsTables, ...unitTables]
//           .filter(group => group.program?.trim())
//           .flatMap(group => {
//             return group.variants
//               .filter(variant =>
//                 variant.style?.trim() ||
//                 variant.w_in?.trim() ||
//                 variant.w_cm?.trim() ||
//                 variant.l_in?.trim() ||
//                 variant.l_cm?.trim() ||
//                 variant.wt_unit?.trim() ||
//                 variant.gsm?.trim()
//               )
//               .map(variant => ({
//                 program_name: group.program?.trim() || "",
//                 style: variant.style?.trim() || "",
//                 width_in: Number(variant.w_in) || 0,
//                 width_cm: Number(variant.w_cm) || 0,
//                 length_in: Number(variant.l_in) || 0,
//                 length_cm: Number(variant.l_cm) || 0,
//                 wt_per_unit: Number(variant.wt_unit) || 0,
//                 gsm: Number(variant.gsm) || 0,
//                 unit_per_carton: group.unit_carton?.trim() || "",
//                 inner_pack_unit_qty: group.inner_pack?.trim() || "",
//                 fold: group.fold?.trim() || ""
//               }));
//           }),

//         samples: sampleRows
//           .filter(row => row.col1 || row.col2)
//           .map(row => ({
//             program_name: row.col3?.trim() || "",
//             size: row.col2?.trim() || "",
//             sample: row.col1?.trim() || "",
//             quality: row.col4?.trim() || "",
//             lbs_per_dz: Number(row.col5) || 0,
//             gsm: Number(row.col6) || 0,
//             shade: row.col7?.trim() || "",
//             width_in: Number(row.col8) || 0,
//             width_cm: Number(row.col9) || 0,
//             length_in: Number(row.col10) || 0,
//             length_cm: Number(row.col11) || 0
//           })),

//         // Add product-specific details
//         ...productDetails
//       };

//       const submitResponse = await api.post('/api/carton-program/submit/', payload, {
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });

//       // Extract program_id from response
//       const { message: submitMessage, program_id } = submitResponse.data;

//       // Store program_id
//       setLastProgramId(program_id);
//       localStorage.setItem('last_submitted_program_id', program_id);

//       // ========== STEP 2: UPLOAD ATTACHMENT (if exists) ==========
//       let attachmentResult = null;
//       if (selectedFile && program_id) {
//         console.log('📎 Uploading attachment...', selectedFile.name);
//         attachmentResult = await uploadAttachment(program_id, selectedFile);
//       }

//       // ========== STEP 3: SUCCESS HANDLING ==========
//       let successMsg = `Carton Program ${status === 'Draft' ? 'Saved as Draft' : 'Submitted'} Successfully`;

//       if (attachmentResult) {
//         if (attachmentResult.success) {
//           successMsg += ` • Attachment Uploaded`;
//         } else {
//           successMsg += ` • Attachment upload failed: ${attachmentResult.message}`;
//         }
//       } else if (selectedFile) {
//         successMsg += ` • No attachment uploaded`;
//       }

//       toast.success(successMsg);

//       // Wait for user to see success message, then redirect
//       setTimeout(() => navigate('/'), 1500);

//     } catch (error) {
//       console.error('❌ Submit failed:', error);
//       setSubmitStatus('error');
//       const errMsg = error.response?.data?.error
//         || error.response?.data?.detail
//         || error.message
//         || 'Unknown error';
//       setErrorMessage(`Submission failed: ${errMsg}`);
//       toast.error(`Submission failed: ${errMsg}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ==================== RENDER ====================
//   return (
//     <div className="h-full overflow-y-auto bg-gray-50 font-sans text-sm">
//       <div className="pb-4 pr-4 pl-4 max-w-7xl mx-auto">
//         {/* Sticky Header */}
//         <div className="sticky top-0 z-30 bg-gray-50 mb-6 border-b border-gray-200 py-4">
//           <div className="flex items-center gap-4 max-w-7xl mx-auto px-4">
//             <button
//               onClick={() => navigate('/')}
//               className="p-2 bg-white shadow cursor-pointer hover:bg-gray-100 rounded-full transition-colors group"
//               disabled={loading}
//             >
//               <svg className="w-5 h-5 text-gray-500 group-hover:text-[#0f3460]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//               </svg>
//             </button>
//             <h1 className="text-xl font-bold text-gray-800">Fill Carton Program Details</h1>
//           </div>
//         </div>

//         {/* Form */}
//         <Form
//           formData={formData}
//           onInputChange={handleInputChange}
//           onCompanyChange={handleCompanyChange}
//           companies={companies}
//           selectedFile={selectedFile}
//           onFileChange={handleFileChange}
//           onRemoveFile={handleRemoveFile}
//           loading={loading}
//         />

//         {/* Tables */}
//         <div className="space-y-10 mt-8">
//           <Table
//             title="Program Specifications"
//             headers={programHeaders}
//             data={setsTables}
//             type="grouped"
//             onAddRow={() => addVariantToLastGroup(setSetsTables)}
//             onDeleteRow={handleSetsActions.onDeleteRow}
//             onAddTable={handleSetsActions.onAddTable}
//             onCopyTable={handleSetsActions.onCopyTable}
//             onDeleteTable={handleSetsActions.onDeleteTable}
//             onUpdateCell={handleUpdateSetsCell}
//           />

//           <Table
//             title="Sample Specifications"
//             headers={sampleHeaders}
//             data={sampleRows}
//             type="flat"
//             onAddRow={handleSampleActions.onAddRow}
//             onDeleteRow={handleSampleActions.onDeleteRow}
//             onUpdateCell={handleUpdateSampleCell}
//           />
//         </div>

//         {/* Footer */}
//         <div className="bg-white p-6 my-12 rounded-lg shadow-sm border border-gray-100 flex justify-between items-end">
//           <div className="w-72">
//             <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
//               Request Sent To
//             </label>
//             <select
//               className="w-full border border-gray-300 rounded-md p-3 bg-white text-gray-700
//              focus:outline-none focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460] cursor-pointer"
//               value={selectedUserId}
//               onChange={(e) => setSelectedUserId(Number(e.target.value))}
//               disabled={loading}
//             >
//               {users.map(user => (
//                 <option key={user.id} value={user.id}>
//                   {user.username} ({user.role})
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <button
//               onClick={() => handleSubmit('Save As Draft')}
//               disabled={loading}
//               className={`px-10 mr-3 py-3 rounded-md font-semibold shadow-md hover:shadow-lg
//                   transition-all transform active:scale-95 cursor-pointer text-white ${loading
//                   ? 'bg-gray-400 cursor-not-allowed opacity-70'
//                   : 'bg-[#0f3460] hover:bg-[#0a2545]'
//                 }`}
//             >
//               {loading ? 'Saving Draft...' : 'Save as Draft'}
//             </button>
//             <button
//               onClick={() => handleSubmit('Pending')}
//               disabled={loading}
//               className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg
//                   transition-all transform active:scale-95 cursor-pointer text-white ${loading
//                   ? 'bg-gray-400 cursor-not-allowed opacity-70'
//                   : 'bg-[#0f3460] hover:bg-[#0a2545]'
//                 }`}
//             >
//               {loading ? (
//                 <span className="flex items-center gap-2">
//                   <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                   </svg>
//                   Submitting...
//                 </span>
//               ) : 'Submit Carton Program'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default FormMain;

