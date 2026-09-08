// src/pages/PP_Sample/PP_SamplePPC.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, Check, Loader2, Calendar, FileText,
  AlertCircle, Search, RefreshCw, Package, Clock,
  CheckCircle2, TrendingUp, X, Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';

const GLOBAL_STYLES = `
  @keyframes expandIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pps-expand-anim { animation: expandIn 0.25s cubic-bezier(.22,.68,0,1.2) forwards; }

  .pps-chevron { transition: transform 0.22s ease; display:inline-block; }
  .pps-chevron.open { transform: rotate(90deg); }

  .pps-row { transition: background 0.12s ease; }
  .pps-row:hover td { background: #f0f5ff !important; }
  .pps-row.expanded td { background: #e8f0fe !important; }
  .pps-row.expanded td:first-child { box-shadow: inset 3px 0 0 #1a56db; }

  .pps-req-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
  .pps-req-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.10); transform: translateY(-2px); }

  .pps-date-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .pps-date-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(26,86,219,0.15); border-color: #1a56db !important; }
  .pps-date-input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }

  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position: 200% 0; }
  }
  .pps-shimmer {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pps-fade { animation: fadeUp 0.35s ease forwards; opacity: 0; }
  .pps-fade-d1 { animation-delay: 0.05s; }
  .pps-fade-d2 { animation-delay: 0.12s; }
  .pps-fade-d3 { animation-delay: 0.20s; }
  .pps-fade-d4 { animation-delay: 0.28s; }

  @keyframes cardIn {
    from { opacity: 0; transform: scale(0.97) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .pps-card-in { animation: cardIn 0.25s ease forwards; opacity: 0; }

  .pps-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .pps-scroll::-webkit-scrollbar-track { background: #f8fafc; }
  .pps-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .pps-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
`;

/* ─── Config ─────────────────────────────────────────────────────────────────── */
const REQUIREMENT_TYPES = {
  pp_requirement: { label: 'PP Requirement', hue: '#1a56db', light: '#eff6ff', dark: '#1e40af' },
  top_requirement: { label: 'TOP Requirement', hue: '#7c3aed', light: '#f5f3ff', dark: '#5b21b6' },
  testing_requirement: { label: 'Testing', hue: '#d97706', light: '#fffbeb', dark: '#92400e' },
  adv_photoshoot_requirement: { label: 'Adv. Photoshoot', hue: '#059669', light: '#ecfdf5', dark: '#065f46' },
  anyother_requirement: { label: 'Any Other', hue: '#dc2626', light: '#fef2f2', dark: '#991b1b' },
};

const FIELD_MAPPING = {
  pp_requirement: { date: 'ppc_actual_requirement_date', remark: 'pp_remarks' },
  top_requirement: { date: 'top_actual_requirement_date', remark: 'top_remarks' },
  testing_requirement: { date: 'testing_actual_requirement_date', remark: 'testing_remarks' },
  adv_photoshoot_requirement: { date: 'adv_photoshoot_actual_requirement_date', remark: 'adv_photoshoot_remarks' },
  anyother_requirement: { date: 'anyother_actual_requirement_date', remark: 'anyother_remarks' },
};

