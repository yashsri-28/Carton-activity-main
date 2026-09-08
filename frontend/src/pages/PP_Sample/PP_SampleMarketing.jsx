// // src/pages/PP_Sample/PP_SampleMarketing.jsx
import React, { useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axiosInstance";

function PPSampleMarketing() {
  // ==================== FORM DATA (now includes all missing fields from backend) ====================
  const [formData, setFormData] = useState({
    sampleSaleOrderNo: "",
    noOfSampleSKU: "",
    remarksTop: "",
    existingCustomer: false,
    customerName: "",
    brandName: "",
    saleOrderNumber: "",
  });

  // ==================== REQUIREMENTS TABLE (All 5 items) ====================
  const requirementList = [
    { key: "testing", label: "Testing" },
    { key: "advPhotoshoot", label: "Adv/Photoshoot" },
    { key: "top", label: "Top" },
    { key: "pp", label: "PP" },
    { key: "other", label: "Any Other" },
  ];

  const initialRequirements = requirementList.reduce((acc, { key }) => {
    acc[key] = { enabled: false, date: "", remark: "" };
    return acc;
  }, {});

  const [requirements, setRequirements] = useState(initialRequirements);
  const [loading, setLoading] = useState(false);

  // ==================== MATERIAL TABLE ====================
  const headerMap = {
    salesOrderNo: "Sales Order No.",
    customerPONo: "Customer P.O No",
    finishMaterial: "Finish Material",
    materialDescription: "Material Description",
    salesItem: "Sales Item",
    shadeNameVC: "Shade_Name_VC",
    soQty: "SO Qty",
    plant: "Plant",
    soldToParty: "Sold to party",
    soText: "SO Text",
    shadeVCSODate: "Shade_VC S O Date",
    weavingQty: "Weaving Qty",
    balanceWeavingQty: "Balance Weaving Qty",
    processQty: "Process Qty",
    soType: "S.O. type",
    wipPc: "WIP PC",
    wipKg: "WIP KG",
  };

  const materialColumns = Object.entries(headerMap).map(([key, header]) => ({
    key,
    header,
    inputType: [
      "soQty",
      "weavingQty",
      "balanceWeavingQty",
      "processQty",
      "wipPc",
      "wipKg",
    ].includes(key)
      ? "number"
      : "text",
  }));

  const initialMaterialRow = {
    id: 1,
    salesOrderNo: "",
    customerPONo: "",
    finishMaterial: "",
    materialDescription: "",
    salesItem: "",
    shadeNameVC: "",
    soQty: "",
    plant: "",
    soldToParty: "",
    soText: "",
    shadeVCSODate: "",
    weavingQty: "",
    balanceWeavingQty: "",
    processQty: "",
    soType: "",
    wipPc: "",
    wipKg: "",
  };

  const [materialRows, setMaterialRows] = useState([initialMaterialRow]);

  // ==================== HANDLERS ====================
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRequirementChange = (key, field, value) => {
    setRequirements((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const addNewMaterialRow = () => {
    const newId = materialRows.length
      ? Math.max(...materialRows.map((r) => r.id)) + 1
      : 1;
    const emptyRow = { id: newId };
    Object.keys(headerMap).forEach((key) => (emptyRow[key] = ""));
    setMaterialRows([...materialRows, emptyRow]);
  };

  const removeMaterialRow = (id) => {
    if (materialRows.length === 1)
      return toast.warn("At least one row is required");
    setMaterialRows(materialRows.filter((row) => row.id !== id));
  };

  const updateMaterialRow = (id, field, value) => {
    setMaterialRows(
      materialRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  };

  // ==================== SUBMIT - EXACT MATCH TO YOUR BACKEND PAYLOAD ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sampleSaleOrderNo.trim()) {
      return toast.error("Sample sale order no is required");
    }

    const payload = {
      sample_sale_order_no: formData.sampleSaleOrderNo.trim() || "Enquiry",
      existing_customer: formData.existingCustomer,
      customer_name: formData.customerName.trim(),
      brand_name: formData.brandName.trim(),
      sale_order_number: formData.saleOrderNumber.trim() || "",
      no_of_samples: Number(formData.noOfSampleSKU) || 0,
      remarks: formData.remarksTop.trim() || "",

      // === Requirement Dates (mapped from table) ===
      ppc_sample_requirement_date: requirements.pp.date || null,
      top_sample_requirement_date: requirements.top.date || null,
      testing_requirement_date: requirements.testing.date || null,
      adv_photoshoot_requirement_date: requirements.advPhotoshoot.date || null,
      anyother_requirement_date: requirements.other.date || null,

      // === Actual Dates (using same value as requirement date - since form has only one date field) ===
      ppc_actual_requirement_date: requirements.pp.date || null,
      top_actual_requirement_date: requirements.top.date || null,
      testing_actual_requirement_date: requirements.testing.date || null,
      adv_photoshoot_actual_requirement_date:
        requirements.advPhotoshoot.date || null,
      anyother_actual_requirement_date: requirements.other.date || null,

      // === Toggles ===
      top_required: requirements.top.enabled,
      testing_required: requirements.testing.enabled,
      pp_required: requirements.pp.enabled,
      adv_photoshoot_required: requirements.advPhotoshoot.enabled,

      // === Remarks ===
      pp_remarks: requirements.pp.remark.trim() || "",
      top_remarks: requirements.top.remark.trim() || "",
      testing_remarks: requirements.testing.remark.trim() || "",
      adv_photoshoot_remarks: requirements.advPhotoshoot.remark.trim() || "",
      anyother_remarks: requirements.other.remark.trim() || "",

      // === Any Other special field ===
      anyother_requirement: requirements.other.remark.trim() || "",

      btn: "submit",
    };

    setLoading(true);
    try {
      const response = await api.post("/api/pp-sample/submit/", payload);
      toast.success("Sample - Top/Testing Etc submitted successfully!");
      console.log("Server response:", response.data);

      // Reset form
      setFormData({
        sampleSaleOrderNo: "",
        noOfSampleSKU: "",
        remarksTop: "",
        existingCustomer: false,
        customerName: "",
        brandName: "",
        saleOrderNumber: "",
      });
      setRequirements(initialRequirements);
      setMaterialRows([initialMaterialRow]);
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit Sample - Top/Testing Etc. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto max-w-8xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sample - Top/Testing Etc</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-10 max-h-[100vh] overflow-y-auto pb-12 pr-4 scroll-smooth"
      >
        {/* ==================== TOP FIELDS ==================== */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sample Sale Order No
            </label>
            <input
              type="text"
              name="sampleSaleOrderNo"
              placeholder="Enter Sample Sale Order No"
              value={formData.sampleSaleOrderNo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. of Sample SKU
            </label>
            <input
              type="text"
              name="noOfSampleSKU"
              value={formData.noOfSampleSKU}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              General Remarks
            </label>
            <input
              type="text"
              name="remarksTop"
              value={formData.remarksTop}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* ==================== CUSTOMER DETAILS (added to match backend payload) ==================== */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Existing Customer
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="existingCustomer"
                checked={formData.existingCustomer}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#003366] transition-all duration-300">
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${formData.existingCustomer ? "translate-x-5" : ""
                    }`}
                />
              </div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Order Number
            </label>
            <input
              type="text"
              name="saleOrderNumber"
              value={formData.saleOrderNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* ==================== SAMPLE REQUIREMENTS TABLE (Fixed Height + Internal Scroll) ==================== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Sample Requirements
            </h2>
          </div>

          {/* FIXED HEIGHT SCROLLABLE TABLE */}
          <div className="max-h-[380px] overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full min-w-[900px] divide-y divide-gray-200 text-sm">
              <thead className="bg-[#001f3f] text-white sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left font-medium w-48">
                    REQUIREMENT
                  </th>
                  <th className="px-6 py-4 text-center font-medium w-28">
                    ENABLE/DISABLE
                  </th>
                  <th className="px-4 py-4 text-left font-medium w-40">DATE</th>
                  <th className="px-6 py-4 text-left font-medium">REMARK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {requirementList.map(({ key, label }) => {
                  const isEnabled = requirements[key].enabled;
                  return (
                    <tr
                      key={key}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-5 font-medium text-gray-800">
                        {label}
                      </td>

                      {/* Toggle */}
                      <td className="px-6 py-5 text-center">
                        {/* <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleRequirementChange(key, "enabled", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#003366] transition-all">
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isEnabled ? "translate-x-5" : ""
                                }`}
                            />
                          </div>
                        </label> */}

                        {/* <label className="inline-flex items-center cursor-pointer relative">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(e) => handleRequirementChange(key, "enabled", e.target.checked)}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#003366] transition-all">
                                  <div
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                                      isEnabled ? "translate-x-5" : ""
                                    }`}
                                  />
                                </div>
                              </label> */}

                        <label className="inline-flex items-center cursor-pointer relative">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) =>
                              handleRequirementChange(
                                key,
                                "enabled",
                                e.target.checked,
                              )
                            }
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#003366] transition-all">
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isEnabled ? "translate-x-5" : ""
                                }`}
                            />
                          </div>
                        </label>
                      </td>

                      {/* Date Picker */}
                      <td className="px-4 py-5">
                        <div className="relative">
                          <input
                            type="date"
                            value={requirements[key].date}
                            onChange={(e) =>
                              handleRequirementChange(
                                key,
                                "date",
                                e.target.value,
                              )
                            }
                            disabled={!isEnabled}
                            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEnabled
                                ? "border-gray-300 bg-white"
                                : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                          />
                          <Calendar
                            className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${!isEnabled && "opacity-30"}`}
                            size={16}
                          />
                        </div>
                      </td>

                      {/* Remark */}
                      <td className="px-6 py-5">
                        <input
                          type="text"
                          value={requirements[key].remark}
                          onChange={(e) =>
                            handleRequirementChange(
                              key,
                              "remark",
                              e.target.value,
                            )
                          }
                          disabled={!isEnabled}
                          placeholder={
                            isEnabled
                              ? "Enter remark..."
                              : "Enable toggle first"
                          }
                          className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEnabled
                              ? "border-gray-300 bg-white"
                              : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================== MATERIAL / SALES ORDER TABLE ==================== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="max-h-[200px] overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#001f3f] text-white sticky top-0 z-20">
                <tr>
                  {materialColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    >
                      {col.header}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider sticky right-0 bg-[#001f3f] z-30">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {materialColumns.map((col) => (
                      <td key={col.key} className="px-4 py-4">
                        <input
                          type={col.inputType}
                          value={row[col.key] || ""}
                          onChange={(e) =>
                            updateMaterialRow(row.id, col.key, e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center sticky right-0 bg-white z-10">
                      <div className="flex justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => removeMaterialRow(row.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={addNewMaterialRow}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-12 py-4 text-white font-semibold rounded-xl shadow-sm flex items-center gap-3 text-base transition-all ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#003366] hover:bg-blue-900 active:scale-95"
              }`}
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Sample - Top/Testing Etc"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PPSampleMarketing;

// old code

// src/pages/PP_Sample/PP_SampleMarketing.jsx
// import React, { useState } from "react";
// import { Calendar, Plus, Trash2 } from "lucide-react";
// import { toast } from "react-toastify";
// import api from "../../api/axiosInstance";

// function PPSampleMarketing() {
//   // ==================== FORM DATA ====================
//   const [formData, setFormData] = useState({
//     sampleSaleOrderNo: "",
//     noOfSampleSKU: "",
//     remarksTop: "",
//   });

//   // ==================== REQUIREMENTS TABLE (All 5 items including Any Other) ====================
//   const requirementList = [
//     { key: "testing", label: "Testing" },
//     { key: "advPhotoshoot", label: "Adv/Photoshoot" },
//     { key: "top", label: "Top" },
//     { key: "pp", label: "PP" },
//     { key: "other", label: "Any Other" },
//   ];

//   const initialRequirements = requirementList.reduce((acc, { key }) => {
//     acc[key] = { enabled: false, date: "", remark: "" };
//     return acc;
//   }, {});

//   const [requirements, setRequirements] = useState(initialRequirements);
//   const [loading, setLoading] = useState(false);

//   // ==================== MATERIAL TABLE ====================
//   const headerMap = {
//     salesOrderNo: "Sales Order No.",
//     customerPONo: "Customer P.O No",
//     finishMaterial: "Finish Material",
//     materialDescription: "Material Description",
//     salesItem: "Sales Item",
//     shadeNameVC: "Shade_Name_VC",
//     soQty: "SO Qty",
//     plant: "Plant",
//     soldToParty: "Sold to party",
//     soText: "SO Text",
//     shadeVCSODate: "Shade_VC S O Date",
//     weavingQty: "Weaving Qty",
//     balanceWeavingQty: "Balance Weaving Qty",
//     processQty: "Process Qty",
//     soType: "S.O. type",
//     wipPc: "WIP PC",
//     wipKg: "WIP KG",
//   };

//   const materialColumns = Object.entries(headerMap).map(([key, header]) => ({
//     key,
//     header,
//     inputType: ["soQty", "weavingQty", "balanceWeavingQty", "processQty", "wipPc", "wipKg"].includes(key)
//       ? "number"
//       : "text",
//   }));

//   const initialMaterialRow = {
//     id: 1,
//     salesOrderNo: "",
//     customerPONo: "",
//     finishMaterial: "",
//     materialDescription: "",
//     salesItem: "",
//     shadeNameVC: "",
//     soQty: "",
//     plant: "",
//     soldToParty: "",
//     soText: "",
//     shadeVCSODate: "",
//     weavingQty: "",
//     balanceWeavingQty: "",
//     processQty: "",
//     soType: "",
//     wipPc: "",
//     wipKg: "",
//   };

//   const [materialRows, setMaterialRows] = useState([initialMaterialRow]);

//   // ==================== HANDLERS ====================
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleRequirementChange = (key, field, value) => {
//     setRequirements((prev) => ({
//       ...prev,
//       [key]: { ...prev[key], [field]: value },
//     }));
//   };

//   const addNewMaterialRow = () => {
//     const newId = materialRows.length ? Math.max(...materialRows.map((r) => r.id)) + 1 : 1;
//     const emptyRow = { id: newId };
//     Object.keys(headerMap).forEach((key) => (emptyRow[key] = ""));
//     setMaterialRows([...materialRows, emptyRow]);
//   };

//   const removeMaterialRow = (id) => {
//     if (materialRows.length === 1) return toast.warn("At least one row is required");
//     setMaterialRows(materialRows.filter((row) => row.id !== id));
//   };

//   const updateMaterialRow = (id, field, value) => {
//     setMaterialRows(materialRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
//   };

//   // ==================== SUBMIT ====================
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.sampleSaleOrderNo.trim()) {
//       return toast.error("Sample sale order no is required");
//     }

//     const payload = {
//       sample_sale_order_no: formData.sampleSaleOrderNo.trim() || "Enquiry",
//       no_of_samples: Number(formData.noOfSampleSKU) || 0,
//       remarks: formData.remarksTop.trim() || "",

//       testing_required: requirements.testing.enabled,
//       testing_date: requirements.testing.date || null,
//       testing_remark: requirements.testing.remark.trim() || "",

//       adv_photoshoot_required: requirements.advPhotoshoot.enabled,
//       adv_photoshoot_date: requirements.advPhotoshoot.date || null,
//       adv_photoshoot_remark: requirements.advPhotoshoot.remark.trim() || "",

//       top_required: requirements.top.enabled,
//       top_date: requirements.top.date || null,
//       top_remark: requirements.top.remark.trim() || "",

//       pp_required: requirements.pp.enabled,
//       pp_date: requirements.pp.date || null,
//       pp_remark: requirements.pp.remark.trim() || "",

//       // Any Other is now fully inside the table (toggle + date + remark)
//       any_other_required: requirements.other.enabled,
//       any_other_date: requirements.other.date || null,
//       any_other_remark: requirements.other.remark.trim() || "",

//       btn: "submit",
//     };

//     setLoading(true);
//     try {
//       const response = await api.post("/api/pp-sample/submit/", payload);
//       toast.success("PP Sample submitted successfully!");
//       console.log("Server response:", response.data);

//       // Reset everything
//       setFormData({
//         sampleSaleOrderNo: "",
//         noOfSampleSKU: "",
//         remarksTop: "",
//       });
//       setRequirements(initialRequirements);
//       setMaterialRows([initialMaterialRow]);
//     } catch (error) {
//       console.error("Submission failed:", error);
//       toast.error("Failed to submit PP Sample. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-4 md:p-6 lg:p-8 mx-auto max-w-screen-2xl">
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">PP Sample</h1>
//       </div>

//       {/* SCROLLABLE FORM - Fixes .app-layout scale(0.8) + overflow:hidden */}
//       <form
//         onSubmit={handleSubmit}
//         className="space-y-10 max-h-[100vh] overflow-y-auto pb-12 pr-4 scroll-smooth"
//       >
//         {/* ==================== TOP FIELDS ==================== */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Sample Sale Order No</label>
//             <input
//               type="text"
//               name="sampleSaleOrderNo"
//               placeholder="Enter Sample Sale Order No"
//               value={formData.sampleSaleOrderNo}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">No. of Sample SKU</label>
//             <input
//               type="text"
//               name="noOfSampleSKU"
//               value={formData.noOfSampleSKU}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">General Remarks</label>
//             <input
//               type="text"
//               name="remarksTop"
//               value={formData.remarksTop}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//             />
//           </div>
//         </div>

//         {/* ==================== SAMPLE REQUIREMENTS TABLE (Now includes Any Other) ==================== */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-lg font-semibold text-gray-900">Sample Requirements</h2>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[900px] divide-y divide-gray-200 text-sm">
//               <thead className="bg-[#001f3f] text-white sticky top-0">
//                 <tr>
//                   <th className="px-6 py-4 text-left font-medium w-48">REQUIREMENT</th>
//                   <th className="px-6 py-4 text-center font-medium w-28">ENABLE/DISABLE</th>
//                   <th className="px-4 py-4 text-left font-medium w-34">DATE</th>
//                   <th className="px-6 py-4 text-left font-medium">REMARK</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200 bg-white">
//                 {requirementList.map(({ key, label }) => {
//                   const isEnabled = requirements[key].enabled;
//                   return (
//                     <tr key={key} className="hover:bg-gray-50 transition-colors">
//                       <td className="px-6 py-5 font-medium text-gray-800">{label}</td>

//                       {/* Toggle */}
//                       <td className="px-6 py-5 text-center">
//                         <label className="inline-flex items-center cursor-pointer">
//                           <input
//                             type="checkbox"
//                             checked={isEnabled}
//                             onChange={(e) => handleRequirementChange(key, "enabled", e.target.checked)}
//                             className="sr-only peer"
//                           />
//                           <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#003366] transition-all duration-300">
//                             <div
//                               className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
//                                 isEnabled ? "translate-x-5" : ""
//                               }`}
//                             />
//                           </div>
//                         </label>
//                       </td>

//                       {/* Date */}
//                       <td className="px-4 py-5">
//                         <div className="relative">
//                           <input
//                             type="date"
//                             value={requirements[key].date}
//                             onChange={(e) => handleRequirementChange(key, "date", e.target.value)}
//                             disabled={!isEnabled}
//                             className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
//                               isEnabled
//                                 ? "border-gray-300 bg-white"
//                                 : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
//                             }`}
//                           />
//                           <Calendar
//                             className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${
//                               !isEnabled && "opacity-30"
//                             }`}
//                             size={10}
//                           />
//                         </div>
//                       </td>

//                       {/* Remark */}
//                       <td className="px-6 py-5">
//                         <input
//                           type="text"
//                           value={requirements[key].remark}
//                           onChange={(e) => handleRequirementChange(key, "remark", e.target.value)}
//                           disabled={!isEnabled}
//                           placeholder={isEnabled ? "Enter remark..." : "Enable toggle first"}
//                           className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
//                             isEnabled
//                               ? "border-gray-300 bg-white"
//                               : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
//                           }`}
//                         />
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* ==================== MATERIAL / SALES ORDER TABLE ==================== */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <div className="max-h-[200px] overflow-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-[#001f3f] text-white sticky top-0 z-20">
//                 <tr>
//                   {materialColumns.map((col) => (
//                     <th
//                       key={col.key}
//                       className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
//                     >
//                       {col.header}
//                     </th>
//                   ))}
//                   <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider sticky right-0 bg-[#001f3f] z-30">
//                     Action
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {materialRows.map((row) => (
//                   <tr key={row.id} className="hover:bg-gray-50">
//                     {materialColumns.map((col) => (
//                       <td key={col.key} className="px-4 py-4">
//                         <input
//                           type={col.inputType}
//                           value={row[col.key] || ""}
//                           onChange={(e) => updateMaterialRow(row.id, col.key, e.target.value)}
//                           className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
//                         />
//                       </td>
//                     ))}
//                     <td className="px-6 py-4 text-center sticky right-0 bg-white z-10">
//                       <div className="flex justify-center gap-4">
//                         <button
//                           type="button"
//                           onClick={() => removeMaterialRow(row.id)}
//                           className="text-red-600 hover:text-red-700"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={addNewMaterialRow}
//                           className="text-blue-600 hover:text-blue-700"
//                         >
//                           <Plus size={18} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Submit Button */}
//         <div className="flex justify-center pt-4">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-12 py-4 text-white font-semibold rounded-xl shadow-sm flex items-center gap-3 text-base transition-all ${
//               loading
//                 ? "bg-gray-400 cursor-not-allowed"
//                 : "bg-[#003366] hover:bg-blue-900 active:scale-95"
//             }`}
//           >
//             {loading ? (
//               <>
//                 <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                 Submitting...
//               </>
//             ) : (
//               "Submit PP Sample"
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default PPSampleMarketing;
