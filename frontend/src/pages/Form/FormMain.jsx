import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from './Form';
import Table from './Table';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import FreezingNoteTable from './FreezingNoteTable';

function FormMain({ onBack }) {
  const navigate = useNavigate();

  // ==================== STATE ====================
  const [formData, setFormData] = useState({
    productCategory: "",
    companyName: '',
    remark: '',
    customerName: '',
    customerType: 'old', // Add this for old/new toggle
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

    // ===== BEDSHEET FIELDS =====
    fabric: '',
    folding: '',
    required_pcs_per_polybag: '',
    elasticRequired: '',
    polybagSize: '',
    productType: '',
    productRequirements: '',
    packingRequirements: '',
    PackingType: '',
    ProductDimension: '',
    FoldSize: '',
    foldLength: '',
    foldWidth: '',
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

    gussetActivityName: '',
    gussetProgramName: '',
    gussetCustomerName: '',
    gussetFoldLength: '',
    gussetFoldWidth: '',
    gussetBank: '',
    gussetSectionOpen: false,
    bedsheetSectionOpen: false,
    gussetSizes: [],        // NEW: array of selected sizes, e.g. ["Twin", "King"]
    gussetOtherSizeText: '', // NEW: free text when "Other" is checked
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

  // Gusset "Program Specifications" rows — auto-generated from checked
  // sizes, but user can also add/edit/remove rows manually.
  const [gussetSpecRows, setGussetSpecRows] = useState([]);

  // Freezing Note rows — Bedsheet-only, Marketing-editable table shown
  // below Program Specifications in the Standard Bedsheet section.
  const [freezingNoteRows, setFreezingNoteRows] = useState([]);

  const emptyFreezingNoteRow = () => ({
    sr_no: '',
    size: '',
    product_dimension: '',
    pcs_per_bag_or_inner_box: '',
    bag_or_innerbox_per_carton: '',
    pcs_per_carton: '',
    carton_type_paper: '',
    carton_length_cm: '',
    carton_width_cm: '',
    carton_height_cm: '',
    net_weight_kgs: '',
    gross_weight_kgs: '',
    carton_ply_no: '',
    carton_min_bursting_strength: '',
    carton_min_edge_crush_test: '',
    stiffener_dimension: '',
    stiffener_no_of_ply: '',
    stiffener_type_cut: '',
    side_stiffener_dimension: '',
    side_stiffener_no_of_ply: '',
    side_stiffener_type_cut: '',
    separator_dimension: '',
    separator_no_of_ply: '',
    bag_or_innerbox_size: '',
    bag_type_or_box_type: '',
    ld_polybag_length_cm: '',
    ld_polybag_width_cm: '',
    ld_polybag_flap_cm: '',
    ld_polybag_thickness_micron: '',
    ld_polybag_quality: '',
    printing_matter_polybag: '',
    product_position_in_carton: '',
    product_dim_length: '',
    product_dim_width: '',
    product_dim_height: '',
    bellyband_ribbon_dimension: '',
    bellyband_ribbon_quality: '',
    macys_tmcl_placement: '',
    macys_carton_type: '',
    macys_tmcl_placement_type: '',
    pdq_accessories_others: '',
    remarks: '',
  });

  const handleAddFreezingNoteRow = () => {
    setFreezingNoteRows(prev => [...prev, emptyFreezingNoteRow()]);
  };

  const handleFreezingNoteCellChange = (idx, field, value) => {
    setFreezingNoteRows(prev =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteFreezingNoteRow = (idx) => {
    setFreezingNoteRows(prev => prev.filter((_, i) => i !== idx));
  };
  // User dropdown
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
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
    // NEW: Keep gusset spec rows' Fold Length/Width in sync with the
  // top-level Gusset "Fold Length x Fold Width" fields — but only for
  // rows the user hasn't manually edited themselves.
  useEffect(() => {
    setGussetSpecRows(prev =>
      prev.map(row => ({
        ...row,
        foldLength: row.foldLengthTouched ? row.foldLength : (formData.gussetFoldLength || ''),
        foldWidth: row.foldWidthTouched ? row.foldWidth : (formData.gussetFoldWidth || ''),
      }))
    );
  }, [formData.gussetFoldLength, formData.gussetFoldWidth]);

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
      // Exclude admin user from the dropdown list
      const filteredUsers = response.data.filter(
        user => user.username !== 'admin'
      );
      setUsers(filteredUsers);
      // Note: No default user is auto-selected anymore.
      // User must first select a Role, then a User.
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  // ==================== HANDLERS ====================
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // NEW: Handles checking/unchecking a size checkbox in Gusset Finalization.
  // Checking a size adds a new row to gussetSpecRows; unchecking removes
  // any row(s) with that size.
  const handleGussetSizeToggle = useCallback((size) => {
    setFormData(prev => {
      const current = prev.gussetSizes || [];
      const isChecked = current.includes(size);
      const updated = isChecked
        ? current.filter(s => s !== size)
        : [...current, size];
      return { ...prev, gussetSizes: updated };
    });

    setGussetSpecRows(prev => {
      const alreadyHasRow = prev.some(row => row.size === size);
      if (alreadyHasRow) {
        // Unchecking — remove all rows matching this size
        return prev.filter(row => row.size !== size);
      } else {
        // Checking — add one new row for this size, pre-filled with the
        // top-level Fold Length/Width (if already set) as a default.
        return [
          ...prev,
          {
            size: size,
            foldLength: formData.gussetFoldLength || '',
            foldWidth: formData.gussetFoldWidth || '',
            gussetName: '',
            wt: '',
            gsm: '',
            foldLengthTouched: false,
            foldWidthTouched: false,
          }
        ];
      }
    });
  }, []);

  // NEW: Update a single cell in a gusset spec row
  const handleGussetSpecCellChange = useCallback((rowIdx, field, value) => {
    setGussetSpecRows(prev =>
      prev.map((row, idx) => {
        if (idx !== rowIdx) return row;
        const updated = { ...row, [field]: value };
        if (field === 'foldLength') updated.foldLengthTouched = true;
        if (field === 'foldWidth') updated.foldWidthTouched = true;
        return updated;
      })
    );
  }, []);

  // NEW: Manually add a blank row (no size pre-filled)
  const handleAddGussetSpecRow = useCallback(() => {
    setGussetSpecRows(prev => [
      ...prev,
      {
        size: '',
        foldLength: formData.gussetFoldLength || '',
        foldWidth: formData.gussetFoldWidth || '',
        gussetName: '',
        wt: '',
        gsm: '',
        foldLengthTouched: false,
        foldWidthTouched: false,
      }
    ]);
  }, [formData.gussetFoldLength, formData.gussetFoldWidth]);

  // NEW: Manually delete a row (also unchecks the matching size checkbox
  // if it was one of the auto-generated ones)
  const handleDeleteGussetSpecRow = useCallback((rowIdx) => {
    setGussetSpecRows(prev => {
      const rowToDelete = prev[rowIdx];
      if (rowToDelete && rowToDelete.size) {
        setFormData(fd => ({
          ...fd,
          gussetSizes: (fd.gussetSizes || []).filter(s => s !== rowToDelete.size)
        }));
      }
      return prev.filter((_, idx) => idx !== rowIdx);
    });
  }, []);

  const handleRemarkChange = useCallback((e) => {
    const { value } = e.target;
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

    // Block further typing once word limit is reached
    if (wordCount <= 100) {
      setFormData(prev => ({ ...prev, remark: value }));
    }
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
    inner_pack: '',
    polybags_carton: '',
    fold: '',
    variants: [{
      style: '',
      w_in: '',
      w_cm: '',
      l_in: '',
      l_cm: '',
      wt_unit: '',
      gsm: '',
    }]
  }), [formData.programName]);

  // const programHeaders = [
  //   { label: "Program", key: "program" },
  //   { label: "Style", key: "style", hasAddBtn: true },
  //   { label: "W-In", key: "w_in" },
  //   { label: "W-Cm", key: "w_cm" },
  //   { label: "L-In", key: "l_in" },
  //   { label: "L-Cm", key: "l_cm" },
  //   { label: "Wt/Unit", key: "wt_unit" },
  //   { label: "GSM", key: "gsm" },
  //   { label: "Unit/Carton", key: "unit_carton" },
  //   { label: "Inner Pack Unit Quantity", key: "inner_pack" },
  //   { label: "Fold", key: "fold" },
  //   { label: "", key: "actions" }
  // ];

  const isBedsheetCategory = formData.productCategory === "Bedsheet";

  // NEW: reflects the independent accordion toggles in BedSheetForm.jsx
  // (gussetSectionOpen / bedsheetSectionOpen), not the old single formMode.
  const showGussetSpecs = isBedsheetCategory && formData.gussetSectionOpen === true;

  // Old "Program Specifications" table only applies to non-Bedsheet
  // categories now (Towel, BathRobe). For Bedsheet, Freezing Note +
  // Gusset Specifications together replace it.
  const showCartonSpecs = !isBedsheetCategory;

  const showFreezingNote = isBedsheetCategory && formData.bedsheetSectionOpen === true;

  const isStandardBedsheet = isBedsheetCategory && formData.bedsheetSectionOpen === true;

  const programHeaders = [
    { label: "Program", key: "program" },
    { label: "Size", key: "style", hasAddBtn: true },
    { label: "W-In", key: "w_in" },
    { label: "L-In", key: "l_in" },
    { label: "Wt/Unit", key: "wt_unit" },
    { label: isStandardBedsheet ? "TC" : "GSM", key: "gsm" },
    { label: "Units/Polybag", key: "inner_pack" },
    { label: "Units/Carton", key: "unit_carton" },
    { label: "Polybags/Carton", key: "polybags_carton" },
    { label: "Folding Details", key: "fold" },
    { label: "", key: "actions" }
  ];

  const sampleHeaders = [
    { label: "Sample", key: "col1", hasAddBtn: true },
    { label: "Size", key: "col2" },
    { label: "Program", key: "col3" },
    { label: "Quality", key: "col4" },
    { label: "LBS/DZ", key: "col5" },
    { label: "GSM", key: "col6" },
    { label: "Shade", key: "col7" },
    { label: "W-In", key: "col8" },
    { label: "W-Cm", key: "col9" },
    { label: "L-In", key: "col10" },
    { label: "L-Cm", key: "col11" },
    { label: "Sample Code", key: "col12" },
    { label: "Attachment", key: "col13", type: "file" },
    { label: "", key: "actions" }
  ];

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
          inner_pack: '',
          polybags_carton: '',
          fold: '',
          variants: [{
            style: '',
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

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      customerName: '',
      programName: '',
      customerProtocol: '',
      newOrShifted: '',
      original_towel: '',
      polybagManualAuto: '',
      polybag_type: '',
      palletRequirement: '',
      specialCarton: '',
      sampleCarton: '',
      singleOrMonsterPDQ: '',
      pdqLayers: '',
      remark: '',
      commonPDQ: '',
      smallPDQRequirement: '',
      smallPDQQuantity: '',
      warehouse_store_handling_method: '',
      towel_folded_and_poly_packed_before_carton: '',
      separatorRequired: '',
      ribbonPacking: '',
      bellyBandPacking: ''
    }));
    setSelectedFile(null);
    setSetsTables([createEmptyGroup()]);
    setUnitTables([createEmptyGroup()]);
    setSampleRows([{}]);
    setLastProgramId(null);
    setSuccessMessage('');
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

    // ==================== SAMPLE ATTACHMENT UPLOAD FUNCTION ====================
  const uploadSampleAttachment = async (sampleId, file) => {
    try {
      const formData = new FormData();
      formData.append('sample_id', sampleId);
      formData.append('file', file);

      const response = await api.post(
        '/api/carton-program/sample-attachment/upload/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      return {
        success: true,
        message: response.data?.message || 'Sample attachment uploaded successfully'
      };
    } catch (error) {
      console.warn('Sample attachment upload failed:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Sample attachment upload failed'
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

    // Terry Towel fields are now merged into the default Towel form,
    // so send terry_details whenever it's a TOWEL program too.
    if (programType === 'TOWEL') {
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
        }
      };
    }

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
          fold_length: formData.foldLength || null,
          fold_width: formData.foldWidth || null,
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
        }
      };
    }

    return {};
  };
   const handleGussetSubmit = async () => {
    if (!formData.gussetProgramName?.trim() || !formData.gussetCustomerName?.trim()) {
      toast.error('Program Name and Customer Name are required');
      return;
    }

    // NEW: Activity name and assigned user are required, same as carton submit
    if (!formData.gussetActivityName?.trim()) {
      toast.error('Activity Name is required');
      return;
    }
    if (!selectedUserId) {
      toast.error('Please select a role and a user to send the request');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        activity_name: formData.gussetActivityName?.trim() || '',
        sent_to_user_id: selectedUserId,
        btn: 'Pending',
        customer_name: formData.gussetCustomerName.trim(),
        program_name: formData.gussetProgramName.trim(),

        tc: formData.fabric?.trim() || "",   // agar TC field alag hai to us naam se replace karo
        weave: formData.gussetWeave?.trim() || "",
        product_group: formData.gussetProductGroup?.trim() || "",
        size: (formData.gussetSizes || [])
          .map(s => (s === "Other" ? formData.gussetOtherSizeText?.trim() : s))
          .filter(Boolean)
          .join(", "),
        down: formData.gussetDown?.trim() || "",

        value_addition_flat_sheet: formData.gussetValueAdditionFlatSheet?.trim() || "",
        value_addition_duvet_cover: formData.gussetValueAdditionDuvetCover?.trim() || "",
        value_addition_fitted_sheet: formData.gussetValueAdditionFittedSheet?.trim() || "",
        value_addition_pillowcase: formData.gussetValueAdditionPillowcase?.trim() || "",

        fold_length: formData.gussetFoldLength || null,
        fold_width: formData.gussetFoldWidth || null,

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

        gusset_bank: formData.gussetBank?.trim() || "",

        program_specifications: gussetSpecRows
          .filter(row => row.size?.trim())
          .map(row => ({
            size: row.size?.trim() || "",
            fold_length: row.foldLength || null,
            fold_width: row.foldWidth || null,
            gusset_name: row.gussetName?.trim() || "",
            wt: row.wt ? Number(row.wt) : null,
            gsm: row.gsm ? Number(row.gsm) : null,
          })),
        samples: sampleRows
          .filter(row => row.col1 || row.col2)
          .map(row => ({
            program_name: row.col3?.trim() || "",
            size: row.col2?.trim() || "",
            sample: row.col1?.trim() || "",
            sample_code: row.col12?.trim() || "",
            quality: row.col4?.trim() || "",
            lbs_per_dz: Number(row.col5) || 0,
            gsm: Number(row.col6) || 0,
            shade: row.col7?.trim() || "",
            width_in: Number(row.col8) || 0,
            length_in: Number(row.col10) || 0,
            width_cm: Number(row.col9) || 0,
            length_cm: Number(row.col11) || 0,
          })),
      };

      const response = await api.post('/api/gusset-program/submit/', payload);
      const { program_id, sample_ids } = response.data;

      // Upload program-level attachment (if selected)
      if (selectedFile && program_id) {
        try {
          const attFormData = new FormData();
          attFormData.append('program_id', program_id);
          attFormData.append('file', selectedFile);
          await api.post('/api/gusset-program/attachment/upload/', attFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (attErr) {
          console.warn('Gusset attachment upload failed:', attErr);
        }
      }

      // Upload sample-level attachments (if any)
      const filteredSampleRows = sampleRows.filter(row => row.col1 || row.col2);
      if (sample_ids && sample_ids.length) {
        const sampleUploadPromises = filteredSampleRows
          .map((row, idx) => {
            const file = row.col13;
            const sampleId = sample_ids[idx];
            if (file instanceof File && sampleId) {
              const sFormData = new FormData();
              sFormData.append('sample_id', sampleId);
              sFormData.append('file', file);
              return api.post('/api/gusset-program/sample-attachment/upload/', sFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            }
            return null;
          })
          .filter(Boolean);

        if (sampleUploadPromises.length) {
          await Promise.allSettled(sampleUploadPromises);
        }
      }

      toast.success('Gusset Program Submitted Successfully');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Gusset submit failed:', error);
      const errMsg = error.response?.data?.error || error.message || 'Unknown error';
      toast.error(`Submission failed: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };


    // Decides what to submit based on which section is open, when the
  // single bottom "Submit" button is clicked. For product categories
  // other than Bedsheet, behaves exactly like before.
  const handleMainSubmit = async (status = 'Pending') => {
    if (formData.productCategory !== 'Bedsheet') {
      await handleSubmit(status);
      return;
    }

    const gusset = formData.gussetSectionOpen === true;
    const bedsheet = formData.bedsheetSectionOpen === true;

    if (!gusset && !bedsheet) {
      toast.error('Please open and fill Gusset Finalization or Standard Bedsheet form first');
      return;
    }

    if (gusset) {
      await handleGussetSubmit();
    }
    if (bedsheet) {
      await handleSubmit(status);
    }
  };

  // ==================== MAIN SUBMIT WITH SEQUENTIAL API CALLS ====================
  const handleSubmit = async (status = 'Pending') => {
    // Validation
    if (!formData.programName?.trim() || !formData.customerName?.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Program Name and Customer Name are required');
      setTimeout(() => setSubmitStatus(null), 5000);
      return;
    }

    // NEW: Validate that a user has been selected to receive the request
    if (!selectedUserId) {
      setSubmitStatus('error');
      setErrorMessage('Please select a role and a user to send the request');
      setTimeout(() => setSubmitStatus(null), 5000);
      return;
    }
    setLoading(true);
    setSubmitStatus(null);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const programType = getProgramType();
      const productDetails = buildProductDetails();

      // ========== STEP 1: BUILD BASE PAYLOAD ==========
      const payload = {
        activity_name: formData.activityName?.trim() || '',
        program_name: formData.programName.trim(),
        program_type: programType,
        btn: status,
        sent_to_user_id: selectedUserId,
        // remark: formData.remark?.trim() || '',  

        carton_program: {
          customer_name: formData.customerName.trim(),
          remark: formData.remark?.trim() || '',
          customer_protocol: formData.customerProtocol?.trim() || "",
          confirm_new_or_shifted_from_vapi: formData.newOrShifted?.trim() || "",
          original_towel: formData.original_towel?.trim() || "",
          polybag_manual_or_automatic: formData.polybagManualAuto?.trim() || "",
          polybag_type: formData.polybag_type?.trim() || "",
          pallet_or_slipsheet_requirement: formData.palletRequirement === "True",
          special_carton_required: formData.specialCarton === "True",
          pdq_required: formData.specialPDQ === "True",
          cdu_required: formData.specialCDU === "True",
          sample_carton_arranged: formData.sampleCarton === "True",
          pdq_arranged: formData.samplePDQ === "True",
          cdu_arranged: formData.sampleCDU === "True",
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
          elastic_required: formData.elasticRequired === "Yes",
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
                unit_per_carton: group.unit_carton?.trim() || "",
                inner_pack_unit_qty: group.inner_pack?.trim() || "",
                polybags_per_carton: group.polybags_carton ? Number(group.polybags_carton) : null,
                fold: group.fold?.trim() || ""
              }));
          }),

        samples: sampleRows
          .filter(row => row.col1 || row.col2)
          .map(row => ({
            program_name: row.col3?.trim() || "",
            size: row.col2?.trim() || "",
            sample: row.col1?.trim() || "",
            sample_code: row.col12?.trim() || "",
            quality: row.col4?.trim() || "",
            lbs_per_dz: Number(row.col5) || 0,
            gsm: Number(row.col6) || 0,
            shade: row.col7?.trim() || "",
            width_in: Number(row.col8) || 0,
            width_cm: Number(row.col9) || 0,
            length_in: Number(row.col10) || 0,
            length_cm: Number(row.col11) || 0
          })),

        // Freezing Note rows — only meaningful for Bedsheet; backend
        // ignores this array for other program types anyway.
        freezing_note_rows: freezingNoteRows
          .filter(row => Object.values(row).some(v => v !== '' && v !== null))
          .map(row => ({
            ...row,
            carton_length_cm: row.carton_length_cm ? Number(row.carton_length_cm) : null,
            carton_width_cm: row.carton_width_cm ? Number(row.carton_width_cm) : null,
            carton_height_cm: row.carton_height_cm ? Number(row.carton_height_cm) : null,
            net_weight_kgs: row.net_weight_kgs ? Number(row.net_weight_kgs) : null,
            gross_weight_kgs: row.gross_weight_kgs ? Number(row.gross_weight_kgs) : null,
            ld_polybag_length_cm: row.ld_polybag_length_cm ? Number(row.ld_polybag_length_cm) : null,
            ld_polybag_width_cm: row.ld_polybag_width_cm ? Number(row.ld_polybag_width_cm) : null,
            ld_polybag_flap_cm: row.ld_polybag_flap_cm ? Number(row.ld_polybag_flap_cm) : null,
            date_of_carton_dimension_finalization: row.date_of_carton_dimension_finalization || null,
          })),

        // Add product-specific details
        ...productDetails
      };

      const submitResponse = await api.post('/api/carton-program/submit/', payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Extract program_id and sample_ids from response
      const { message: submitMessage, program_id, sample_ids } = submitResponse.data;

      // Store program_id
      setLastProgramId(program_id);
      localStorage.setItem('last_submitted_program_id', program_id);

      // ========== STEP 2: UPLOAD MAIN ATTACHMENT (if exists) ==========
      let attachmentResult = null;
      if (selectedFile && program_id) {
        console.log('📎 Uploading attachment...', selectedFile.name);
        attachmentResult = await uploadAttachment(program_id, selectedFile);
      }

      // ========== STEP 2.5: UPLOAD SAMPLE-LEVEL ATTACHMENTS ==========
      const filteredSampleRows = sampleRows.filter(row => row.col1 || row.col2);

      if (sample_ids && sample_ids.length) {
        const sampleUploadPromises = filteredSampleRows
          .map((row, idx) => {
            const file = row.col13;
            const sampleId = sample_ids[idx];
            if (file instanceof File && sampleId) {
              return uploadSampleAttachment(sampleId, file);
            }
            return null;
          })
          .filter(Boolean);

        if (sampleUploadPromises.length) {
          console.log(`📎 Uploading ${sampleUploadPromises.length} sample attachment(s)...`);
          await Promise.all(sampleUploadPromises);
        }
      }

      // ========== STEP 3: SUCCESS HANDLING ==========
      let successMsg = `Carton Program ${status === 'Draft' ? 'Saved as Draft' : 'Submitted'} Successfully`;

      if (attachmentResult) {
        if (attachmentResult.success) {
          successMsg += ` • Attachment Uploaded`;
        } else {
          successMsg += ` • Attachment upload failed: ${attachmentResult.message}`;
        }
      } else if (selectedFile) {
        successMsg += ` • No attachment uploaded`;
      }

      toast.success(successMsg);

      // Wait for user to see success message, then redirect
      setTimeout(() => navigate('/'), 1500);

    } catch (error) {
      console.error('❌ Submit failed:', error);
      setSubmitStatus('error');
      const errMsg = error.response?.data?.error
        || error.response?.data?.detail
        || error.message
        || 'Unknown error';
      setErrorMessage(`Submission failed: ${errMsg}`);
      toast.error(`Submission failed: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };
  const uniqueRoles = [...new Set(users.map(user => user.role))];

  // Handles when user selects a role from the "Select Role" dropdown
  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setSelectedUserId('');
  };

  // Filters users list to only show users matching the selected role
  const usersForSelectedRole = users.filter(user => user.role === selectedRole);

  // ==================== RENDER ====================

  // ==================== RENDER ====================
  // const isGussetMode = formData.productCategory === "Bedsheet" && (formData.formMode ?? "gusset") === "gusset";
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
          onRemarkChange={handleRemarkChange}
          onCompanyChange={handleCompanyChange}
          onGussetSubmit={handleGussetSubmit}
          onSubmitBoth={handleMainSubmit}
          onGussetSizeToggle={handleGussetSizeToggle}

          companies={companies}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          loading={loading}
        />

        {/* Tables */}
                {/* Tables */}
        <div className="space-y-10 mt-8">
          {showCartonSpecs && (
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
          )}

          {/* Freezing Note (Carton and Packing Details) — Bedsheet only.
              Only shown when Standard Bedsheet is filled, regardless of
              whether Gusset is also filled. Marketing-only. */}
          {showFreezingNote && (
            <FreezingNoteTable
              rows={freezingNoteRows}
              onAddRow={handleAddFreezingNoteRow}
              onCellChange={handleFreezingNoteCellChange}
              onDeleteRow={handleDeleteFreezingNoteRow}
            />
          )}

          {showGussetSpecs && (
            <Table
              title="Gusset Specifications"
              headers={[
                { label: "Size", key: "size" },
                { label: "Fold Length", key: "foldLength" },
                { label: "Fold Width", key: "foldWidth" },
                { label: "Gusset", key: "gussetName" },
                { label: "WT", key: "wt" },
                { label: "GSM", key: "gsm" },
                { label: "", key: "actions", hasAddBtn: true },
              ]}
              data={gussetSpecRows}
              type="flat"
              onAddRow={handleAddGussetSpecRow}
              onDeleteRow={handleDeleteGussetSpecRow}
              onUpdateCell={(idx, _, key, value) => handleGussetSpecCellChange(idx, key, value)}
            />
          )}
       

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
          <div className="flex gap-4 bg-gradient-to-br from-[#f8faff] to-[#eef3fb] p-4 rounded-xl border border-[#0f3460]/10">
            {/* Role Dropdown */}
            <div className="w-56">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#0f3460] mb-2 uppercase tracking-wide">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-8a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Select Role
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none border border-gray-300 rounded-lg py-3 pl-3 pr-9 bg-white text-gray-700 font-medium
                 focus:outline-none focus:border-[#0f3460] focus:ring-2 focus:ring-[#0f3460]/20 cursor-pointer
                 transition-all duration-200 shadow-sm hover:border-[#0f3460]/50"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  disabled={loading}
                >
                  <option value="">-- Select Role --</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* User Dropdown - enabled only after a role is selected */}
            <div className="w-56">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#0f3460] mb-2 uppercase tracking-wide">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Request Sent To
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none border border-gray-300 rounded-lg py-3 pl-3 pr-9 bg-white text-gray-700 font-medium
                 focus:outline-none focus:border-[#0f3460] focus:ring-2 focus:ring-[#0f3460]/20 cursor-pointer
                 transition-all duration-200 shadow-sm hover:border-[#0f3460]/50
                 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  disabled={loading || !selectedRole}
                >
                  <option value="">-- Select User --</option>
                  {usersForSelectedRole.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            {/* <button
              onClick={() => handleSubmit('Save As Draft')}
              disabled={loading}
              className={`px-10 mr-3 py-3 rounded-md font-semibold shadow-md hover:shadow-lg
                  transition-all transform active:scale-95 cursor-pointer text-white ${loading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-[#0f3460] hover:bg-[#0a2545]'
                }`}
            >
              {loading ? 'Saving Draft...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSubmit('Pending')}
              disabled={loading}
              className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg
                  transition-all transform active:scale-95 cursor-pointer text-white ${loading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-[#0f3460] hover:bg-[#0a2545]'
                }`}
            > */}

            <button
              onClick={() => handleMainSubmit('Save As Draft')}
              disabled={loading}
              className={`px-10 mr-3 py-3 rounded-md font-semibold shadow-md hover:shadow-lg
                  transition-all transform active:scale-95 cursor-pointer text-white ${loading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-[#0f3460] hover:bg-[#0a2545]'
                }`}
            >
              {loading ? 'Saving Draft...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleMainSubmit('Pending')}
              disabled={loading}
              className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg
                  transition-all transform active:scale-95 cursor-pointer text-white ${loading
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-[#0f3460] hover:bg-[#0a2545]'
                }`}
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
//     programName: '',
//     customerProtocol: '',
//     newOrShifted: '',
//     originalTowel: '',
//     polybagManualAuto: '',
//     polybagType: '',
//     palletRequirement: '',
//     // specialCarton: '',
//     // sampleCarton: '',
//     specialCarton: '',
//     specialPDQ: '',
//     specialCDU: '',

//     sampleCarton: '',
//     samplePDQ: '',
//     sampleCDU: '',
//     Fabric: '',

//     singleOrMonsterPDQ: '',
//     pdqLayers: '',
//     commonPDQ: '',
//     smallPDQRequirement: '',
//     smallPDQQuantity: '',
//     warehouseHandling: '',
//     towelFoldCondition: '',
//     separatorRequired: '',
//     ribbonPacking: '',
//     bellyBandPacking: ''
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

//     // Update Sets Tables
//     setSetsTables(prev => prev.map(group => ({
//       ...group,
//       program: programName
//     })));

//     // Update Unit Tables
//     setUnitTables(prev => prev.map(group => ({
//       ...group,
//       program: programName
//     })));

//     // Update Sample Rows
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
//       originalTowel: '',
//       polybagManualAuto: '',
//       polybagType: '',
//       palletRequirement: '',
//       specialCarton: '',
//       sampleCarton: '',
//       singleOrMonsterPDQ: '',
//       pdqLayers: '',
//       commonPDQ: '',
//       smallPDQRequirement: '',
//       smallPDQQuantity: '',
//       warehouseHandling: '',
//       towelFoldCondition: '',
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
//       // ========== STEP 1: SUBMIT CARTON PROGRAM ==========
//       const payload = {
//         activity_name: formData.activityName?.trim() || '',
//         program_name: formData.programName.trim(),
//         btn: status,
//         //      request_sample: true,
//         // request_carton_sizing: true,
//         // purchase_sent_to: 6,
//         sent_to_user_id: selectedUserId,
//         carton_program: {
//           customer_name: formData.customerName.trim(),
//           customer_protocol: formData.customerProtocol?.trim() || "",
//           confirm_new_or_shifted_from_vapi: formData.newOrShifted?.trim() || "",
//           original_towel: formData.originalTowel?.trim() || "",
//           polybag_manual_or_automatic: formData.polybagManualAuto?.trim() || "",
//           polybag_type: formData.polybagType?.trim() || "",
//           pallet_or_slipsheet_requirement: formData.palletRequirement?.trim() || "False",
//           // special_carton_pdq_cdu_required: formData.specialCarton?.trim() || "",
//           // sample_arranged_for_special_carton_pdq_cdu: formData.sampleCarton?.trim() || "",
//           special_carton_required: formData.specialCarton || "False",
//           pdq_required: formData.specialPDQ || "False",
//           cdu_required: formData.specialCDU || "False",

//           sample_carton_arranged: formData.sampleCarton || "False",
//           pdq_arranged: formData.samplePDQ || "False",
//           cdu_arranged: formData.sampleCDU || "False",

//           shipped_as_single_pdq_or_monster_pdq: formData.singleOrMonsterPDQ?.trim() || "",
//           pdq_layers_stacking_details: formData.pdqLayers?.trim() || "",
//           common_pdq_same_dimension_for_all_sizes: formData.commonPDQ?.trim() || "",
//           small_pdq_on_pallet_or_slipsheet: formData.smallPDQRequirement?.trim() || "",
//           small_pdq_count_on_pallet_or_slipsheet: formData.smallPDQQuantity?.trim() || "",
//           warehouse_store_handling_method: formData.warehouseHandling?.trim() || "",
//           towel_folded_and_poly_packed_before_carton: formData.towelFoldCondition?.trim() || "",
//           separator_protector_stiffener_required: formData.separatorRequired?.trim() || "",
//           ribbon_packing_required: formData.ribbonPacking?.trim() || "",
//           belly_band_packing_required: formData.bellyBandPacking?.trim() || ""
//         },
//         // subprograms: [...setsTables, ...unitTables]
//         //   .filter(group => group.program?.trim())
//         //   .map(group => {
//         //     const firstVariant = group.variants?.[0] || {};
//         //     return {
//         //       program_name: group.program?.trim() || "",
//         //       style: firstVariant.style?.trim() || "",
//         //       width_in: Number(firstVariant.w_in) || 0,
//         //       length_in: Number(firstVariant.l_in) || 0,
//         //       wt_per_unit: Number(firstVariant.wt_unit) || 0,
//         //       gsm: Number(firstVariant.gsm) || 0,
//         //       unit_per_carton: group.unit_carton?.trim() || firstVariant.unit_carton?.trim() || "",
//         //       inner_pack_unit_qty: group.inner_pack?.trim() || firstVariant.inner_pack?.trim() || "",
//         //       fold: group.fold?.trim() || ""
//         //     };
//         //   }),

//         subprograms: [...setsTables, ...unitTables]
//           .filter(group => group.program?.trim())
//           .flatMap(group => { // Use flatMap to send ALL variants in the group
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
//           }))
//       };

//       console.log('📦 Submitting carton program...');
//       const submitResponse = await api.post('/api/carton-program/submit/', payload, {
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });

//       // Extract program_id from response
//       const { message: submitMessage, program_id } = submitResponse.data;
//       console.log(`✅ Program submitted. ID: ${program_id}, Message: ${submitMessage}`);

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

//       // setSuccessMessage(successMsg);
//       // setSubmitStatus('success');
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
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ==================== RENDER ====================
//   return (
//     // <div className="min-h-screen bg-gray-50 font-sans text-sm">
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
