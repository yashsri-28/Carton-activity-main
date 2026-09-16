// import React, { useEffect, useState } from 'react';
// import { toast } from 'react-toastify';
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer,
// } from 'recharts';
// import { getPerformanceStats } from '../../api/artworkApi';

// // const STAGE_LABELS = {
// //   MARKETING: 'Marketing',
// //   PPC: 'Packaging',
// //   TQM: 'TQM',
// //   CUSTOMER: 'Customer',
// // };

// // const ACCENT = {
// //   amber: '#C68A2E',
// //   red: '#B44B3E',
// //   slate: '#4A5A73',
// //   navy: '#003366',
// // };


// const STAGE_LABELS = {
//   MARKETING: 'Marketing',
//   PPC: 'PPC',
//   TQM: 'TQM',
//   LEGAL: 'Legal',
//   COMPLIANCE: 'Compliance',
//   LAB: 'Lab',
//   CUSTOMER: 'Customer',
// };

// // Fixed left-to-right order for both stage-based charts, so Marketing
// // always comes first and Customer always comes last, regardless of
// // which stages actually have data for a given dataset.
// const STAGE_ORDER = ['MARKETING', 'PPC', 'TQM', 'LEGAL', 'COMPLIANCE', 'LAB', 'CUSTOMER'];

// // Human-readable labels for the "Trim Performance" chart — same
// // category codes used across the Packaging Specification form.
// const TRIM_LABELS = {
//   PVC_BAG: 'PVC Bag',
//   RIBBON: 'Ribbon',
//   BW_STICKER: 'B&W Sticker',
//   LABEL: 'Label',
//   PAPER_PRINTED_ITEM: 'Paper Printed Item',
//   BOX: 'Box',
//   OTHER: 'Other',
//   PDQ: 'PDQ',
// };

// const ACCENT = {
//   amber: '#C68A2E',
//   red: '#B44B3E',
//   slate: '#4A5A73',
//   navy: '#003366',
// };

// // One distinct color per stage / trim, used as separate bars inside
// // the histogram charts below.
// const STAGE_COLORS = {
//   MARKETING: '#003366',
//   PPC: '#0F6E56',
//   TQM: '#C68A2E',
//   LEGAL: '#6B4FA0',
//   COMPLIANCE: '#B44B3E',
//   LAB: '#2E7DB5',
//   CUSTOMER: '#4A5A73',
// };

// const TRIM_COLOR_PALETTE = ['#003366', '#0F6E56', '#C68A2E', '#B44B3E', '#6B4FA0', '#2E7DB5', '#4A5A73', '#8C5B3E'];
// function trimColor(index) {
//   return TRIM_COLOR_PALETTE[index % TRIM_COLOR_PALETTE.length];
// }

// // Builds a clean [0, 5, 10, 15, ...] tick array that always starts at
// // 0 and always covers the largest value in the dataset, so every
// // day-based chart reads on the same "every 5 days" scale.
// function fiveDayTicks(maxValue) {
//   const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 5;
//   const topTick = Math.ceil(safeMax / 5) * 5;
//   const ticks = [];
//   for (let t = 0; t <= topTick; t += 5) ticks.push(t);
//   return ticks;
// }
// function StatCard({ label, value, sub, accent }) {
//   return (
//     <div
//       className="bg-white rounded-lg px-6 py-5 shadow-sm border-l-4 border border-gray-100"
//       style={{ borderLeftColor: accent }}
//     >
//       <p className="text-[11px] font-semibold text-gray-500 tracking-[0.15em] uppercase">
//         {label}
//       </p>
//       <p className="mt-2 mb-1 text-4xl font-bold text-gray-900">
//         {value}
//       </p>
//       {sub && <p className="text-xs text-gray-400">{sub}</p>}
//     </div>
//   );
// }

// function PanelHeader({ title, subtitle }) {
//   return (
//     <div className="mb-4">
//       <h2 className="text-lg font-semibold text-gray-800">
//         {title}
//       </h2>
//       <p className="text-xs text-gray-400">{subtitle}</p>
//     </div>
//   );
// }

// function CustomTooltip({ active, payload, label }) {
//   if (!active || !payload || !payload.length) return null;
//   return (
//     <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
//       <p className="font-medium text-gray-700 mb-1">{label}</p>
//       {payload.map((p) => (
//         <p key={p.dataKey} className="text-gray-500">
//           {p.name}: <span className="font-medium text-gray-700">{p.value}</span>
//         </p>
//       ))}
//     </div>
//   );
// }

