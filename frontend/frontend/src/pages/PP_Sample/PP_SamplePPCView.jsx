// src/pages/PP_Sample/PP_SamplePPCView.jsx
import React, { useState, useEffect } from "react";
import { Calendar, ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";

import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";

// ─── Requirement Card (no animation to prevent invisibility on refresh) ────────
function RequirementCard({
    cfg,
    data,
    apiKey,
    localActualDate,
    onActualDateChange,
    localRemark,
    onRemarkChange,
    isSubmitting,
}) {
    const isDone = !!localActualDate || !!data?.actual_date;
    const hasRequirement = !!data || !!localActualDate || !!localRemark;

    return (
        <div
            className="rounded-2xl overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
                borderColor: `${cfg.hue}40`,
                background: "#ffffff",
            }}
        >
            {/* Header */}
            <div
                className="px-5 py-4 flex items-center justify-between font-medium text-sm uppercase tracking-wide"
                style={{
                    background: `linear-gradient(135deg, ${cfg.light} 0%, ${cfg.hue}15 100%)`,
                    color: cfg.dark,
                    borderBottom: `1px solid ${cfg.hue}30`,
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${cfg.hue}25` }}
                    >
                        <FileText size={16} style={{ color: cfg.hue }} />
                    </div>
                    <span>{cfg.label}</span>
                </div>

                {isDone && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                        <CheckCircle2 size={14} />
                        Completed
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-6">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Estimated Date
                    </p>
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: `${cfg.light}`, color: cfg.dark }}
                    >
                        <Calendar size={16} style={{ color: cfg.hue }} />
                        {data?.estimated_date || "—"}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Actual Date
                    </p>
                    <input
                        type="date"
                        value={localActualDate}
                        onChange={(e) => onActualDateChange(apiKey, e.target.value)}
                        disabled={isSubmitting || !hasRequirement}
                        className={`w-full px-4 py-3 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${hasRequirement
                                ? "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                            }`}
                    />
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Remarks
                    </p>
                    <textarea
                        value={localRemark}
                        onChange={(e) => onRemarkChange(apiKey, e.target.value)}
                        disabled={isSubmitting || !hasRequirement}
                        placeholder={hasRequirement ? "Enter remarks / observations..." : "Not applicable"}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-xl text-sm resize-y min-h-[90px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${hasRequirement
                                ? "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                            }`}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PPSamplePPCView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const ppSampleId = id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [localDates, setLocalDates] = useState({});
    const [localRemarks, setLocalRemarks] = useState({});
    const [requirements, setRequirements] = useState([]);   // ← Dynamic requirements

    const FIELD_MAPPING = {
        pp_requirement: { date: "ppc_actual_requirement_date", remark: "pp_remarks" },
        top_requirement: { date: "top_actual_requirement_date", remark: "top_remarks" },
        testing_requirement: { date: "testing_actual_requirement_date", remark: "testing_remarks" },
        adv_photoshoot_requirement: { date: "adv_photoshoot_actual_requirement_date", remark: "adv_photoshoot_remarks" },
        anyother_requirement: { date: "anyother_actual_requirement_date", remark: "anyother_remarks" },
    };

    const getRequirementConfig = (key) => {
        const configs = {
            pp_requirement: {
                label: "PP Requirement",
                hue: "#1a56db",
                light: "#eff6ff",
                dark: "#1e40af",
            },
            top_requirement: {
                label: "TOP Requirement",
                hue: "#7c3aed",
                light: "#f5f3ff",
                dark: "#5b21b6",
            },
            testing_requirement: {
                label: "Testing",
                hue: "#d97706",
                light: "#fffbeb",
                dark: "#92400e",
            },
            adv_photoshoot_requirement: {
                label: "Adv. Photoshoot",
                hue: "#059669",
                light: "#ecfdf5",
                dark: "#065f46",
            },
            anyother_requirement: {
                label: "Any Other",
                hue: "#dc2626",
                light: "#fef2f2",
                dark: "#991b1b",
            },
        };
        return configs[key];
    };

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
        ].includes(key) ? "number" : "text",
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

    useEffect(() => {
        const fetchSample = async () => {
            if (!ppSampleId) {
                setError("No sample ID provided");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await api.post("/api/pp-sample/details/", {
                    pp_sample_id: Number(ppSampleId),
                });

                if (!res.data?.pp_sample_id) throw new Error("Invalid response");

                setData(res.data);

                // ─── Build Dynamic Requirements from API Response ─────────────────
                const possibleKeys = [
                    "pp_requirement",
                    "top_requirement",
                    "testing_requirement",
                    "adv_photoshoot_requirement",
                    "anyother_requirement",
                ];

                const dynamicRequirements = [];

                possibleKeys.forEach((key) => {
                    const reqData = res.data[key];
                    if (reqData && Object.keys(reqData).length > 0) {
                        const config = getRequirementConfig(key);
                        if (config) {
                            dynamicRequirements.push({
                                ...config,
                                apiKey: key,
                                data: reqData,
                            });
                        }
                    }
                });

                setRequirements(dynamicRequirements);

                // Initialize local state for dates and remarks
                const dates = {};
                const remarks = {};

                dynamicRequirements.forEach(({ apiKey }) => {
                    const req = res.data[apiKey] || {};
                    let actualDate = req.actual_date || "";

                    // Convert DD-MM-YYYY → YYYY-MM-DD for input type="date"
                    if (actualDate && actualDate.includes("-")) {
                        const parts = actualDate.split("-");
                        if (parts.length === 3) {
                            if (parts[0].length === 2 && parts[2].length === 4) {
                                // DD-MM-YYYY
                                const [dd, mm, yyyy] = parts;
                                actualDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
                            }
                        }
                    }

                    dates[apiKey] = actualDate;
                    remarks[apiKey] = req.remarks || "";
                });

                setLocalDates(dates);
                setLocalRemarks(remarks);
            } catch (err) {
                const msg = err.response?.data?.detail || err.message || "Failed to load";
                toast.error(msg);
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchSample();
    }, [ppSampleId]);

    const handleDateChange = (key, value) => {
        setLocalDates((prev) => ({ ...prev, [key]: value }));
    };

    const handleRemarkChange = (key, value) => {
        setLocalRemarks((prev) => ({ ...prev, [key]: value }));
    };

    const normalizeDateForBackend = (dateStr) => {
        if (!dateStr || dateStr.trim() === "") return null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }

        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
            const [dd, mm, yyyy] = dateStr.split("-");
            return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
        }

        console.warn(`Invalid date format detected: "${dateStr}" – sending null`);
        return null;
    };

    const handleSave = async () => {
        setSubmitting(true);

        const payload = {
            pp_sample_id: Number(ppSampleId),
            btn: "submit",
        };

        // Only process requirements that are actually rendered
        requirements.forEach(({ apiKey }) => {
            const mapping = FIELD_MAPPING[apiKey];
            if (!mapping) return;

            const rawDate = localDates[apiKey];
            const safeDate = normalizeDateForBackend(rawDate);

            payload[mapping.date] = safeDate;
            payload[mapping.remark] = localRemarks[apiKey]?.trim() || "";
        });

        console.log("Saving payload:", JSON.stringify(payload, null, 2));

        try {
            const response = await api.post("/api/pp-sample/update-requirement-date/", payload);
            toast.success("Requirements updated successfully");

            // Refresh data
            const res = await api.post("/api/pp-sample/details/", {
                pp_sample_id: Number(ppSampleId),
            });
            setData(res.data);

            // Re-build dynamic requirements and local state
            const possibleKeys = [
                "pp_requirement", "top_requirement", "testing_requirement",
                "adv_photoshoot_requirement", "anyother_requirement"
            ];

            const dynamicRequirements = [];
            possibleKeys.forEach((key) => {
                const reqData = res.data[key];
                if (reqData && Object.keys(reqData).length > 0) {
                    const config = getRequirementConfig(key);
                    if (config) {
                        dynamicRequirements.push({
                            ...config,
                            apiKey: key,
                            data: reqData,
                        });
                    }
                }
            });

            setRequirements(dynamicRequirements);

            const dates = {};
            const remarks = {};

            dynamicRequirements.forEach(({ apiKey }) => {
                const req = res.data[apiKey] || {};
                let actualDate = req.actual_date || "";

                if (actualDate && /^\d{2}-\d{2}-\d{4}$/.test(actualDate)) {
                    const [dd, mm, yyyy] = actualDate.split("-");
                    actualDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
                }

                dates[apiKey] = actualDate;
                remarks[apiKey] = req.remarks || "";
            });

            setLocalDates(dates);
            setLocalRemarks(remarks);
        } catch (err) {
            console.error("Save failed:", err);
            toast.error(err.response?.data?.detail || err.message || "Update failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-10 text-center text-red-600">
                {error || "Sample not found"}
                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 block mx-auto px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                >
                    ← Back
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto relative min-h-screen">

            <div
                className="overflow-y-auto overscroll-contain pb-16"
                style={{
                    height: 'calc(100dvh - 32px)',
                    WebkitOverflowScrolling: 'touch',
                    margin: '0 -1.5rem',
                    padding: '0 1.5rem 4rem 1.5rem',
                }}
            >

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Update Sample Requirements
                        </h1>
                        <p className="text-gray-600 mt-1">
                            <strong>{data.sample_sale_order_no || "—"}</strong> • Status: {data.status || "—"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                        <ArrowLeft size={16} /> Back to List
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sample Sale Order No</p>
                        <p className="text-2xl font-bold text-gray-900">{data.sample_sale_order_no || "—"}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">No. of Sample SKU</p>
                        <p className="text-2xl font-bold text-gray-900">{data.no_of_samples ?? "—"}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">General Remarks</p>
                        <p className="text-gray-800">{data.remarks || "—"}</p>
                    </div>
                </div>

                {/* Customer info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Existing Customer</p>
                        <p className="font-medium text-lg">{data.existing_customer ? "Yes" : "No"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Customer Name</p>
                        <p className="text-lg">{data.customer_name || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Brand Name</p>
                        <p className="text-lg">{data.brand_name || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sale Order Number</p>
                        <p className="text-lg">{data.sale_order_number || "—"}</p>
                    </div>
                </div>

                {/* Dynamic Sample Requirements */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden mb-8">
                    <div className="px-6 py-5 border-b border-gray-200 shrink-0">
                        <h2 className="text-xl font-semibold text-gray-900">Sample Requirements</h2>
                    </div>
                    <div className="p-6">
                        {requirements.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No requirements found for this sample.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {requirements.map((req) => (
                                    <RequirementCard
                                        key={req.apiKey}
                                        cfg={req}
                                        data={req.data}
                                        apiKey={req.apiKey}
                                        localActualDate={localDates[req.apiKey] || ""}
                                        onActualDateChange={handleDateChange}
                                        localRemark={localRemarks[req.apiKey] || ""}
                                        onRemarkChange={handleRemarkChange}
                                        isSubmitting={submitting}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Material / Sales Order Table */}
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

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-4 pb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-10 py-3.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors shadow-sm min-w-[140px]"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className={`px-12 py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-3 shadow-md transition-all min-w-[200px] ${submitting
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800"
                            }`}
                    >
                        {submitting ? (
                            <>
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save All Updates"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}