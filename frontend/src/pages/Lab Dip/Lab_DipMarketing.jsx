// src/pages/Lab Dip/Lab_DipMarketing.jsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axiosInstance";

const CATEGORIES = [
  { key: "SOLID_TOWEL", label: "Heb Solid Towel" },
  { key: "YD_JQ_TOWEL", label: "Heb YD JQ Towel" },
  { key: "TERRY_TT", label: "Anjar TT" },
  { key: "RUGS", label: "Rugs" },
];

const FIXED_TABLE_COLUMNS = [
  { key: "shade_name", header: "Shade Name" },
  { key: "shade_details", header: "Shade Details" },
  { key: "archroma_name", header: "Archroma Name" },
  { key: "pantone_reference", header: "Pantone Nos/ Reference" },
  { key: "remark", header: "Remark For Shade Std" },
];

function LabDipMarketing() {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("SOLID_TOWEL");
  const [formData, setFormData] = useState({});
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==================== DYNAMIC CONFIG (keyed by backend values) ====================
  const categoryConfig = {
    SOLID_TOWEL: {
      topFields: [
        { key: "no_of_shade", label: "NO. OF SHADE", type: "text", },
        { key: "customer_name", label: "Customer Name", type: "text", },
        { key: "enquiry", label: "Enquiry", type: "text", },
        { key: "design_name", label: "Design Name", type: "text", },
        { key: "type", label: "Type", type: "select", options: ["Piece Dyed", "Yarn / Piece Dyed"] },
        { key: "greige_mat_code", label: "Greige Mat Code", type: "text",},
        { key: "towel_type", label: "Type Of Towel", type: "select", options: ["Select Towel Type"] },
        { key: "yarn_type", label: "Type Of Yarn", type: "select", options: ["Select Yarn"] },
        { key: "border_type", label: "Border Type", type: "text",},
        { key: "mix_match", label: "Mix & Match (Yarn Dyed Vs PC Dyed)", type: "checkbox" },
        { key: "light_source", label: "Light Source", type: "select", options: ["Select Light Source"] },
        { key: "party_protocol_attached", label: "Party Protocol Attached", type: "checkbox" },
        { key: "shade_match_with", label: "Shade To Be Match With", type: "text",  },
        { key: "approval", label: "Approval", type: "select", options: ["Approval"] },
        { key: "special_features", label: "Special Features", type: "select", options: ["Select Features"] },
      ],
    },
    YD_JQ_TOWEL: {
      topFields: [
        { key: "no_of_shade", label: "NO. OF SHADE", type: "text",  },
        { key: "customer_name", label: "Customer Name", type: "text",  },
        { key: "enquiry", label: "Enquiry", type: "text",  },
        { key: "design_name", label: "Design Name", type: "text",  },
        { key: "type", label: "Type", type: "select", options: ["Piece Dyed", "Yarn / Piece Dyed"] },
        { key: "greige_mat_code", label: "Greige Mat Code", type: "text",  },
        { key: "towel_type", label: "Type Of Towel", type: "select", options: ["Select Towel Type"] },
        { key: "yarn_type", label: "Type Of Yarn", type: "select", options: ["Select Yarn"] },
        { key: "border_type", label: "Border Type", type: "text", },
        { key: "mix_match", label: "Mix & Match (Yarn Dyed Vs PC Dyed)", type: "checkbox" },
        { key: "light_source", label: "Light Source", type: "select", options: ["Select Light Source"] },
        { key: "party_protocol_attached", label: "Party Protocol Attached", type: "checkbox" },
        { key: "shade_match_with", label: "Shade To Be Match With", type: "text",  },
        { key: "approval", label: "Approval", type: "select", options: ["Approval"] },
        { key: "special_features", label: "Special Features", type: "select", options: ["Select Features"] },
      ],
    },
    TERRY_TT: {
      topFields: [
        { key: "no_of_shade", label: "NO. OF SHADE", type: "text", },
        { key: "customer_name", label: "Customer Name", type: "text",},
        { key: "design_name", label: "Design Name / Substrate To Be Used in Lab Dip development", type: "text",},
        { key: "contact_person", label: "Contact Person HO / Plant", type: "text",},
        { key: "type", label: "Type", type: "select", options: ["Piece Dyed", "Yarn / Piece Dyed"] },
        { key: "mix_match", label: "Mix & Match (Yarn Dyed Vs PC Dyed)", type: "checkbox" },
        { key: "towel_type", label: "Type Of Towel", type: "select", options: ["Select Towel Type"] },
        { key: "yarn_type", label: "Type Of Yarn", type: "select", options: ["Select Yarn"] },
        { key: "washing_type", label: "Type Of Washing", type: "select", options: ["Select Washing Type"] },
        { key: "special_instructions", label: "Special Instructions", type: "textarea",},
        { key: "light_source", label: "Light Source Specified", type: "select", options: ["Select"] },
        { key: "party_protocol_attached", label: "Party Protocol Attached", type: "checkbox" },
        { key: "shade_match_with", label: "Shade To Be Match With", type: "select", options: ["Select Features"] },
        { key: "lab_dip_status", label: "Lab Dip Status", type: "text", },
        { key: "lab_dip_format", label: "Lab Dip Format", type: "text", },
      ],
    },
    RUGS: {
      topFields: [
        { key: "customer_name", label: "Customer Name", type: "text", },
        { key: "no_of_shade", label: "NO. OF SHADE", type: "text",  },
        { key: "programme_name", label: "Name Of Programme", type: "text",  },
        { key: "standard_type", label: "Type Of Standard", type: "select", options: ["Select Standard Type"] },
        { key: "piece_dyeing", label: "Piece Dyeing", type: "select", options: ["Select Towel Type"] },
        { key: "yarn_dyeing", label: "Yarn Dyeing", type: "select", options: ["Select Yarn Dyeing"] },
        { key: "material_description", label: "Material Description", type: "text",  },
        { key: "product_route_quality", label: "Product Route For Yarn Dyed Quality", type: "select", options: ["Non Wash", "Wash"] },
        { key: "light_source", label: "Light Source", type: "select", options: ["Select"] },
        { key: "party_protocol_attached", label: "Party Protocol Attached", type: "checkbox" },
        { key: "coordinate_with_towel", label: "Whether Program Coordinate With Towel", type: "checkbox" },
      ],
    },
  };

  // ==================== INIT ON CATEGORY CHANGE (with example placeholders) ====================
  useEffect(() => {
    const config = categoryConfig[selectedCategoryKey];

    const initialForm = {};
    config.topFields.forEach((field) => {
      initialForm[field.key] = field.type === "checkbox" ? false : (field.placeholder || "");
    });
    setFormData(initialForm);

    // Fixed table - one empty row
    const initialRow = { id: 1 };
    FIXED_TABLE_COLUMNS.forEach((col) => {
      initialRow[col.key] = "";
    });
    setTableRows([initialRow]);
  }, [selectedCategoryKey]);

  // ==================== HANDLERS ====================
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addNewRow = () => {
    const newId = tableRows.length ? Math.max(...tableRows.map((r) => r.id)) + 1 : 1;
    const emptyRow = { id: newId };
    FIXED_TABLE_COLUMNS.forEach((col) => (emptyRow[col.key] = ""));
    setTableRows([...tableRows, emptyRow]);
  };

  const removeRow = (id) => {
    if (tableRows.length === 1) return toast.warn("At least one row is required");
    setTableRows(tableRows.filter((row) => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setTableRows(
      tableRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  // ==================== SUBMIT - EXACT BACKEND PAYLOAD + CLEAR FORM AFTER SUCCESS ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name?.trim()) {
      return toast.error("Customer Name is required");
    }

    const payload = {
      category: selectedCategoryKey,
      no_of_shade: formData.no_of_shade || "",
      customer_name: formData.customer_name || "",
      enquiry: formData.enquiry || "",
      design_name: formData.design_name || "",
      greige_mat_code: formData.greige_mat_code || "",
      towel_type: formData.towel_type || "",
      yarn_type: formData.yarn_type || "",
      border_type: formData.border_type || "",
      mix_match: !!formData.mix_match,
      light_source: formData.light_source || "",
      party_protocol_attached: !!formData.party_protocol_attached,
      shade_match_with: formData.shade_match_with || "",
      approval: formData.approval || "",
      special_features: formData.special_features || "",

      shades: tableRows.map(({ id, ...rest }) => ({
        shade_name: rest.shade_name || "",
        shade_details: rest.shade_details || "",
        archroma_name: rest.archroma_name || "",
        pantone_reference: rest.pantone_reference || "",
        remark: rest.remark || "",
      })),
    };

    // Nested objects exactly as per backend
    if (selectedCategoryKey === "RUGS") {
      payload.rugs_details = {
        programme_name: formData.programme_name || "",
        standard_type: formData.standard_type || "",
        material_description: formData.material_description || "",
        piece_dyeing: formData.piece_dyeing || "",
        yarn_dyeing: formData.yarn_dyeing || "",
        product_route_quality: formData.product_route_quality || "",
        coordinate_with_towel: !!formData.coordinate_with_towel,
      };
    } else {
      payload.terry_details = {
        contact_person: formData.contact_person || "",
        washing_type: formData.washing_type || "",
        special_instructions: formData.special_instructions || "",
        lab_dip_status: formData.lab_dip_status || "",
        lab_dip_format: formData.lab_dip_format || "",
      };
    }

    setLoading(true);
    try {
      const response = await api.post("/api/labdip/submit-labdip/", payload);
      toast.success("Lab Dip submitted successfully!");
      console.log("Server response:", response.data);

      // ==================== CLEAR FORM COMPLETELY AFTER SUCCESS ====================
      const config = categoryConfig[selectedCategoryKey];
      const clearedForm = {};
      config.topFields.forEach((field) => {
        clearedForm[field.key] = field.type === "checkbox" ? false : "";
      });
      setFormData(clearedForm);

      const initialRow = { id: 1 };
      FIXED_TABLE_COLUMNS.forEach((col) => (initialRow[col.key] = ""));
      setTableRows([initialRow]);
    } catch (error) {
      console.error("Submission failed:", error);
      let errorMessage = "Failed to submit Lab Dip. Please try again.";
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = categoryConfig[selectedCategoryKey];

  return (
    // ==================== SCROLL FIX: Wrapper to override global overflow: hidden ====================
    // This ensures the component's natural scroll behavior is restored without affecting the global layout.
    // Uses full viewport height and auto overflow to enable page-level scrolling.
    <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="p-4 md:p-6 lg:p-8 mx-auto max-w-8xl min-h-full">
        {/* Header with Category Dropdown */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lab Dip</h1>
          </div>

          <div className="relative w-64">
            <select
              value={selectedCategoryKey}
              onChange={(e) => setSelectedCategoryKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium appearance-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              ▼
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Dynamic Top Fields */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentConfig.topFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === "checkbox" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        name={field.key}
                        checked={!!formData[field.key]}
                        onChange={handleFormChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </div>
                  ) : field.type === "select" ? (
                    <select
                      name={field.key}
                      value={formData[field.key] || ""}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {field.options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      name={field.key}
                      value={formData[field.key] || ""}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type="text"
                      name={field.key}
                      value={formData[field.key] || ""}
                      onChange={handleFormChange}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FIXED Shade Table (same for all categories) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="max-h-[200px] overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#001f3f] text-white sticky top-0 z-20">
                  <tr>
                    {FIXED_TABLE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                      >
                        {col.header}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider sticky right-0 bg-[#001f3f] z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {FIXED_TABLE_COLUMNS.map((col) => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={row[col.key] || ""}
                            onChange={(e) => updateRow(row.id, col.key, e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          />
                        </td>
                      ))}
                      <td className="px-6 py-3 whitespace-nowrap text-center sticky right-0 bg-white z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
              <button
                type="button"
                onClick={addNewRow}
                className="flex items-center gap-2 px-6 py-2 bg-[#001f3f] text-white text-sm font-medium rounded-lg hover:bg-blue-950 transition"
              >
                <Plus size={18} />
                Add
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`px-10 py-3 text-white font-medium rounded-md transition shadow-sm flex items-center gap-2 min-w-[160px] justify-center
                ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#003366] hover:bg-blue-900"}`}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LabDipMarketing;