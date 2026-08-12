


import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import Form from './Form';
import Table from './Table';
import { toast } from 'react-toastify';

function EditCartonForm({ onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: '',
    customerName: '',
    programName: '',
    customerProtocol: '',
    newOrShifted: '',
    originalTowel: '',
    polybagManualAuto: '',
    polybagType: '',
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
    warehouseHandling: '',
    towelFoldCondition: '',
    separatorRequired: '',
    ribbonPacking: '',
    bellyBandPacking: '',
    activityName: 'Carton Program Request', // Add this
    customerType: 'old', // Add this
  });

  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [setsTables, setSetsTables] = useState([]);
  const [unitTables, setUnitTables] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [usersRes] = await Promise.all([
          api.get('/api/users/list/'),
        ]);
        
        const filteredUsers = (usersRes.data || []).filter(
          (user) => user.username !== 'admin'
        );
        setUsers(filteredUsers);

        if (filteredUsers.length > 0) {
          setSelectedUserId(filteredUsers[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch static data:', err);
      }
    };

    fetchStaticData();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      setFetchLoading(true);
      setFetchError(null);

      try {
        const response = await api.post('/api/carton-program/details/', {
          activity_program_status_id: Number(id),
        });

        const data = response.data;
        const cp = data.carton_program || {};

        // Helper function to safely convert booleans to strings
        const boolToString = (value) => {
          if (value === true) return 'True';
          if (value === false) return 'False';
          return value || '';
        };

        setFormData({
          companyName: '',
          customerName: cp.customer_name || '',
          programName: cp.program_name || '',
          customerProtocol: cp.customer_protocol || '',
          newOrShifted: cp.confirm_new_or_shifted_from_vapi || '',
          originalTowel: cp.original_towel || '',
          polybagManualAuto: cp.polybag_manual_or_automatic || '',
          polybagType: cp.polybag_type || '',
          palletRequirement: boolToString(cp.pallet_or_slipsheet_requirement),
          specialCarton: boolToString(cp.special_carton_required),
          specialPDQ: boolToString(cp.pdq_required),
          specialCDU: boolToString(cp.cdu_required),
          sampleCarton: boolToString(cp.sample_carton_arranged),
          samplePDQ: boolToString(cp.pdq_arranged),
          sampleCDU: boolToString(cp.cdu_arranged),
          singleOrMonsterPDQ: cp.shipped_as_single_pdq_or_monster_pdq || '',
          pdqLayers: cp.pdq_layers_stacking_details || '',
          commonPDQ: cp.common_pdq_same_dimension_for_all_sizes || '',
          smallPDQRequirement: cp.small_pdq_on_pallet_or_slipsheet || '',
          smallPDQQuantity: cp.small_pdq_count_on_pallet_or_slipsheet || '',
          warehouseHandling: cp.warehouse_store_handling_method || '',
          towelFoldCondition: cp.towel_folded_and_poly_packed_before_carton || '',
          separatorRequired: cp.separator_protector_stiffener_required || '',
          ribbonPacking: cp.ribbon_packing_required || '',
          bellyBandPacking: cp.belly_band_packing_required || '',
          activityName: 'Carton Program Request',
          customerType: 'old',
        });

        const subprograms = (data.subprograms || []).filter(sub => {
          const hasValidDimensions = 
            sub.width_in && sub.width_in !== 0 && sub.width_in !== '0' &&
            sub.width_cm && sub.width_cm !== 0 && sub.width_cm !== '0' &&
            sub.length_in && sub.length_in !== 0 && sub.length_in !== '0';
            sub.length_cm && sub.length_cm !== 0 && sub.length_cm !== '0';
          const hasValidGsm = sub.gsm && sub.gsm !== 0 && sub.gsm !== '0';
          const hasValidUnits = sub.unit_per_carton && sub.unit_per_carton !== 0 && sub.unit_per_carton !== '0';
          const hasStyle = sub.style && sub.style.trim() !== '';
          const hasFold = sub.fold && sub.fold.trim() !== '';

          return hasValidDimensions || hasValidGsm || hasValidUnits || hasStyle || hasFold;
        });

        // const sets = [];
        // const units = [];

        // subprograms.forEach(sub => {
        //   const gsm = Number(sub.gsm) || 0;
        //   const targetGroup = gsm >= 400 ? sets : units;

        //   targetGroup.push({
        //     program: sub.program_name || '',
        //     unit_carton: sub.unit_per_carton?.toString() || '',
        //     inner_pack: sub.inner_pack_unit_qty?.toString() || '',
        //     fold: sub.fold || '',
        //     variants: [{
        //       style: sub.style || '',
        //       w_in: sub.width_in?.toString() || '',
        //       l_in: sub.length_in?.toString() || '',
        //       wt_unit: sub.wt_per_unit?.toString() || '',
        //       gsm: sub.gsm?.toString() || '',
        //     }],
        //   });
        // });

        // console.log('Sets:', sets); // Debug log
        // console.log('Units:', units); // Debug log

        // setSetsTables(sets.length > 0 ? sets : [createEmptyGroup()]);
        // setUnitTables(units.length > 0 ? units : [createEmptyGroup()]);

        // Simplified: All programs go into setsTables
        const allPrograms = [];

        subprograms.forEach(sub => {
          allPrograms.push({
            program: sub.program_name || '',
            unit_carton: sub.unit_per_carton?.toString() || '',
            inner_pack: sub.inner_pack_unit_qty?.toString() || '',
            fold: sub.fold || '',
            variants: [{
              style: sub.style || '',
              w_in: sub.width_in?.toString() || '',
              w_cm: sub.width_cm?.toString() || '',
              l_in: sub.length_in?.toString() || '',
              l_cm: sub.length_cm?.toString() || '',
              wt_unit: sub.wt_per_unit?.toString() || '',
              gsm: sub.gsm?.toString() || '',
            }],
          });
        });


        setSetsTables(allPrograms.length > 0 ? allPrograms : [createEmptyGroup()]);
        setUnitTables([createEmptyGroup()]); // Keep empty for now

        const samples = data.samples || [];
        const formattedSamples = samples.map(s => ({
          col1: s.sample || '',
          col2: s.size?.toString() || '',
          col3: s.program_name || '',
          col4: s.quality || '',
          col5: s.lbs_per_dz?.toString() || '',
          col6: s.gsm?.toString() || '',
          col7: s.shade || '',
          col8: s.width_in?.toString() || '',
          col9: s.width_cm?.toString() || '',
          col10: s.length_in?.toString() || '',
          col11: s.length_cm?.toString() || '',
        }));

        setSampleRows(formattedSamples.length > 0 ? formattedSamples : [{}]);

      } catch (err) {
        console.error('Failed to load carton details:', err);
        setFetchError(
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Could not load existing data. You can still create a new one.'
        );
      } finally {
        setFetchLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

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

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCompanyChange = useCallback((e) => {
    const companyName = e.target.value;
    setFormData((prev) => ({ ...prev, companyName }));
    if (companyName) localStorage.setItem('companyName', companyName);
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

  const createEmptyGroup = useCallback(() => ({
    program: '',
    unit_carton: '',
    inner_pack: '',
    fold: '',
    variants: [{
      style: '',
      w_in: '',
      w_cm: '',
      l_in: '',
      l_cm: '',
      wt_unit: '',
      gsm: '',
    }],
  }), []);

  const programHeaders = [
    { label: "Program", key: "program" },
    { label: "Style", key: "style", hasAddBtn: true },
    { label: "W-In", key: "w_in" },
    { label: "W-Cm", key: "w_cm" },
    { label: "L-In", key: "l_in" },
    { label: "L-Cm", key: "l_cm" },
    { label: "Wt/Unit", key: "wt_unit" },
    { label: "GSM", key: "gsm" },
    { label: "Unit/Carton", key: "unit_carton" },
    { label: "Inner Pack Unit Quantity", key: "inner_pack" },
    { label: "Fold", key: "fold" },
    { label: "", key: "actions" },
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
    { label: "", key: "actions" },
  ];

  const handleSetsActions = {
    onAddRow: (idx) => setSetsTables(prev => prev.map((t, i) => i === idx ? { ...t, variants: [...t.variants, {}] } : t)),
    onDeleteRow: (groupIdx, rowIdx) => setSetsTables(prev => prev.map((g, i) => i === groupIdx ? { ...g, variants: g.variants.filter((_, r) => r !== rowIdx) } : g)),
    onAddTable: (idx) => setSetsTables(prev => [...prev.slice(0, idx + 1), createEmptyGroup(), ...prev.slice(idx + 1)]),
    onCopyTable: (idx) => setSetsTables(prev => [...prev, structuredClone(prev[idx])]),
    onDeleteTable: (idx) => setSetsTables(prev => prev.filter((_, i) => i !== idx)),
  };

  const handleUnitActions = {
    onAddRow: (idx) => setUnitTables(prev => prev.map((t, i) => i === idx ? { ...t, variants: [...t.variants, {}] } : t)),
    onDeleteRow: (groupIdx, rowIdx) => setUnitTables(prev => prev.map((g, i) => i === groupIdx ? { ...g, variants: g.variants.filter((_, r) => r !== rowIdx) } : g)),
    onAddTable: (idx) => setUnitTables(prev => [...prev.slice(0, idx + 1), createEmptyGroup(), ...prev.slice(idx + 1)]),
    onCopyTable: (idx) => setUnitTables(prev => [...prev, structuredClone(prev[idx])]),
    onDeleteTable: (idx) => setUnitTables(prev => prev.filter((_, i) => i !== idx)),
  };

  const handleSampleActions = {
    onAddRow: () => setSampleRows(prev => [...prev, {}]),
    onDeleteRow: (idx) => setSampleRows(prev => prev.filter((_, i) => i !== idx)),
  };

  const handleUpdateSetsCell = useCallback((groupIdx, variantIdx, field, value) => {
    setSetsTables(prev => prev.map((group, gIdx) => {
      if (gIdx !== groupIdx) return group;
      if (variantIdx === null) return { ...group, [field]: value };
      const newVariants = group.variants.map((v, vI) =>
        vI === variantIdx ? { ...v, [field]: value } : v
      );
      return { ...group, variants: newVariants };
    }));
  }, []);

  const handleUpdateUnitCell = useCallback((groupIdx, variantIdx, field, value) => {
    setUnitTables(prev => prev.map((group, gIdx) => {
      if (gIdx !== groupIdx) return group;
      if (variantIdx === null) return { ...group, [field]: value };
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
          program: '',
          unit_carton: '',
          inner_pack: '',
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
                { style: '', w_in: '',w_cm: '', l_in: '',l_cm: '', wt_unit: '', gsm: '' }
              ]
            }
          : group
      );
    });
  };

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
      // Helper to safely get string value or convert boolean
      const safeString = (value) => {
        if (typeof value === 'boolean') return value;
        return value?.trim?.() || "";
      };

      const payload = {
        activity_program_status_id: Number(id),
        activity_name: "Carton Program Request",
        program_name: formData.programName.trim(),
        btn: status,
        sent_to_user_id: selectedUserId || null,
        carton_program: {
          customer_name: formData.customerName.trim(),
          customer_protocol: safeString(formData.customerProtocol),
          confirm_new_or_shifted_from_vapi: safeString(formData.newOrShifted),
          original_towel: safeString(formData.originalTowel),
          polybag_manual_or_automatic: safeString(formData.polybagManualAuto),
          polybag_type: safeString(formData.polybagType),
          pallet_or_slipsheet_requirement: safeString(formData.palletRequirement),
          special_carton_required: safeString(formData.specialCarton),
          pdq_required: safeString(formData.specialPDQ),
          cdu_required: safeString(formData.specialCDU),
          sample_carton_arranged: safeString(formData.sampleCarton),
          pdq_arranged: safeString(formData.samplePDQ),
          cdu_arranged: safeString(formData.sampleCDU),
          shipped_as_single_pdq_or_monster_pdq: safeString(formData.singleOrMonsterPDQ),
          pdq_layers_stacking_details: safeString(formData.pdqLayers),
          common_pdq_same_dimension_for_all_sizes: safeString(formData.commonPDQ),
          small_pdq_on_pallet_or_slipsheet: safeString(formData.smallPDQRequirement),
          small_pdq_count_on_pallet_or_slipsheet: safeString(formData.smallPDQQuantity),
          warehouse_store_handling_method: safeString(formData.warehouseHandling),
          towel_folded_and_poly_packed_before_carton: safeString(formData.towelFoldCondition),
          separator_protector_stiffener_required: safeString(formData.separatorRequired),
          ribbon_packing_required: safeString(formData.ribbonPacking),
          belly_band_packing_required: safeString(formData.bellyBandPacking)
        },
        subprograms: [...setsTables, ...unitTables]
          .filter(group => {
            if (!group.program?.trim()) return false;

            const hasValidVariants = group.variants?.some(variant => {
              return variant.style?.trim() ||
                (variant.w_in && variant.w_in !== '0') ||
                (variant.w_cm && variant.w_cm !== '0') ||
                (variant.l_in && variant.l_in !== '0') ||
                (variant.l_cm && variant.l_cm !== '0') ||
                (variant.gsm && variant.gsm !== '0');
            });

            return hasValidVariants;
          })
          .flatMap(group => {
            const validVariants = group.variants.filter(variant => {
              return variant.style?.trim() ||
                (variant.w_in && variant.w_in !== '0') ||
                (variant.w_cm && variant.w_cm !== '0') ||
                (variant.l_in && variant.l_in !== '0') ||
                (variant.l_cm && variant.l_cm !== '0') ||
                (variant.gsm && variant.gsm !== '0');
            });

            return validVariants.map(variant => ({
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
              fold: group.fold?.trim() || ""
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
          }))
      };

      console.log('📦 Updating carton program...');
      let response;
      if (selectedFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('data', JSON.stringify(payload));
        formDataToSend.append('attachment', selectedFile);

        response = await api.post('/api/carton-program/edit/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/api/carton-program/edit/', payload, {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { message: submitMessage, program_id } = response.data;
      console.log(`✅ Program updated. ID: ${program_id || id}, Message: ${submitMessage}`);

      let attachmentResult = null;
      if (selectedFile && (program_id || id)) {
        console.log('📎 Uploading attachment...', selectedFile.name);
        attachmentResult = await uploadAttachment(program_id || id, selectedFile);
      }

      setSubmitStatus('success');
      toast.success("Request updated successfully");

      setTimeout(() => navigate('/'), 1500);

    } catch (err) {
      console.error('❌ Update failed:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Unknown error';
      setSubmitStatus('error');
      setErrorMessage(`Update failed: ${errMsg}`);
      toast.error(`Update failed: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-sm">
      <div className="max-w-7xl mx-auto max-h-[120vh] overflow-auto px-2.5 sm:px-4">
        <div className="mb-6 flex items-center gap-4 sticky top-0 bg-gray-50 py-4 formHeader">
          <button
            onClick={() => navigate('/')}
            disabled={loading}
            className="p-2 bg-white shadow cursor-pointer hover:bg-gray-100 rounded-full transition-colors group disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-[#0f3460]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Edit Carton Program</h1>
        </div>

        {/* {submitStatus && (
          <div className="fixed top-16 right-6 z-50">
            <div className={`px-6 py-4 rounded-lg shadow-xl text-sm font-semibold transition-all duration-300
              ${submitStatus === 'success' && 'bg-green-50 border border-green-200 text-green-800'}
              ${submitStatus === 'draft' && 'bg-blue-50 border border-blue-200 text-blue-800'}
              ${submitStatus === 'error' && 'bg-red-50 border border-red-200 text-red-800'}
            `}>
              {submitStatus === 'success' && (
                <div className="flex flex-col">
                  <span>{successMessage}</span>
                  <span className="text-xs text-gray-600 mt-2">
                    Redirecting to home page...
                  </span>
                </div>
              )}
              {submitStatus === 'draft' && '💾 Draft Updated Successfully'}
              {submitStatus === 'error' && `❌ ${errorMessage || 'Update Failed'}`}
            </div>
          </div>
        )} */}

        <Form
          formData={formData}
          onInputChange={handleInputChange}
          onCompanyChange={handleCompanyChange}
          companies={companies}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          loading={loading}
          hideAttachment={true} 
        />

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

          {/* <Table
            title="Program Specifications"
            headers={programHeaders}
            data={unitTables}
            type="grouped"
            onAddRow={() => addVariantToLastGroup(setUnitTables)}
            onDeleteRow={handleUnitActions.onDeleteRow}
            onAddTable={handleUnitActions.onAddTable}
            onCopyTable={handleUnitActions.onCopyTable}
            onDeleteTable={handleUnitActions.onDeleteTable}
            onUpdateCell={handleUpdateUnitCell}
          /> */}
          {/* 
          <Table
            title="Sample Specifications"
            headers={sampleHeaders}
            data={sampleRows}
            type="flat"
            onAddRow={handleSampleActions.onAddRow}
            onDeleteRow={handleSampleActions.onDeleteRow}
            onUpdateCell={handleUpdateSampleCell}
          /> */}
        </div>

        <div className="bg-white p-6 my-12 rounded-lg shadow-sm border border-gray-100 flex justify-between items-end">
          <div className="w-72">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Request Sent To
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              disabled={loading}
              className="w-full border border-gray-300 rounded-md p-3 bg-white text-gray-700 focus:outline-none focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460]"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleSubmit('Save As Draft')}
              disabled={loading}
              className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer text-white ${
                loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#FFA800] hover:bg-[#EFBF04]'
              }`}
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={() => handleSubmit('Pending')}
              disabled={loading}
              className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer text-white ${
                loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#0f3460] hover:bg-[#0a2545]'
              }`}
            >
              {loading ? 'Updating...' : 'Update Carton Program'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditCartonForm;



// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../../api/axiosInstance';
// import Form from './Form';
// import Table from './Table';
// import { toast } from 'react-toastify';

// function EditCartonForm({ onBack }) {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     companyName: '',
//     customerName: '',
//     programName: '',
//     customerProtocol: '',
//     newOrShifted: '',
//     originalTowel: '',
//     polybagManualAuto: '',
//     polybagType: '',
//     palletRequirement: '',
//     specialCarton: '',
//     sampleCarton: '',
//     singleOrMonsterPDQ: '',
//     pdqLayers: '',
//     commonPDQ: '',
//     smallPDQRequirement: '',
//     smallPDQQuantity: '',
//     warehouseHandling: '',
//     towelFoldCondition: '',
//     separatorRequired: '',
//     ribbonPacking: '',
//     bellyBandPacking: '',
//   });

//   const [companies, setCompanies] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [selectedUserId, setSelectedUserId] = useState('');
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [submitStatus, setSubmitStatus] = useState(null);
//   const [fetchLoading, setFetchLoading] = useState(true);
//   const [fetchError, setFetchError] = useState(null);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
  
//   const [setsTables, setSetsTables] = useState([]);
//   const [unitTables, setUnitTables] = useState([]);
//   const [sampleRows, setSampleRows] = useState([]);

//   useEffect(() => {
//     const fetchStaticData = async () => {
//       try {
//         const [usersRes] = await Promise.all([
//           api.get('/api/users/list/'),
//         ]);
        
//         const filteredUsers = (usersRes.data || []).filter(
//           (user) => user.username !== 'admin'
//         );
//         setUsers(filteredUsers);

//         if (filteredUsers.length > 0) {
//           setSelectedUserId(filteredUsers[0].id);
//         }
//       } catch (err) {
//         console.error('Failed to fetch static data:', err);
//       }
//     };

//     fetchStaticData();
//   }, []);

//   useEffect(() => {
//     if (!id) return;

//     const fetchDetails = async () => {
//       setFetchLoading(true);
//       setFetchError(null);

//       try {
//         const response = await api.post('/api/carton-program/details/', {
//           activity_program_status_id: Number(id),
//         });

//         const data = response.data;

//         const cp = data.carton_program || {};

//         setFormData({
//           companyName: '',
//           customerName: cp.customer_name || '',
//           programName: cp.program_name || '',
//           customerProtocol: cp.customer_protocol || '',
//           newOrShifted: cp.confirm_new_or_shifted_from_vapi || '',
//           originalTowel: cp.original_towel || '',
//           polybagManualAuto: cp.polybag_manual_or_automatic || '',
//           polybagType: cp.polybag_type || '',
//           palletRequirement: cp.pallet_or_slipsheet_requirement || '',
//           specialCarton: cp.special_carton_pdq_cdu_required || '',
//           sampleCarton: cp.sample_arranged_for_special_carton_pdq_cdu || '',
//           singleOrMonsterPDQ: cp.shipped_as_single_pdq_or_monster_pdq || '',
//           pdqLayers: cp.pdq_layers_stacking_details || '',
//           commonPDQ: cp.common_pdq_same_dimension_for_all_sizes || '',
//           smallPDQRequirement: cp.small_pdq_on_pallet_or_slipsheet || '',
//           smallPDQQuantity: cp.small_pdq_count_on_pallet_or_slipsheet || '',
//           warehouseHandling: cp.warehouse_store_handling_method || '',
//           towelFoldCondition: cp.towel_folded_and_poly_packed_before_carton || '',
//           separatorRequired: cp.separator_protector_stiffener_required || '',
//           ribbonPacking: cp.ribbon_packing_required || '',
//           bellyBandPacking: cp.belly_band_packing_required || '',
//         });

//         const subprograms = (data.subprograms || []).filter(sub => {
//           const hasValidDimensions = sub.width_in && sub.width_in !== 0 && sub.width_in !== '0' &&
//                                     sub.length_in && sub.length_in !== 0 && sub.length_in !== '0';
//           const hasValidGsm = sub.gsm && sub.gsm !== 0 && sub.gsm !== '0';
//           const hasValidUnits = sub.unit_per_carton && sub.unit_per_carton !== 0 && sub.unit_per_carton !== '0';
//           const hasStyle = sub.style && sub.style.trim() !== '';
//           const hasFold = sub.fold && sub.fold.trim() !== '';
          
//           return hasValidDimensions || hasValidGsm || hasValidUnits || hasStyle || hasFold;
//         });

//         const sets = [];
//         const units = [];

//         subprograms.forEach(sub => {
//           const gsm = Number(sub.gsm) || 0;
//           const targetGroup = gsm >= 400 ? sets : units;

//           targetGroup.push({
//             program: sub.program_name || '',
//             unit_carton: sub.unit_per_carton || '',
//             inner_pack: sub.inner_pack_unit_qty || '',
//             fold: sub.fold || '',
//             variants: [{
//               style: sub.style || '',
//               w_in: sub.width_in?.toString() || '',
//               l_in: sub.length_in?.toString() || '',
//               wt_unit: sub.wt_per_unit?.toString() || '',
//               gsm: sub.gsm?.toString() || '',
//             }],
//           });
//         });

//         setSetsTables(sets.length > 0 ? sets : [createEmptyGroup()]);
//         setUnitTables(units.length > 0 ? units : [createEmptyGroup()]);

//         const samples = data.samples || [];
//         const formattedSamples = samples.map(s => ({
//           col1: s.sample || '',
//           col2: s.size || '',
//           col3: s.program_name || '',
//           col4: s.quality || '',
//           col5: s.lbs_per_dz?.toString() || '',
//           col6: s.gsm?.toString() || '',
//           col7: s.shade || '',
//           col8: s.width_in?.toString() || '',
//           col9: s.length_in?.toString() || '',
//         }));

//         setSampleRows(formattedSamples.length > 0 ? formattedSamples : [{}]);

//       } catch (err) {
//         console.error('Failed to load carton details:', err);
//         setFetchError(
//           err.response?.data?.detail ||
//           err.response?.data?.error ||
//           'Could not load existing data. You can still create a new one.'
//         );
//       } finally {
//         setFetchLoading(false);
//       }
//     };

//     fetchDetails();
//   }, [id]);

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

//   const handleInputChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   }, []);

//   const handleCompanyChange = useCallback((e) => {
//     const companyName = e.target.value;
//     setFormData((prev) => ({ ...prev, companyName }));
//     if (companyName) localStorage.setItem('companyName', companyName);
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

//   const createEmptyGroup = useCallback(() => ({
//     program: '',
//     unit_carton: '',
//     inner_pack: '',
//     fold: '',
//     variants: [{
//       style: '',
//       w_in: '',
//       l_in: '',
//       wt_unit: '',
//       gsm: '',
//     }],
//   }), []);

//   const programHeaders = [
//     { label: "Program", key: "program" },
//     { label: "Style", key: "style", hasAddBtn: true },
//     { label: "W-In", key: "w_in" },
//     { label: "L-In", key: "l_in" },
//     { label: "Wt/Unit", key: "wt_unit" },
//     { label: "GSM", key: "gsm" },
//     { label: "Unit/Carton", key: "unit_carton" },
//     { label: "Inner Pack Unit Quantity", key: "inner_pack" },
//     { label: "Fold", key: "fold" },
//     { label: "", key: "actions" },
//   ];

//   const sampleHeaders = [
//     { label: "Sample", key: "col1", hasAddBtn: true },
//     { label: "Size", key: "col2" },
//     { label: "Program", key: "col3" },
//     { label: "Quality", key: "col4" },
//     { label: "LBS/DZ", key: "col5" },
//     { label: "GSM", key: "col6" },
//     { label: "Shade", key: "col7" },
//     { label: "W-IN", key: "col8" },
//     { label: "L-IN", key: "col9" },
//     { label: "", key: "actions" },
//   ];

//   const handleSetsActions = {
//     onAddRow: (idx) => setSetsTables(prev => prev.map((t, i) => i === idx ? { ...t, variants: [...t.variants, {}] } : t)),
//     onDeleteRow: (groupIdx, rowIdx) => setSetsTables(prev => prev.map((g, i) => i === groupIdx ? { ...g, variants: g.variants.filter((_, r) => r !== rowIdx) } : g)),
//     onAddTable: (idx) => setSetsTables(prev => [...prev.slice(0, idx + 1), createEmptyGroup(), ...prev.slice(idx + 1)]),
//     onCopyTable: (idx) => setSetsTables(prev => [...prev, structuredClone(prev[idx])]),
//     onDeleteTable: (idx) => setSetsTables(prev => prev.filter((_, i) => i !== idx)),
//   };

//   const handleUnitActions = {
//     onAddRow: (idx) => setUnitTables(prev => prev.map((t, i) => i === idx ? { ...t, variants: [...t.variants, {}] } : t)),
//     onDeleteRow: (groupIdx, rowIdx) => setUnitTables(prev => prev.map((g, i) => i === groupIdx ? { ...g, variants: g.variants.filter((_, r) => r !== rowIdx) } : g)),
//     onAddTable: (idx) => setUnitTables(prev => [...prev.slice(0, idx + 1), createEmptyGroup(), ...prev.slice(idx + 1)]),
//     onCopyTable: (idx) => setUnitTables(prev => [...prev, structuredClone(prev[idx])]),
//     onDeleteTable: (idx) => setUnitTables(prev => prev.filter((_, i) => i !== idx)),
//   };

//   const handleSampleActions = {
//     onAddRow: () => setSampleRows(prev => [...prev, {}]),
//     onDeleteRow: (idx) => setSampleRows(prev => prev.filter((_, i) => i !== idx)),
//   };

//   const handleUpdateSetsCell = useCallback((groupIdx, variantIdx, field, value) => {
//     setSetsTables(prev => prev.map((group, gIdx) => {
//       if (gIdx !== groupIdx) return group;
//       if (variantIdx === null) return { ...group, [field]: value };
//       const newVariants = group.variants.map((v, vI) =>
//         vI === variantIdx ? { ...v, [field]: value } : v
//       );
//       return { ...group, variants: newVariants };
//     }));
//   }, []);

//   const handleUpdateUnitCell = useCallback((groupIdx, variantIdx, field, value) => {
//     setUnitTables(prev => prev.map((group, gIdx) => {
//       if (gIdx !== groupIdx) return group;
//       if (variantIdx === null) return { ...group, [field]: value };
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
//           program: '',
//           unit_carton: '',
//           inner_pack: '',
//           fold: '',
//           variants: [{
//             style: '',
//             w_in: '',
//             l_in: '',
//             wt_unit: '',
//             gsm: '',
//           }]
//         }];
//       }
//       return prev.map((group, i) =>
//         i === prev.length - 1
//           ? {
//               ...group,
//               variants: [
//                 ...group.variants,
//                 { style: '', w_in: '', l_in: '', wt_unit: '', gsm: '' }
//               ]
//             }
//           : group
//       );
//     });
//   };

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

//   const handleSubmit = async (status = 'Pending') => {
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
//       const payload = {
//         activity_program_status_id: Number(id),
//         activity_name: "Carton Program Request",
//         program_name: formData.programName.trim(),
//         btn: status,
//         sent_to_user_id: selectedUserId || null,
//         carton_program: {
//           customer_name: formData.customerName.trim(),
//           customer_protocol: formData.customerProtocol?.trim() || "",
//           confirm_new_or_shifted_from_vapi: formData.newOrShifted?.trim() || "",
//           original_towel: formData.originalTowel?.trim() || "",
//           polybag_manual_or_automatic: formData.polybagManualAuto?.trim() || "",
//           polybag_type: formData.polybagType?.trim() || "",
//           pallet_or_slipsheet_requirement: formData.palletRequirement?.trim() || "",
//           special_carton_pdq_cdu_required: formData.specialCarton?.trim() || "",
//           sample_arranged_for_special_carton_pdq_cdu: formData.sampleCarton?.trim() || "",
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
//         subprograms: [...setsTables, ...unitTables]
//           .filter(group => {
//             if (!group.program?.trim()) return false;
            
//             const hasValidVariants = group.variants?.some(variant => {
//               return variant.style?.trim() || 
//                      (variant.w_in && variant.w_in !== '0') || 
//                      (variant.l_in && variant.l_in !== '0') ||
//                      (variant.gsm && variant.gsm !== '0');
//             });
            
//             return hasValidVariants;
//           })
//           .flatMap(group => {
//             const validVariants = group.variants.filter(variant => {
//               return variant.style?.trim() || 
//                      (variant.w_in && variant.w_in !== '0') || 
//                      (variant.l_in && variant.l_in !== '0') ||
//                      (variant.gsm && variant.gsm !== '0');
//             });
            
//             return validVariants.map(variant => ({
//               program_name: group.program?.trim() || "",
//               style: variant.style?.trim() || "",
//               width_in: Number(variant.w_in) || 0,
//               length_in: Number(variant.l_in) || 0,
//               wt_per_unit: Number(variant.wt_unit) || 0,
//               gsm: Number(variant.gsm) || 0,
//               unit_per_carton: group.unit_carton?.trim() || "",
//               inner_pack_unit_qty: group.inner_pack?.trim() || "",
//               fold: group.fold?.trim() || ""
//             }));
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
//             length_in: Number(row.col9) || 0
//           }))
//       };

//       console.log('📦 Updating carton program...');
//       let response;
//       if (selectedFile) {
//         const formDataToSend = new FormData();
//         formDataToSend.append('data', JSON.stringify(payload));
//         formDataToSend.append('attachment', selectedFile);
        
//         response = await api.post('/api/carton-program/edit/', formDataToSend, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//       } else {
//         response = await api.post('/api/carton-program/edit/', payload, {
//           headers: { 'Content-Type': 'application/json' },
//         });
//       }

//       const { message: submitMessage, program_id } = response.data;
//       console.log(`✅ Program updated. ID: ${program_id || id}, Message: ${submitMessage}`);

//       let attachmentResult = null;
//       if (selectedFile && (program_id || id)) {
//         console.log('📎 Uploading attachment...', selectedFile.name);
//         attachmentResult = await uploadAttachment(program_id || id, selectedFile);
//       }

//       let successMsg = `✅ Carton Program ${status === 'Draft' ? 'Draft Updated' : 'Updated'} Successfully`;
//       if (program_id) {
//         successMsg += ` (ID: ${program_id})`;
//       }

//       if (attachmentResult) {
//         if (attachmentResult.success) {
//           successMsg += ` • Attachment Uploaded`;
//         } else {
//           successMsg += ` • Attachment upload failed: ${attachmentResult.message}`;
//         }
//       }

//       // setSuccessMessage(successMsg);
//       setSubmitStatus('success');

//       toast.success("Request updated successfully");

//       setTimeout(() => navigate('/'), 1500);

//     } catch (err) {
//       console.error('❌ Update failed:', err);
//       const errMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Unknown error';
//       setSubmitStatus('error');
//       setErrorMessage(`Update failed: ${errMsg}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 font-sans text-sm">
//       <div className="max-w-7xl mx-auto max-h-[120vh] overflow-auto px-2.5 sm:px-4">
//         <div className="mb-6 flex items-center gap-4 sticky top-0 bg-gray-50 py-4 formHeader">
//           <button
//             onClick={() => navigate('/')}
//             disabled={loading}
//             className="p-2 bg-white shadow cursor-pointer hover:bg-gray-100 rounded-full transition-colors group disabled:opacity-50"
//           >
//             <svg className="w-5 h-5 text-gray-500 group-hover:text-[#0f3460]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//             </svg>
//           </button>
//           <h1 className="text-xl font-bold text-gray-800">Edit Carton Program</h1>
//         </div>

//         {/* {submitStatus && (
//           <div className="fixed top-16 right-6 z-50">
//             <div className={`px-6 py-4 rounded-lg shadow-xl text-sm font-semibold transition-all duration-300
//               ${submitStatus === 'success' && 'bg-green-50 border border-green-200 text-green-800'}
//               ${submitStatus === 'draft' && 'bg-blue-50 border border-blue-200 text-blue-800'}
//               ${submitStatus === 'error' && 'bg-red-50 border border-red-200 text-red-800'}
//             `}>
//               {submitStatus === 'success' && (
//                 <div className="flex flex-col">
//                   <span>{successMessage}</span>
//                   <span className="text-xs text-gray-600 mt-2">
//                     Redirecting to home page...
//                   </span>
//                 </div>
//               )}
//               {submitStatus === 'draft' && '💾 Draft Updated Successfully'}
//               {submitStatus === 'error' && `❌ ${errorMessage || 'Update Failed'}`}
//             </div>
//           </div>
//         )} */}

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

//           {/* <Table
//             title="Program Specifications"
//             headers={programHeaders}
//             data={unitTables}
//             type="grouped"
//             onAddRow={() => addVariantToLastGroup(setUnitTables)}
//             onDeleteRow={handleUnitActions.onDeleteRow}
//             onAddTable={handleUnitActions.onAddTable}
//             onCopyTable={handleUnitActions.onCopyTable}
//             onDeleteTable={handleUnitActions.onDeleteTable}
//             onUpdateCell={handleUpdateUnitCell}
//           />

//           <Table
//             title="Sample Specifications"
//             headers={sampleHeaders}
//             data={sampleRows}
//             type="flat"
//             onAddRow={handleSampleActions.onAddRow}
//             onDeleteRow={handleSampleActions.onDeleteRow}
//             onUpdateCell={handleUpdateSampleCell}
//           /> */}
//         </div>

//         <div className="bg-white p-6 my-12 rounded-lg shadow-sm border border-gray-100 flex justify-between items-end">
//           <div className="w-72">
//             <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
//               Request Sent To
//             </label>
//             <select
//               value={selectedUserId}
//               onChange={(e) => setSelectedUserId(Number(e.target.value))}
//               disabled={loading}
//               className="w-full border border-gray-300 rounded-md p-3 bg-white text-gray-700 focus:outline-none focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460]"
//             >
//               <option value="">Select User</option>
//               {users.map((user) => (
//                 <option key={user.id} value={user.id}>
//                   {user.username} ({user.role})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="flex gap-4">
//             <button
//               onClick={() => handleSubmit('Save As Draft')}
//               disabled={loading}
//               className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer text-white ${
//                 loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#FFA800] hover:bg-[#EFBF04]'
//               }`}
//             >
//               {loading ? 'Saving...' : 'Save Draft'}
//             </button>

//             <button
//               onClick={() => handleSubmit('Pending')}
//               disabled={loading}
//               className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer text-white ${
//                 loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#0f3460] hover:bg-[#0a2545]'
//               }`}
//             >
//               {loading ? 'Updating...' : 'Update Carton Program'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default EditCartonForm;