// function ArtworkPerformanceDashboard() {
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     getPerformanceStats()
//       .then((res) => setStats(res.data))
//       .catch(() => toast.error('Failed to load performance stats.'))
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
//   if (!stats) return <div className="p-6 text-gray-400">No data available.</div>;

//   // const stageData = Object.entries(stats.avg_review_time_by_department || {}).map(([key, days]) => ({
//   //   stage: STAGE_LABELS[key] || key,
//   //   days: -(days ?? 0),
//   //   isBottleneck: key === stats.bottleneck_stage,
//   // }));

//   // const vendorData = (stats.vendor_performance || []).map((v) => ({
//   //   vendor: v.vendor,
//   //   avgTurnaround: v.avg_turnaround_days,
//   //   revisions: v.revisions,
//   // }));




//     // "Avg review time by stage" — how long EACH stage alone takes,
//   // once it's that stage's turn. Ordered Marketing -> ... -> Customer;
//   // only stages that actually have data are shown.
//   // const stageData = STAGE_ORDER
//   //   .filter((key) => stats.avg_review_time_by_department?.[key] != null)
//   //   .map((key) => ({
//   //     stage: STAGE_LABELS[key] || key,
//   //     days: stats.avg_review_time_by_department[key],
//   //     isBottleneck: key === stats.bottleneck_stage,
//   //   }));
//   // const stageMaxDays = Math.max(0, ...stageData.map((d) => d.days));
//   // const stageTicks = fiveDayTicks(stageMaxDays);


//     // Histogram rows — one row per 5-day bucket, one column per stage
//   // that actually has data (e.g. { bucket: "0-5", MARKETING: 3, PPC: 1 }).
//   const stageHistogramRows = stats.stage_review_histogram || [];
//   const stageKeysPresent = STAGE_ORDER.filter((key) =>
//     stageHistogramRows.some((row) => (row[key] || 0) > 0)
//   );

//   // "Lead Time — completion of step" — cumulative days from the
//   // version being uploaded until THAT stage is done, so it naturally
//   // grows from 0 as the request moves through the chain.
//   const leadTimeData = STAGE_ORDER
//     .filter((key) => stats.avg_lead_time_by_department?.[key] != null)
//     .map((key) => ({
//       stage: STAGE_LABELS[key] || key,
//       days: stats.avg_lead_time_by_department[key],
//     }));
//   const leadTimeMaxDays = Math.max(0, ...leadTimeData.map((d) => d.days));
//   const leadTimeTicks = fiveDayTicks(leadTimeMaxDays);

//   // "Trim Performance" — grouped by packaging category instead of by
//   // vendor.
//   // const trimData = (stats.trim_performance || []).map((t) => ({
//   //   trim: TRIM_LABELS[t.trim] || t.trim,
//   //   avgTurnaround: t.avg_turnaround_days,
//   //   revisions: t.revisions,
//   // }));

//   const trimHistogramRows = stats.trim_duration_histogram || [];
//   const trimKeysPresent = Array.from(
//     new Set(trimHistogramRows.flatMap((row) => Object.keys(row).filter((k) => k !== 'bucket')))
//   );

//   return (
//     <div className="w-full h-full overflow-y-auto thin-scrollbar bg-gray-50">
//       <div className="h-1.5 w-full" style={{ background: ACCENT.navy }} />

//       <div className="p-6 w-full">
//         <h1 className="text-xl font-semibold text-gray-800 mb-1">Performance Dashboard</h1>
//         <p className="text-sm text-gray-500 mb-6">
//           Vendor performance, average review time by department, and the current approval bottleneck.
//         </p>

//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
//           {/* <StatCard
//             label="First-Pass Approval Rate"
//             value={stats.first_pass_approval_rate !== null ? `${stats.first_pass_approval_rate}%` : '—'}
//             sub={`target ≥ 90% · ${stats.sample_size?.terminal_artworks ?? 0} completed artwork(s)`}
//             accent={ACCENT.amber}
//           />
//           <StatCard
//             label="AI Validation Failure Rate"
//             value={stats.ai_validation_failure_rate !== undefined && stats.ai_validation_failure_rate !== null ? `${stats.ai_validation_failure_rate}%` : '—'}
//             sub={stats.sample_size?.proofing_runs ? `${stats.sample_size.proofing_runs} proofing runs analysed` : 'AI Proofing not yet enabled'}
//             accent={ACCENT.red}
//           />
//           <StatCard
//             label="Approval Bottleneck"
//             value={stats.bottleneck_stage ? (STAGE_LABELS[stats.bottleneck_stage] || stats.bottleneck_stage) : '—'}
//             sub="stage with longest avg. dwell time"
//             accent={ACCENT.slate}
//           /> */}