const STATUS_CFG = {
  submitted: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  pending: { bg: '#fefce8', color: '#854d0e', dot: '#eab308' },
  completed: { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
  'requirement updated': { bg: '#faf5ff', color: '#6b21a8', dot: '#a855f7' },
  'date updated': { bg: '#f0fdfa', color: '#134e4a', dot: '#14b8a6' },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */
const parseDMY = (s) => { if (!s) return ''; const p = s.split('-'); return (p.length === 3 && p[2].length === 4) ? `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}` : s; };
const displayDMY = (s) => { if (!s) return '—'; const [y, m, d] = s.split('-'); return `${d}-${m}-${y}`; };

/* ─── RequirementCard ────────────────────────────────────────────────────────── */
function RequirementCard({
  cfg,
  data,
  requirementKey,
  localActualDate,
  onActualDateChange,
  localRemark,
  onRemarkChange,
  isSubmitting,
  animDelay,
}) {
  const done = !!data?.actual_date;

  return (
    <div
      className="pps-req-card pps-card-in rounded-2xl overflow-hidden"
      style={{
        animationDelay: `${animDelay}ms`,
        border: `1px solid ${cfg.hue}22`,
        background: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${cfg.light}, ${cfg.hue}08)`,
          borderBottom: `1px solid ${cfg.hue}18`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: cfg.hue + '18' }}>
              <FileText size={12} style={{ color: cfg.hue }} />
            </div>
            <span className="pps-heading text-[10.5px] font-bold uppercase tracking-wider" style={{ color: cfg.dark }}>
              {cfg.label}
            </span>
          </div>
          {done && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check size={9} /> Done
            </span>
          )}
        </div>
        {requirementKey === 'anyother_requirement' && data?.requirement && (
          <p className="text-[11px] text-slate-500 mt-1.5 truncate italic">"{data.requirement}"</p>
        )}
      </div>

      <div className="px-4 py-3.5 space-y-3.5">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Estimated Date</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: cfg.light }}>
            <Calendar size={11} style={{ color: cfg.hue }} />
            <span className="pps-mono text-xs font-semibold" style={{ color: cfg.dark }}>
              {data?.estimated_date ? displayDMY(parseDMY(data.estimated_date)) : '—'}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Actual Date</p>
          {done ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 size={11} className="text-emerald-600" />
              <span className="pps-mono text-xs font-semibold text-emerald-700">
                {displayDMY(parseDMY(data.actual_date))}
              </span>
            </div>
          ) : (
            <input
              type="date"
              value={localActualDate}
              onChange={(e) => onActualDateChange(requirementKey, e.target.value)}
              disabled={isSubmitting}
              className="pps-date-input pps-mono w-full border rounded-xl px-3 py-2 text-xs text-slate-700 bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
              style={{ borderColor: localActualDate ? cfg.hue + '55' : '#e2e8f0' }}
            />
          )}
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Remarks</p>
          <textarea
            value={localRemark}
            onChange={(e) => onRemarkChange(requirementKey, e.target.value)}
            disabled={isSubmitting}
            placeholder="Optional notes..."
            rows={2}
            className="pps-date-input w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 bg-white resize-y min-h-[52px] focus:border-[#1a56db]"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── ProgressDots ───────────────────────────────────────────────────────────── */
function ProgressDots({ detail }) {
  const activeKeys = detail
    ? Object.keys(detail).filter((k) => REQUIREMENT_TYPES.hasOwnProperty(k))
    : Object.keys(REQUIREMENT_TYPES);

  if (!activeKeys.length) {
    return <div className="flex gap-1">{Array(5).fill().map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />)}</div>;
  }

  const completedCount = detail
    ? activeKeys.filter((k) => !!detail[k]?.actual_date).length
    : 0;

  return (
    <div className="flex gap-1" title={`${completedCount}/${activeKeys.length} done`}>
      {activeKeys.map((key) => {
        const cfg = REQUIREMENT_TYPES[key];
        const isDone = !!detail?.[key]?.actual_date;
        return (
          <div
            key={key}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ background: isDone ? cfg.hue : '#e2e8f0' }}
          />
        );
      })}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function PPSamplePPC() {
  const navigate = useNavigate();

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [localActualDates, setLocalActualDates] = useState({});
  const [localRemarks, setLocalRemarks] = useState({});
  const [panelSubmitting, setPanelSubmitting] = useState(false);

  const styleInjected = useRef(false);
  const tableScrollRef = useRef(null);

  useEffect(() => {
    if (styleInjected.current) return;
    const el = document.createElement('style');
    el.textContent = GLOBAL_STYLES;
    document.head.appendChild(el);
    styleInjected.current = true;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/api/pp-sample/list/');
        setSamples((res.data || []).map((item, i) => ({
          id: item.pp_sample_id ?? i + 1,
          sampleSaleOrderNo: item.sample_sale_order_no || '—',
          existingCustomer: item.existing_customer ? 'Yes' : 'No',
          customerName: item.customer_name || '—',
          brandName: item.brand_name || '—',
          saleOrderNo: item.sale_order_number || item.sample_sale_order_no || '—',
          noOfSampleSKU: item.no_of_samples?.toString() || '0',
          remarks: item.remarks || '',
          status: item.status || 'Pending',
          createdOn: item.created_on || '—',
        })));
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Failed to load';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!expandedId || !detailsMap[expandedId]) {
      setLocalActualDates({});
      setLocalRemarks({});
      return;
    }

    const detail = detailsMap[expandedId];
    const activeKeys = Object.keys(detail).filter((k) => REQUIREMENT_TYPES.hasOwnProperty(k));

    const initDates = {};
    const initRemarks = {};

    activeKeys.forEach((key) => {
      const reqData = detail[key] || {};
      if (!reqData.actual_date) {
        initDates[key] = '';
      }
      initRemarks[key] = reqData.remarks || '';
    });

    setLocalActualDates(initDates);
    setLocalRemarks(initRemarks);
  }, [expandedId, detailsMap]);

  const handleRowClick = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    setTimeout(() => {
      const row = document.getElementById(`pp-row-${id}`);
      if (row && tableScrollRef.current) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);

    if (detailsMap[id]) return;

    setLoadingDetail(id);

    try {
      const res = await api.post('/api/pp-sample/details/', { pp_sample_id: id });
      setDetailsMap((p) => ({ ...p, [id]: res.data }));
    } catch {
      toast.error('Could not load details');
      setExpandedId(null);
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleActualDateChange = (reqKey, value) => {
    setLocalActualDates((prev) => ({ ...prev, [reqKey]: value }));
  };

  const handleRemarkChange = (reqKey, value) => {
    setLocalRemarks((prev) => ({ ...prev, [reqKey]: value }));
  };

  const handleSubmitAll = async () => {
    if (!expandedId) return;
    const detail = detailsMap[expandedId];
    if (!detail) return;

    const activeReqKeys = Object.keys(detail).filter((k) => REQUIREMENT_TYPES.hasOwnProperty(k));

    const payload = {
      pp_sample_id: expandedId,
      btn: 'submit',
    };

    activeReqKeys.forEach((reqKey) => {
      const mapping = FIELD_MAPPING[reqKey];
      const reqData = detail[reqKey] || {};

      let finalDate = reqData.actual_date ? parseDMY(reqData.actual_date) : null;
      if (localActualDates.hasOwnProperty(reqKey)) {
        finalDate = localActualDates[reqKey] || null;
      }
      payload[mapping.date] = finalDate;

      const finalRemark = localRemarks[reqKey] || reqData.remarks || '';
      payload[mapping.remark] = finalRemark;
    });

    setPanelSubmitting(true);

    try {
      const res = await api.post('/api/pp-sample/update-requirement-date/', payload);
      toast.success(res?.data?.message || 'Requirement Details Updated Successfully');

      const fresh = await api.post('/api/pp-sample/details/', { pp_sample_id: expandedId });
      setDetailsMap((p) => ({ ...p, [expandedId]: fresh.data }));

      setLocalActualDates({});
      setLocalRemarks({});
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Failed to update';
      toast.error(msg);
    } finally {
      setPanelSubmitting(false);
    }
  };

  const filtered = samples.filter((s) =>
    !search ||
    s.customerName.toLowerCase().includes(search.toLowerCase()) ||
    s.sampleSaleOrderNo.toLowerCase().includes(search.toLowerCase()) ||
    s.brandName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="pps-root p-6 max-w-screen-2xl mx-auto space-y-5">
      <div className="pps-shimmer h-9 w-52" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="pps-shimmer h-20" />)}</div>
      <div className="pps-shimmer h-[400px]" />
    </div>
  );

  if (error) return (
    <div className="pps-root min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="pps-heading text-xl font-bold text-slate-800">Failed to load</p>
        <p className="text-sm text-slate-400">{error}</p>
        <button onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-xl text-sm font-semibold hover:bg-[#1e40af] transition-colors shadow-lg shadow-blue-200">
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="pps-root p-4 md:p-6 lg:p-8 max-w-8xl mx-auto space-y-6">
      <div className="pps-fade pps-fade-d1 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sample - Top/Testing Etc (PPC)</h1>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="pps-fade pps-fade-d3">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer, order no, brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1a56db] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="pps-fade pps-fade-d4 rounded-2xl overflow-hidden border border-slate-100 max-h-[80vh]" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div ref={tableScrollRef} className="pps-scroll overflow-auto max-h-[640px]">
          <table className="min-w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: 'linear-gradient(135deg, #0d1f45 0%, #1a3a70 100%)' }}>
                {['', 'Sample Order No', 'Customer', 'Brand', 'Sale Order', 'SKUs', 'Status', 'Created', 'Actions'].map((col, i) => (
                  <th key={i} className="px-5 py-4 text-left whitespace-nowrap select-none"
                    style={{ color: '#ffffff', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody style={{ background: '#ffffff' }}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <Package size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-medium text-sm">
                      {search ? `No results for "${search}"` : 'No Sample - Top/Testing Etc found'}
                    </p>
                    {search && <button onClick={() => setSearch('')} className="text-xs text-[#1a56db] mt-2 hover:underline">Clear search</button>}
                  </td>
                </tr>
              ) : filtered.map((item) => {
                const isExpanded = expandedId === item.id;
                const isLoadingThis = loadingDetail === item.id;
                const detail = detailsMap[item.id];
                const sCfg = STATUS_CFG[item.status?.toLowerCase().trim()] || { bg: '#f8fafc', color: '#64748b', dot: '#94a3b8' };

                const activeReqKeys = detail
                  ? Object.keys(detail).filter((k) => REQUIREMENT_TYPES.hasOwnProperty(k))
                  : [];
                const completedReqs = detail
                  ? activeReqKeys.filter((k) => !!detail[k]?.actual_date).length
                  : 0;

                const hasAnyDateUpdate = Object.values(localActualDates).some((v) => !!v);
                const hasAnyRemarkUpdate = activeReqKeys.some((key) => {
                  const orig = (detail[key] || {}).remarks || '';
                  return localRemarks[key] !== orig;
                });
                const hasUpdates = hasAnyDateUpdate || hasAnyRemarkUpdate;

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      id={`pp-row-${item.id}`}
                      onClick={() => handleRowClick(item.id)}
                      className={`pps-row cursor-pointer select-none ${isExpanded ? 'expanded' : ''}`}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                    >
                      <td className="pl-5 pr-3 py-4 w-10">
                        {isLoadingThis ? (
                          <Loader2 size={14} className="animate-spin text-[#1a56db]" />
                        ) : (
                          <ChevronRight size={14} className={`pps-chevron ${isExpanded ? 'open' : ''} text-slate-400`} />
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="pps-mono text-[13px] font-semibold text-[#1a3a70]">{item.sampleSaleOrderNo}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800 leading-snug text-[13px]">{item.customerName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${item.existingCustomer === 'Yes' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                          {item.existingCustomer === 'Yes' ? 'Existing' : 'New'}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">{item.brandName}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="pps-mono text-[12px] text-slate-500">{item.saleOrderNo}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold" style={{ background: 'rgba(26,86,219,0.08)', color: '#1a56db' }}>
                          {item.noOfSampleSKU}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: sCfg.bg, color: sCfg.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sCfg.dot }} />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="pps-mono text-[11px] text-slate-400">{item.createdOn?.split(" ")[0] || "—"}</span>
                      </td>

                      {/* ── View Button ── */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pp-sample-ppc-view/${item.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
                          title="View and update actual dates & remarks"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>

                    {/* Expanded panel remains the same */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <div className="pps-expand-anim" style={{ borderBottom: '2px solid #dce7ff' }}>
                            <div className="px-7 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-1 h-10 rounded-full" style={{ background: 'linear-gradient(180deg, #1a56db, #7c3aed)' }} />
                                <div>
                                  <p className="pps-heading font-bold text-slate-800 text-[15px]" style={{ fontWeight: 700 }}>
                                    Requirement Details
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {item.customerName}
                                    {item.remarks && <> · <span className="italic text-slate-500">{item.remarks}</span></>}
                                  </p>
                                </div>
                              </div>
                              {detail && (
                                <div
                                  className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
                                  style={{
                                    background: completedReqs === activeReqKeys.length ? '#f0fdf4' : '#fff',
                                    borderColor: completedReqs === activeReqKeys.length ? '#86efac' : '#e2e8f0',
                                    color: completedReqs === activeReqKeys.length ? '#16a34a' : '#64748b',
                                  }}
                                >
                                  <CheckCircle2 size={12} />
                                  {completedReqs}/{activeReqKeys.length} requirements done
                                </div>
                              )}
                            </div>

                            <div className="px-7 pb-7">
                              {isLoadingThis || !detail ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                  {Object.keys(REQUIREMENT_TYPES).map((k) => <div key={k} className="pps-shimmer h-52" />)}
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {activeReqKeys.map((key, i) => {
                                      const cfg = REQUIREMENT_TYPES[key];
                                      return (
                                        <RequirementCard
                                          key={key}
                                          cfg={cfg}
                                          data={detail[key]}
                                          requirementKey={key}
                                          localActualDate={localActualDates[key] || ''}
                                          onActualDateChange={handleActualDateChange}
                                          localRemark={localRemarks[key] || ''}
                                          onRemarkChange={handleRemarkChange}
                                          isSubmitting={panelSubmitting}
                                          animDelay={i * 60}
                                        />
                                      );
                                    })}
                                  </div>

                                  <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
                                    <button
                                      onClick={handleSubmitAll}
                                      disabled={panelSubmitting || !hasUpdates}
                                      className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                      style={{
                                        background: hasUpdates ? 'linear-gradient(135deg, #1a56db, #1e40af)' : '#b7bfca',
                                        boxShadow: hasUpdates ? '0 8px 20px rgba(26,86,219,0.25)' : 'none',
                                      }}
                                    >
                                      {panelSubmitting ? (
                                        <>
                                          <Loader2 size={16} className="animate-spin" />
                                          Saving Changes...
                                        </>
                                      ) : hasUpdates ? (
                                        <>
                                          Save All Changes <Check size={16} />
                                        </>
                                      ) : (
                                        'No changes to save'
                                      )}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <p className="text-xs text-slate-400 pps-mono">
            {filtered.length} of {samples.length} records
            {search && <span className="text-[#1a56db] font-medium"> (filtered)</span>}
          </p>
          {expandedId && (
            <button onClick={() => setExpandedId(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
              <X size={11} /> Collapse all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// // src/pages/PP_Sample/PP_SamplePPC.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   ChevronRight, Check, Loader2, Calendar, FileText,
//   AlertCircle, Search, RefreshCw, Package, Clock,
//   CheckCircle2, TrendingUp, X,
// } from 'lucide-react';
// import { toast } from 'react-toastify';
// import api from '../../api/axiosInstance';

// const GLOBAL_STYLES = `
//   @keyframes expandIn {
//     from { opacity: 0; transform: translateY(-8px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//   .pps-expand-anim { animation: expandIn 0.25s cubic-bezier(.22,.68,0,1.2) forwards; }

//   .pps-chevron { transition: transform 0.22s ease; display:inline-block; }
//   .pps-chevron.open { transform: rotate(90deg); }

//   .pps-row { transition: background 0.12s ease; }
//   .pps-row:hover td { background: #f0f5ff !important; }
//   .pps-row.expanded td { background: #e8f0fe !important; }
//   .pps-row.expanded td:first-child { box-shadow: inset 3px 0 0 #1a56db; }

//   .pps-req-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
//   .pps-req-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.10); transform: translateY(-2px); }

//   .pps-date-input { transition: border-color 0.15s, box-shadow 0.15s; }
//   .pps-date-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(26,86,219,0.15); border-color: #1a56db !important; }
//   .pps-date-input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }

//   @keyframes shimmer {
//     from { background-position: -200% 0; }
//     to   { background-position: 200% 0; }
//   }
//   .pps-shimmer {
//     background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
//     background-size: 200% 100%;
//     animation: shimmer 1.5s infinite;
//     border-radius: 12px;
//   }

//   @keyframes fadeUp {
//     from { opacity: 0; transform: translateY(10px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//   .pps-fade { animation: fadeUp 0.35s ease forwards; opacity: 0; }
//   .pps-fade-d1 { animation-delay: 0.05s; }
//   .pps-fade-d2 { animation-delay: 0.12s; }
//   .pps-fade-d3 { animation-delay: 0.20s; }
//   .pps-fade-d4 { animation-delay: 0.28s; }

//   @keyframes cardIn {
//     from { opacity: 0; transform: scale(0.97) translateY(6px); }
//     to   { opacity: 1; transform: scale(1) translateY(0); }
//   }
//   .pps-card-in { animation: cardIn 0.25s ease forwards; opacity: 0; }

//   .pps-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
//   .pps-scroll::-webkit-scrollbar-track { background: #f8fafc; }
//   .pps-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
//   .pps-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
// `;

// /* ─── Config ─────────────────────────────────────────────────────────────────── */
// const REQUIREMENT_TYPES = {
//   pp_requirement: { label: 'PP Requirement', hue: '#1a56db', light: '#eff6ff', dark: '#1e40af' },
//   top_requirement: { label: 'TOP Requirement', hue: '#7c3aed', light: '#f5f3ff', dark: '#5b21b6' },
//   testing_requirement: { label: 'Testing', hue: '#d97706', light: '#fffbeb', dark: '#92400e' },
//   adv_photoshoot_requirement: { label: 'Adv. Photoshoot', hue: '#059669', light: '#ecfdf5', dark: '#065f46' },
//   anyother_requirement: { label: 'Any Other', hue: '#dc2626', light: '#fef2f2', dark: '#991b1b' },
// };

// const FIELD_MAPPING = {
//   pp_requirement: { date: 'ppc_actual_requirement_date', remark: 'pp_remarks' },
//   top_requirement: { date: 'top_actual_requirement_date', remark: 'top_remarks' },
//   testing_requirement: { date: 'testing_actual_requirement_date', remark: 'testing_remarks' },
//   adv_photoshoot_requirement: { date: 'adv_photoshoot_actual_requirement_date', remark: 'adv_photoshoot_remarks' },
//   anyother_requirement: { date: 'anyother_actual_requirement_date', remark: 'anyother_remarks' },
// };

// const STATUS_CFG = {
//   submitted: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
//   pending: { bg: '#fefce8', color: '#854d0e', dot: '#eab308' },
//   completed: { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
//   'requirement updated': { bg: '#faf5ff', color: '#6b21a8', dot: '#a855f7' },
//   'date updated': { bg: '#f0fdfa', color: '#134e4a', dot: '#14b8a6' },
// };

// /* ─── Helpers ─────────────────────────────────────────────────────────────────── */
// const parseDMY = (s) => { if (!s) return ''; const p = s.split('-'); return (p.length === 3 && p[2].length === 4) ? `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}` : s; };
// const displayDMY = (s) => { if (!s) return '—'; const [y, m, d] = s.split('-'); return `${d}-${m}-${y}`; };

// /* ─── RequirementCard (dynamic + editable remarks + controlled inputs) ───────── */
// function RequirementCard({
//   cfg,
//   data,
//   requirementKey,
//   localActualDate,
//   onActualDateChange,
//   localRemark,
//   onRemarkChange,
//   isSubmitting,
//   animDelay,
// }) {
//   const done = !!data?.actual_date;

//   return (
//     <div
//       className="pps-req-card pps-card-in rounded-2xl overflow-hidden"
//       style={{
//         animationDelay: `${animDelay}ms`,
//         border: `1px solid ${cfg.hue}22`,
//         background: '#fff',
//         boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
//       }}
//     >
//       {/* Header strip */}
//       <div
//         className="px-4 py-3"
//         style={{
//           background: `linear-gradient(135deg, ${cfg.light}, ${cfg.hue}08)`,
//           borderBottom: `1px solid ${cfg.hue}18`,
//         }}
//       >
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: cfg.hue + '18' }}>
//               <FileText size={12} style={{ color: cfg.hue }} />
//             </div>
//             <span className="pps-heading text-[10.5px] font-bold uppercase tracking-wider" style={{ color: cfg.dark }}>
//               {cfg.label}
//             </span>
//           </div>
//           {done && (
//             <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
//               <Check size={9} /> Done
//             </span>
//           )}
//         </div>
//         {requirementKey === 'anyother_requirement' && data?.requirement && (
//           <p className="text-[11px] text-slate-500 mt-1.5 truncate italic">"{data.requirement}"</p>
//         )}
//       </div>

//       {/* Body */}
//       <div className="px-4 py-3.5 space-y-3.5">
//         {/* Estimated */}
//         <div>
//           <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Estimated Date</p>
//           <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: cfg.light }}>
//             <Calendar size={11} style={{ color: cfg.hue }} />
//             <span className="pps-mono text-xs font-semibold" style={{ color: cfg.dark }}>
//               {data?.estimated_date ? displayDMY(parseDMY(data.estimated_date)) : '—'}
//             </span>
//           </div>
//         </div>

//         {/* Actual */}
//         <div>
//           <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Actual Date</p>
//           {done ? (
//             <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
//               <CheckCircle2 size={11} className="text-emerald-600" />
//               <span className="pps-mono text-xs font-semibold text-emerald-700">
//                 {displayDMY(parseDMY(data.actual_date))}
//               </span>
//             </div>
//           ) : (
//             <input
//               type="date"
//               value={localActualDate}
//               onChange={(e) => onActualDateChange(requirementKey, e.target.value)}
//               disabled={isSubmitting}
//               className="pps-date-input pps-mono w-full border rounded-xl px-3 py-2 text-xs text-slate-700 bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
//               style={{ borderColor: localActualDate ? cfg.hue + '55' : '#e2e8f0' }}
//             />
//           )}
//         </div>

//         {/* Remarks - ALWAYS editable (even on completed cards) */}
//         <div>
//           <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Remarks</p>
//           <textarea
//             value={localRemark}
//             onChange={(e) => onRemarkChange(requirementKey, e.target.value)}
//             disabled={isSubmitting}
//             placeholder="Optional notes..."
//             rows={2}
//             className="pps-date-input w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 bg-white resize-y min-h-[52px] focus:border-[#1a56db]"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─── ProgressDots (dynamic) ─────────────────────────────────────────────────── */
// function ProgressDots({ detail }) {
//   const activeKeys = detail
//     ? Object.keys(detail).filter((k) => REQUIREMENT_TYPES.hasOwnProperty(k))
//     : Object.keys(REQUIREMENT_TYPES);

//   if (!activeKeys.length) {
//     return <div className="flex gap-1">{Array(5).fill().map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />)}</div>;
//   }

//   const completedCount = detail
//     ? activeKeys.filter((k) => !!detail[k]?.actual_date).length
//     : 0;

//   return (
//     <div className="flex gap-1" title={`${completedCount}/${activeKeys.length} done`}>
//       {activeKeys.map((key) => {
//         const cfg = REQUIREMENT_TYPES[key];
//         const isDone = !!detail?.[key]?.actual_date;
//         return (
//           <div
//             key={key}
//             className="w-1.5 h-1.5 rounded-full transition-all duration-300"
//             style={{ background: isDone ? cfg.hue : '#e2e8f0' }}
//           />
//         );
//       })}
//     </div>
//   );
// }
// const formatDate = (dateStr) => {
//   if (!dateStr) return '—';

//   const date = new Date(dateStr);
//   const day = String(date.getDate()).padStart(2, '0');
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const year = date.getFullYear();

//   return `${day}-${month}-${year}`;
// };

// /* ─── Main Component ─────────────────────────────────────────────────────────── */
// export default function PPSamplePPC() {
//   const [samples, setSamples] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [expandedId, setExpandedId] = useState(null);
//   const [detailsMap, setDetailsMap] = useState({});
//   const [loadingDetail, setLoadingDetail] = useState(null);
//   const [search, setSearch] = useState('');
//   const [localActualDates, setLocalActualDates] = useState({});
//   const [localRemarks, setLocalRemarks] = useState({});
//   const [panelSubmitting, setPanelSubmitting] = useState(false);

//   const styleInjected = useRef(false);
//   const tableScrollRef = useRef(null);

//   /* ── Inject global styles ── */
//   useEffect(() => {
//     if (styleInjected.current) return;
//     const el = document.createElement('style');
//     el.textContent = GLOBAL_STYLES;
//     document.head.appendChild(el);
//     styleInjected.current = true;
//   }, []);

//   /* ── Load list ── */
//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const res = await api.get('/api/pp-sample/list/');
//         setSamples((res.data || []).map((item, i) => ({
//           id: item.pp_sample_id ?? i + 1,
//           sampleSaleOrderNo: item.sample_sale_order_no || '—',
//           existingCustomer: item.existing_customer ? 'Yes' : 'No',
//           customerName: item.customer_name || '—',
//           brandName: item.brand_name || '—',
//           saleOrderNo: item.sale_order_number || item.sample_sale_order_no || '—',
//           noOfSampleSKU: item.no_of_samples?.toString() || '0',
//           remarks: item.remarks || '',
//           status: item.status || 'Pending',
//           createdOn: item.created_on || '—',
//         })));
//       } catch (err) {
//         const msg = err.response?.data?.detail || err.message || 'Failed to load';
//         setError(msg);
//         toast.error(msg);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   /* ── Initialize local state when a row expands (only for active requirements) ── */
//   useEffect(() => {
//     if (!expandedId || !detailsMap[expandedId]) {
//       setLocalActualDates({});
//       setLocalRemarks({});
//       return;
//     }

//     const detail = detailsMap[expandedId];
//     const activeKeys = Object.keys(detail).filter((k) => REQUIREMENT_TYPES.hasOwnProperty(k));

//     const initDates = {};
//     const initRemarks = {};

//     activeKeys.forEach((key) => {
//       const reqData = detail[key] || {};
//       if (!reqData.actual_date) {
//         initDates[key] = '';
//       }
//       initRemarks[key] = reqData.remarks || '';
//     });

//     setLocalActualDates(initDates);
//     setLocalRemarks(initRemarks);
//   }, [expandedId, detailsMap]);

//   const handleRowClick = async (id) => {
//     if (expandedId === id) {
//       setExpandedId(null);
//       return;
//     }

//     setExpandedId(id);

//     setTimeout(() => {
//       const row = document.getElementById(`pp-row-${id}`);
//       if (row && tableScrollRef.current) {
//         row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
//       }
//     }, 150);

//     if (detailsMap[id]) return;

//     setLoadingDetail(id);

//     try {
//       const res = await api.post('/api/pp-sample/details/', { pp_sample_id: id });
//       setDetailsMap((p) => ({ ...p, [id]: res.data }));
//     } catch {
//       toast.error('Could not load details');
//       setExpandedId(null);
//     } finally {
//       setLoadingDetail(null);
//     }
//   };

//   const handleActualDateChange = (reqKey, value) => {
//     setLocalActualDates((prev) => ({ ...prev, [reqKey]: value }));
//   };

//   const handleRemarkChange = (reqKey, value) => {
//     setLocalRemarks((prev) => ({ ...prev, [reqKey]: value }));
//   };

//   const handleSubmitAll = async () => {
//     if (!expandedId) return;
//     const detail = detailsMap[expandedId];
//     if (!detail) return;

//     const activeReqKeys = Object.keys(detail).filter((k) => REQUIREMENT_TYPES.hasOwnProperty(k));

//     // Build full safe payload (never clears untouched fields)
//     const payload = {
//       pp_sample_id: expandedId,
//       btn: 'submit',
//     };

//     activeReqKeys.forEach((reqKey) => {
//       const mapping = FIELD_MAPPING[reqKey];
//       const reqData = detail[reqKey] || {};

//       // Date
//       let finalDate = reqData.actual_date ? parseDMY(reqData.actual_date) : null;
//       if (localActualDates.hasOwnProperty(reqKey)) {
//         finalDate = localActualDates[reqKey] || null;
//       }
//       payload[mapping.date] = finalDate;

//       // Remark (always sent)
//       const finalRemark = localRemarks[reqKey] || reqData.remarks || '';
//       payload[mapping.remark] = finalRemark;
//     });

//     setPanelSubmitting(true);

//     try {
//       const res = await api.post('/api/pp-sample/update-requirement-date/', payload);
//       toast.success(res?.data?.message || 'Requirement Details Updated Successfully');

//       // Refresh details
//       const fresh = await api.post('/api/pp-sample/details/', { pp_sample_id: expandedId });
//       setDetailsMap((p) => ({ ...p, [expandedId]: fresh.data }));

//       // Reset local state
//       setLocalActualDates({});
//       setLocalRemarks({});
//     } catch (err) {
//       const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Failed to update';
//       toast.error(msg);
//     } finally {
//       setPanelSubmitting(false);
//     }
//   };

//   const filtered = samples.filter((s) =>
//     !search ||
//     s.customerName.toLowerCase().includes(search.toLowerCase()) ||
//     s.sampleSaleOrderNo.toLowerCase().includes(search.toLowerCase()) ||
//     s.brandName.toLowerCase().includes(search.toLowerCase())
//   );

//   /* ── Loading / Error UI (unchanged) ── */
//   if (loading) return (
//     <div className="pps-root p-6 max-w-screen-2xl mx-auto space-y-5">
//       <div className="pps-shimmer h-9 w-52" />
//       <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="pps-shimmer h-20" />)}</div>
//       <div className="pps-shimmer h-[400px]" />
//     </div>
//   );

//   if (error) return (
//     <div className="pps-root min-h-[60vh] flex items-center justify-center p-8">
//       <div className="text-center space-y-4">
//         <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
//           <AlertCircle size={28} className="text-red-400" />
//         </div>
//         <p className="pps-heading text-xl font-bold text-slate-800">Failed to load</p>
//         <p className="text-sm text-slate-400">{error}</p>
//         <button onClick={() => window.location.reload()}
//           className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-xl text-sm font-semibold hover:bg-[#1e40af] transition-colors shadow-lg shadow-blue-200">
//           <RefreshCw size={13} /> Retry
//         </button>
//       </div>
//     </div>
//   );

//   /* ── Main UI ── */
//   return (
//     <div className="pps-root p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-6">
//       {/* Header + Search (unchanged) */}
//       <div className="pps-fade pps-fade-d1 flex items-start justify-between flex-wrap gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Sample - Top/Testing Etc</h1>
//         </div>
//         <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
//           <RefreshCw size={13} /> Refresh
//         </button>
//       </div>

//       <div className="pps-fade pps-fade-d3">
//         <div className="relative w-full max-w-sm">
//           <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//           <input
//             type="text"
//             placeholder="Search by customer, order no, brand…"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1a56db] transition-all"
//           />
//           {search && (
//             <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
//               <X size={13} />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Table */}
//       <div className="pps-fade pps-fade-d4 rounded-2xl overflow-hidden border border-slate-100 max-h-[80vh]" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
//         <div ref={tableScrollRef} className="pps-scroll overflow-auto max-h-[640px]">
//           <table className="min-w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
//             <thead className="sticky top-0 z-10">
//               <tr style={{ background: 'linear-gradient(135deg, #0d1f45 0%, #1a3a70 100%)' }}>
//                 {['', 'Sample Order No', 'Customer', 'Brand', 'Sale Order', 'SKUs', 'Status', 'Created'].map((col, i) => (
//                   <th key={i} className="px-5 py-4 text-left whitespace-nowrap select-none"
//                     style={{ color: '#ffffff', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
//                     {col}
//                   </th>
//                 ))}
//               </tr>
//             </thead>

//             <tbody style={{ background: '#ffffff' }}>
//               {filtered.length === 0 ? (
//                 <tr>
//                   <td colSpan={9} className="py-24 text-center">
//                     <Package size={36} className="mx-auto text-slate-200 mb-3" />
//                     <p className="text-slate-400 font-medium text-sm">
//                       {search ? `No results for "${search}"` : 'No Sample - Top/Testing Etc found'}
//                     </p>
//                     {search && <button onClick={() => setSearch('')} className="text-xs text-[#1a56db] mt-2 hover:underline">Clear search</button>}
//                   </td>
//                 </tr>
//               ) : filtered.map((item) => {
//                 const isExpanded = expandedId === item.id;
//                 const isLoadingThis = loadingDetail === item.id;
//                 const detail = detailsMap[item.id];
//                 const sCfg = STATUS_CFG[item.status?.toLowerCase().trim()] || { bg: '#f8fafc', color: '#64748b', dot: '#94a3b8' };

//                 const activeReqKeys = detail
//                   ? Object.keys(detail).filter((k) => REQUIREMENT_TYPES.hasOwnProperty(k))
//                   : [];
//                 const completedReqs = detail
//                   ? activeReqKeys.filter((k) => !!detail[k]?.actual_date).length
//                   : 0;

//                 // Change detection for button enable
//                 const hasAnyDateUpdate = Object.values(localActualDates).some((v) => !!v);
//                 const hasAnyRemarkUpdate = activeReqKeys.some((key) => {
//                   const orig = (detail[key] || {}).remarks || '';
//                   return localRemarks[key] !== orig;
//                 });
//                 const hasUpdates = hasAnyDateUpdate || hasAnyRemarkUpdate;

//                 return (
//                   <React.Fragment key={item.id}>
//                     <tr
//                       id={`pp-row-${item.id}`}
//                       onClick={() => handleRowClick(item.id)}
//                       className={`pps-row cursor-pointer select-none ${isExpanded ? 'expanded' : ''}`}
//                       style={{ borderBottom: '1px solid #f1f5f9' }}
//                     >
//                       <td className="pl-5 pr-3 py-4 w-10">
//                         {isLoadingThis ? (
//                           <Loader2 size={14} className="animate-spin text-[#1a56db]" />
//                         ) : (
//                           <ChevronRight size={14} className={`pps-chevron ${isExpanded ? 'open' : ''} text-slate-400`} />
//                         )}
//                       </td>
//                       <td className="px-5 py-4 whitespace-nowrap">
//                         <span className="pps-mono text-[13px] font-semibold text-[#1a3a70]">{item.sampleSaleOrderNo}</span>
//                       </td>
//                       <td className="px-5 py-4 whitespace-nowrap">
//                         <p className="font-semibold text-slate-800 leading-snug text-[13px]">{item.customerName}</p>
//                         <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
//                           <span className={`w-1.5 h-1.5 rounded-full inline-block ${item.existingCustomer === 'Yes' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
//                           {item.existingCustomer === 'Yes' ? 'Existing' : 'New'}
//                         </p>
//                       </td>
//                       <td className="px-5 py-4 whitespace-nowrap">
//                         <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">{item.brandName}</span>
//                       </td>
//                       <td className="px-5 py-4 whitespace-nowrap">
//                         <span className="pps-mono text-[12px] text-slate-500">{item.saleOrderNo}</span>
//                       </td>
//                       <td className="px-5 py-4 whitespace-nowrap text-center">
//                         <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold" style={{ background: 'rgba(26,86,219,0.08)', color: '#1a56db' }}>
//                           {item.noOfSampleSKU}
//                         </span>
//                       </td>
//                       <td className="px-5 py-4 whitespace-nowrap">
//                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
//                           style={{ background: sCfg.bg, color: sCfg.color }}>
//                           <span className="w-1.5 h-1.5 rounded-full" style={{ background: sCfg.dot }} />
//                           {item.status}
//                         </span>
//                       </td>
//                       <td className="px-5 py-4 whitespace-nowrap">
//                         <span className="pps-mono text-[11px] text-slate-400">{item.createdOn?.split(" ")[0] || "—"}</span>
//                       </td>
//                     </tr>

//                     {/* Expanded panel */}
//                     {isExpanded && (
//                       <tr>
//                         <td colSpan={9} className="p-0">
//                           <div className="pps-expand-anim" style={{ borderBottom: '2px solid #dce7ff' }}>
//                             {/* Panel header (unchanged) */}
//                             <div className="px-7 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3">
//                               <div className="flex items-center gap-3">
//                                 <div className="w-1 h-10 rounded-full" style={{ background: 'linear-gradient(180deg, #1a56db, #7c3aed)' }} />
//                                 <div>
//                                   <p className="pps-heading font-bold text-slate-800 text-[15px]" style={{ fontWeight: 700 }}>
//                                     Requirement Details
//                                   </p>
//                                   <p className="text-xs text-slate-400 mt-0.5">
//                                     {item.customerName}
//                                     {item.remarks && <> · <span className="italic text-slate-500">{item.remarks}</span></>}
//                                   </p>
//                                 </div>
//                               </div>
//                               {detail && (
//                                 <div
//                                   className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
//                                   style={{
//                                     background: completedReqs === activeReqKeys.length ? '#f0fdf4' : '#fff',
//                                     borderColor: completedReqs === activeReqKeys.length ? '#86efac' : '#e2e8f0',
//                                     color: completedReqs === activeReqKeys.length ? '#16a34a' : '#64748b',
//                                   }}
//                                 >
//                                   <CheckCircle2 size={12} />
//                                   {completedReqs}/{activeReqKeys.length} requirements done
//                                 </div>
//                               )}
//                             </div>

//                             {/* Cards + SINGLE submit button */}
//                             <div className="px-7 pb-7">
//                               {isLoadingThis || !detail ? (
//                                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
//                                   {Object.keys(REQUIREMENT_TYPES).map((k) => <div key={k} className="pps-shimmer h-52" />)}
//                                 </div>
//                               ) : (
//                                 <>
//                                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
//                                     {activeReqKeys.map((key, i) => {
//                                       const cfg = REQUIREMENT_TYPES[key];
//                                       return (
//                                         <RequirementCard
//                                           key={key}
//                                           cfg={cfg}
//                                           data={detail[key]}
//                                           requirementKey={key}
//                                           localActualDate={localActualDates[key] || ''}
//                                           onActualDateChange={handleActualDateChange}
//                                           localRemark={localRemarks[key] || ''}
//                                           onRemarkChange={handleRemarkChange}
//                                           isSubmitting={panelSubmitting}
//                                           animDelay={i * 60}
//                                         />
//                                       );
//                                     })}
//                                   </div>

//                                   {/* SINGLE SUBMIT BUTTON (always visible when expanded) */}
//                                   <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
//                                     <button
//                                       onClick={handleSubmitAll}
//                                       disabled={panelSubmitting || !hasUpdates}
//                                       className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
//                                       style={{
//                                         background: hasUpdates ? 'linear-gradient(135deg, #1a56db, #1e40af)' : '#b7bfca',
//                                         boxShadow: hasUpdates ? '0 8px 20px rgba(26,86,219,0.25)' : 'none',
//                                       }}
//                                     >
//                                       {panelSubmitting ? (
//                                         <>
//                                           <Loader2 size={16} className="animate-spin" />
//                                           Saving Changes...
//                                         </>
//                                       ) : hasUpdates ? (
//                                         <>
//                                           Save All Changes <Check size={16} />
//                                         </>
//                                       ) : (
//                                         'No changes to save'
//                                       )}
//                                     </button>
//                                   </div>
//                                 </>
//                               )}
//                             </div>
//                           </div>
//                         </td>
//                       </tr>
//                     )}
//                   </React.Fragment>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Footer (unchanged) */}
//         <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
//           <p className="text-xs text-slate-400 pps-mono">
//             {filtered.length} of {samples.length} records
//             {search && <span className="text-[#1a56db] font-medium"> (filtered)</span>}
//           </p>
//           {expandedId && (
//             <button onClick={() => setExpandedId(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
//               <X size={11} /> Collapse all
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