//           <StatCard
//             label="First-Pass Approval Rate"
//             value={stats.first_pass_approval_rate !== null ? `${stats.first_pass_approval_rate}%` : '—'}
//             sub={`target ≥ 90% · ${stats.sample_size?.terminal_artworks ?? 0} completed artwork(s)`}
//             accent={ACCENT.amber}
//           />
//           <StatCard
//             label="Approval Bottleneck"
//             value={stats.bottleneck_stage ? (STAGE_LABELS[stats.bottleneck_stage] || stats.bottleneck_stage) : '—'}
//             sub="stage with longest avg. dwell time"
//             accent={ACCENT.slate}
//           />
//           <StatCard
//             label="AI Validation Failure Rate"
//             value={stats.ai_validation_failure_rate !== undefined && stats.ai_validation_failure_rate !== null ? `${stats.ai_validation_failure_rate}%` : '—'}
//             sub={stats.sample_size?.proofing_runs ? `${stats.sample_size.proofing_runs} proofing runs analysed` : 'AI Proofing not yet enabled'}
//             accent={ACCENT.red}
//           />
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
// {/* 
//           <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
//             <PanelHeader
//               title="Vendor performance"
//               subtitle="Avg. turnaround (days) and revision count by vendor"
//             />

//             {vendorData.length === 0 ? (
//               <p className="text-sm text-gray-400 py-10 text-center">No vendor data available.</p>
//             ) : (
//               <ResponsiveContainer width="100%" height={320}>
//                 <BarChart data={vendorData} margin={{ top: 0, right: 8, left: -8, bottom: 0 }} barGap={6}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
//                   <XAxis dataKey="vendor" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
//                   <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
//                   <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
//                   <Legend
//                     verticalAlign="top"
//                     align="left"
//                     height={36}
//                     iconType="square"
//                     formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
//                   />
//                   <Bar dataKey="avgTurnaround" name="Avg turnaround (d)" fill={ACCENT.navy} radius={[3, 3, 0, 0]} barSize={28} />
//                   <Bar dataKey="revisions" name="Revisions" fill={ACCENT.amber} radius={[3, 3, 0, 0]} barSize={28} />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </div> */}


//               <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
//             <PanelHeader
//               title="Trim performance"
//               subtitle="How many artworks (per trim/category) finished in each 5-day window"
//             />

//             {trimHistogramRows.length === 0 || trimKeysPresent.length === 0 ? (
//               <p className="text-sm text-gray-400 py-10 text-center">No trim data available.</p>
//             ) : (
//               <ResponsiveContainer width="100%" height={320}>
//                 <BarChart data={trimHistogramRows} margin={{ top: 0, right: 8, left: -8, bottom: 0 }} barGap={4}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
//                   <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
//                   <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
//                   <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
//                   <Legend
//                     verticalAlign="top"
//                     align="left"
//                     height={36}
//                     iconType="square"
//                     formatter={(value) => <span className="text-xs text-gray-600">{TRIM_LABELS[value] || value}</span>}
//                   />
//                   {trimKeysPresent.map((key, i) => (
//                     <Bar key={key} dataKey={key} name={TRIM_LABELS[key] || key} fill={trimColor(i)} radius={[3, 3, 0, 0]} barSize={18} />
//                   ))}
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </div>
// {/* 
//           <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
//             <PanelHeader
//               title="Avg. review time by stage"
//               subtitle="Mean days spent per lifecycle stage"
//             />

//             {stageData.length === 0 ? (
//               <p className="text-sm text-gray-400 py-10 text-center">No stage data available.</p>
//             ) : (
//               <ResponsiveContainer width="100%" height={Math.max(280, stageData.length * 34)}>
//                 <BarChart
//                   data={stageData}
//                   layout="vertical"
//                   margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
//                   barCategoryGap={12}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
//                   <XAxis
//                     type="number"
//                     domain={['dataMin', 0]}
//                     tick={{ fontSize: 12, fill: '#9ca3af' }}
//                     axisLine={{ stroke: '#e5e7eb' }}
//                     tickFormatter={(v) => Math.abs(v)}
//                   />
//                   <YAxis
//                     type="category"
//                     dataKey="stage"
//                     width={110}
//                     tick={{ fontSize: 13, fill: '#6b7280' }}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <Tooltip
//                     content={({ active, payload, label }) =>
//                       active && payload?.length ? (
//                         <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
//                           <p className="font-medium text-gray-700">{label}</p>
//                           <p className="text-gray-500">{Math.abs(payload[0].value)}d avg</p>
//                         </div>
//                       ) : null
//                     }
//                     cursor={{ fill: 'rgba(0,0,0,0.03)' }}
//                   />
//                   <Bar dataKey="days" radius={[3, 0, 0, 3]} barSize={20}>
//                     {stageData.map((entry, i) => (
//                       <Cell key={i} fill={entry.isBottleneck ? ACCENT.red : ACCENT.slate} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </div> */}

//           <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
//             <PanelHeader
//               title="Avg. review time by stage"
//               subtitle="How many reviews (per stage/role) finished in each 5-day window"
//             />

//             {stageHistogramRows.length === 0 || stageKeysPresent.length === 0 ? (
//               <p className="text-sm text-gray-400 py-10 text-center">No stage data available.</p>
//             ) : (
//               <ResponsiveContainer width="100%" height={320}>
//                 <BarChart data={stageHistogramRows} margin={{ top: 0, right: 8, left: -8, bottom: 0 }} barGap={4}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
//                   <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
//                   <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
//                   <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
//                   <Legend
//                     verticalAlign="top"
//                     align="left"
//                     height={36}
//                     iconType="square"
//                     formatter={(value) => <span className="text-xs text-gray-600">{STAGE_LABELS[value] || value}</span>}
//                   />
//                   {stageKeysPresent.map((key) => (
//                     <Bar key={key} dataKey={key} name={STAGE_LABELS[key] || key} fill={STAGE_COLORS[key] || ACCENT.slate} radius={[3, 3, 0, 0]} barSize={18} />
//                   ))}
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }

// export default ArtworkPerformanceDashboard;


import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer,
} from 'recharts';
import { getPerformanceStats } from '../../api/artworkApi';

const STAGE_LABELS = {
  MARKETING: 'Marketing',
  PPC: 'PPC',
  TQM: 'TQM',
  LEGAL: 'Legal',
  COMPLIANCE: 'Compliance',
  LAB: 'Lab',
  CUSTOMER: 'Customer',
};

// Fixed left-to-right order for both stage-based charts, so Marketing
// always comes first and Customer always comes last, regardless of
// which stages actually have data for a given dataset.
const STAGE_ORDER = ['MARKETING', 'PPC', 'TQM', 'LEGAL', 'COMPLIANCE', 'LAB', 'CUSTOMER'];

// Human-readable labels for the "Trim Performance" chart — same
// category codes used across the Packaging Specification form.
const TRIM_LABELS = {
  PVC_BAG: 'PVC Bag',
  RIBBON: 'Ribbon',
  BW_STICKER: 'B&W Sticker',
  LABEL: 'Label',
  PAPER_PRINTED_ITEM: 'Paper Printed Item',
  BOX: 'Box',
  OTHER: 'Other',
  PDQ: 'PDQ',
};

const ACCENT = {
  amber: '#C68A2E',
  red: '#B44B3E',
  slate: '#4A5A73',
  navy: '#003366',
};

// Builds a clean [0, 5, 10, 15, ...] tick array that always starts at
// 0 and always covers the largest value in the dataset, so every
// day-based chart reads on the same "every 5 days" scale.
function fiveDayTicks(maxValue) {
  const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 5;
  const topTick = Math.ceil(safeMax / 5) * 5;
  const ticks = [];
  for (let t = 0; t <= topTick; t += 5) ticks.push(t);
  return ticks;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="bg-white rounded-lg px-6 py-5 shadow-sm border-l-4 border border-gray-100"
      style={{ borderLeftColor: accent }}
    >
      <p className="text-[11px] font-semibold text-gray-500 tracking-[0.15em] uppercase">
        {label}
      </p>
      <p className="mt-2 mb-1 text-4xl font-bold text-gray-900">
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function PanelHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {title}
      </h2>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-gray-500">
          {p.name}: <span className="font-medium text-gray-700">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function ArtworkPerformanceDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPerformanceStats()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load performance stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!stats) return <div className="p-6 text-gray-400">No data available.</div>;

  // "Avg review time by stage" — how long EACH stage alone takes,
  // once it's that stage's turn. Ordered Marketing -> ... -> Customer;
  // only stages that actually have data are shown.
  const stageData = STAGE_ORDER
    .filter((key) => stats.avg_review_time_by_department?.[key] != null)
    .map((key) => ({
      stage: STAGE_LABELS[key] || key,
      days: stats.avg_review_time_by_department[key],
      isBottleneck: key === stats.bottleneck_stage,
    }));
  const stageMaxDays = Math.max(0, ...stageData.map((d) => d.days));
  const stageTicks = fiveDayTicks(stageMaxDays);

  // "Lead Time — completion of step" — cumulative days from the
  // version being uploaded until THAT stage is done, so it naturally
  // grows from 0 as the request moves through the chain.
  const leadTimeData = STAGE_ORDER
    .filter((key) => stats.avg_lead_time_by_department?.[key] != null)
    .map((key) => ({
      stage: STAGE_LABELS[key] || key,
      days: stats.avg_lead_time_by_department[key],
    }));
  const leadTimeMaxDays = Math.max(0, ...leadTimeData.map((d) => d.days));
  const leadTimeTicks = fiveDayTicks(leadTimeMaxDays);

  // "Trim Performance" — grouped by packaging category instead of by
  // vendor.
  const trimData = (stats.trim_performance || []).map((t) => ({
    trim: TRIM_LABELS[t.trim] || t.trim,
    avgTurnaround: t.avg_turnaround_days,
    revisions: t.revisions,
  }));

  return (
    <div className="w-full h-full overflow-y-auto thin-scrollbar bg-gray-50">
      <div className="h-1.5 w-full" style={{ background: ACCENT.navy }} />

      <div className="p-6 w-full">
        <h1 className="text-xl font-semibold text-gray-800 mb-1">Performance Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">
          Trim performance, average review time by stage, and the current approval bottleneck.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <StatCard
            label="First-Pass Approval Rate"
            value={stats.first_pass_approval_rate !== null ? `${stats.first_pass_approval_rate}%` : '—'}
            sub={`target ≥ 90% · ${stats.sample_size?.terminal_artworks ?? 0} completed artwork(s)`}
            accent={ACCENT.amber}
          />
          <StatCard
            label="Approval Bottleneck"
            value={stats.bottleneck_stage ? (STAGE_LABELS[stats.bottleneck_stage] || stats.bottleneck_stage) : '—'}
            sub="stage with longest avg. dwell time"
            accent={ACCENT.slate}
          />
          <StatCard
            label="AI Validation Failure Rate"
            value={stats.ai_validation_failure_rate !== undefined && stats.ai_validation_failure_rate !== null ? `${stats.ai_validation_failure_rate}%` : '—'}
            sub={stats.sample_size?.proofing_runs ? `${stats.sample_size.proofing_runs} proofing runs analysed` : 'AI Proofing not yet enabled'}
            accent={ACCENT.red}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <PanelHeader
              title="Trim performance"
              subtitle="Avg. turnaround (days) and revision count by trim/category"
            />

            {trimData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">No trim data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={trimData} margin={{ top: 0, right: 8, left: -8, bottom: 0 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="trim" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Legend
                    verticalAlign="top"
                    align="left"
                    height={36}
                    iconType="square"
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                  <Bar dataKey="avgTurnaround" name="Avg turnaround (d)" fill={ACCENT.navy} radius={[3, 3, 0, 0]} barSize={28} />
                  <Bar dataKey="revisions" name="Revisions" fill={ACCENT.amber} radius={[3, 3, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <PanelHeader
              title="Avg. review time by stage"
              subtitle="Mean days spent per stage, on a 0–5–10–15 day scale"
            />

            {stageData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">No stage data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(280, stageData.length * 34)}>
                <BarChart
                  data={stageData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                  barCategoryGap={12}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                  <XAxis
                    type="number"
                    domain={[0, stageTicks[stageTicks.length - 1]]}
                    ticks={stageTicks}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    width={110}
                    tick={{ fontSize: 13, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
                          <p className="font-medium text-gray-700">{label}</p>
                          <p className="text-gray-500">{payload[0].value}d avg</p>
                        </div>
                      ) : null
                    }
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="days" radius={[0, 3, 3, 0]} barSize={20}>
                    {stageData.map((entry, i) => (
                      <Cell key={i} fill={entry.isBottleneck ? ACCENT.red : ACCENT.slate} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

        <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100 mt-5">
          <PanelHeader
            title="Lead time — completion of step"
            subtitle="Cumulative days from upload until each stage is DONE, on a 0–5–10–15 day scale"
          />

          {leadTimeData.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No lead-time data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={leadTimeData}
                margin={{ top: 0, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, leadTimeTicks[leadTimeTicks.length - 1]]}
                  ticks={leadTimeTicks}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
                        <p className="font-medium text-gray-700">{label}</p>
                        <p className="text-gray-500">{payload[0].value}d since upload</p>
                      </div>
                    ) : null
                  }
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="days" name="Cumulative days" fill={ACCENT.navy} radius={[3, 3, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}

export default ArtworkPerformanceDashboard;