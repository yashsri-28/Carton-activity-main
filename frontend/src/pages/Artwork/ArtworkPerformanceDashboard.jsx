// import React, { useEffect, useState } from 'react';
// import { toast } from 'react-toastify';
// // import {
// //   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
// // } from 'recharts';
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer,
// } from 'recharts';
// import { getPerformanceStats } from '../../api/artworkApi';

// const STAGE_LABELS = {
//   MARKETING: 'Marketing',
//   PPC: 'PPC',
//   TQM: 'TQM',
//   LEGAL: 'Legal',
//   COMPLIANCE: 'Compliance',
//   LAB: 'Lab',
//   CUSTOMER: 'Customer',
// };

// // Fixed left-to-right order for the stage chart, so Marketing always
// // comes first and Customer always comes last, regardless of which
// // stages actually have data for a given dataset.
// const STAGE_ORDER = ['MARKETING', 'PPC', 'TQM', 'LEGAL', 'COMPLIANCE', 'LAB', 'CUSTOMER'];

// // Human-readable labels for the "Trim Performance" chart — same
// // category codes used across the Packaging Specification form.
// const TRIM_LABELS = {
//   // PVC_BAG: 'PVC Bag',
//   RIBBON: 'Ribbon',
//   BW_STICKER: 'B&W Sticker',
//   LABEL: 'Label',
//   PAPER_PRINTED_ITEM: 'Paper Printed Item',
//   // BOX: 'Box',
//   OTHER: 'Other',
//   // PDQ: 'PDQ',
// };

// const ACCENT = {
//   amber: '#C68A2E',
//   red: '#B44B3E',
//   slate: '#4A5A73',
//   navy: '#003366',
// };

// // Builds a [0, 5, 10, 15, 20, ...] tick array. It ALWAYS covers at
// // least 0-20 (so the scale reads the same way even when the actual
// // data is tiny), and extends further only if the real data needs it.
// function fiveDayTicks(maxValue) {
//   const MIN_TOP = 20;
//   const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;
//   const topTick = Math.max(MIN_TOP, Math.ceil(safeMax / 5) * 5);
//   const ticks = [];
//   for (let t = 0; t <= topTick; t += 5) ticks.push(t);
//   return ticks;
// }

// // Formats a "days" value the readable way — minutes for very short
// // times, hours for under a day, days once it's a full day or more.
// // So "Marketing took 4 hours" shows as "4h", not an unreadable
// // "0.17" on a days-based axis.
// function formatDuration(days) {
//   if (days == null) return '—';
//   const hours = days * 24;
//   if (hours < 1) {
//     const minutes = Math.round(hours * 60);
//     return `${minutes}m`;
//   }
//   if (days < 1) {
//     return `${hours.toFixed(1)}h`;
//   }
//   return `${days.toFixed(1)}d`;
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

//   // "Avg review time by stage" — how long EACH stage alone takes,
//   // once it's that stage's turn. Ordered Marketing -> ... -> Customer;
//   // only stages that actually have data are shown.
//   const stageData = STAGE_ORDER
//     .filter((key) => stats.avg_review_time_by_department?.[key] != null)
//     .map((key) => ({
//       stage: STAGE_LABELS[key] || key,
//       days: stats.avg_review_time_by_department[key],
//       isBottleneck: key === stats.bottleneck_stage,
//     }));
//   const stageTicks = fiveDayTicks(Math.max(0, ...stageData.map((d) => d.days)));

//   // "Trim performance" — grouped by packaging category (Ribbon,
//   // Label, PVC Bag, etc.) instead of by vendor. Only the avg
//   // turnaround (days) is plotted — a revision COUNT isn't a day
//   // value, so it doesn't belong on the same days-scale axis.
//   // const trimData = (stats.trim_performance || [])
//   //   .filter((t) => t.avg_turnaround_days != null)
//   //   .map((t) => ({
//   //     trim: TRIM_LABELS[t.trim] || t.trim,
//   //     days: t.avg_turnaround_days,
//   //   }));
//   // const trimTicks = fiveDayTicks(Math.max(0, ...trimData.map((d) => d.days)));



//     // "Trim performance" — grouped by packaging category (Ribbon,
//   // Label, PVC Bag, etc.) instead of by vendor. Only the avg
//   // turnaround (days) is plotted — a revision COUNT isn't a day
//   // value, so it doesn't belong on the same days-scale axis.
//   //
//   // Show EVERY category, not just the ones with data — categories
//   // with no completed artwork yet get a 0-day bar (and a "no data
//   // yet" tooltip), so the chart always covers the full product range.
//   const trimByCategory = {};
//   (stats.trim_performance || []).forEach((t) => {
//     trimByCategory[t.trim] = t.avg_turnaround_days;
//   });
//   const trimData = Object.keys(TRIM_LABELS).map((category) => ({
//     trim: TRIM_LABELS[category],
//     days: trimByCategory[category] ?? 0,
//     hasData: trimByCategory[category] != null,
//   }));
//   const trimTicks = fiveDayTicks(Math.max(0, ...trimData.map((d) => d.days)));

//   return (
//     <div className="w-full h-full overflow-y-auto thin-scrollbar bg-gray-50">
//       <div className="h-1.5 w-full" style={{ background: ACCENT.navy }} />

//       <div className="p-6 w-full">
//         <h1 className="text-xl font-semibold text-gray-800 mb-1">Performance Dashboard</h1>
//         <p className="text-sm text-gray-500 mb-6">
//           Trim performance, average review time by stage, and the current approval bottleneck.
//         </p>

//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
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

//           {/* Trim performance — SAME vertical-bar style as before,
//               just with the fixed 0-5-10-15-20 day scale on the Y-axis
//               instead of an auto-scaled 0-0.25-0.5-0.75-1 axis. */}
//           <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
//             <PanelHeader
//               title="Trim performance"
//               subtitle="Avg. turnaround (days) by trim/category, on a 0–5–10–15–20 day scale"
//             />

//             {trimData.length === 0 ? (
//               <p className="text-sm text-gray-400 py-10 text-center">No trim data available.</p>
//             ) : (
//               <ResponsiveContainer width="100%" height={320}>
//                 <BarChart data={trimData} margin={{ top: 0, right: 8, left: -8, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
//                   <XAxis dataKey="trim" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
//                   <YAxis
//                     domain={[0, trimTicks[trimTicks.length - 1]]}
//                     ticks={trimTicks}
//                     tick={{ fontSize: 12, fill: '#9ca3af' }}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   {/* <Tooltip
//                     content={({ active, payload, label }) =>
//                       active && payload?.length ? (
//                         <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
//                           <p className="font-medium text-gray-700">{label}</p>
//                           <p className="text-gray-500">{payload[0].value}d avg turnaround</p>
//                         </div>
//                       ) : null
//                     }
//                     cursor={{ fill: 'rgba(0,0,0,0.03)' }}
//                   /> */}

//                   <Tooltip
//                     content={({ active, payload, label }) =>
//                       active && payload?.length ? (
//                         <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
//                           <p className="font-medium text-gray-700">{label}</p>
//                           <p className="text-gray-500">
//                             {payload[0].payload.hasData ? `${payload[0].value}d avg turnaround` : 'No completed artwork yet'}
//                           </p>
//                         </div>
//                       ) : null
//                     }
//                     cursor={{ fill: 'rgba(0,0,0,0.03)' }}
//                   />
//                   <Bar dataKey="days" name="Avg turnaround (d)" fill={ACCENT.navy} radius={[3, 3, 0, 0]} barSize={36} />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </div>

//           {/* Avg review time by stage — SAME horizontal-bar style as
//               before, just with the fixed 0-5-10-15-20 day scale. */}
//           <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
//             <PanelHeader
//               title="Avg. review time by stage"
//               subtitle="Mean days spent per stage, on a 0–5–10–15–20 day scale"
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
//                     domain={[0, stageTicks[stageTicks.length - 1]]}
//                     ticks={stageTicks}
//                     tick={{ fontSize: 12, fill: '#9ca3af' }}
//                     axisLine={{ stroke: '#e5e7eb' }}
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
//                           <p className="text-gray-500">{payload[0].value}d avg</p>
//                         </div>
//                       ) : null
//                     }
//                     cursor={{ fill: 'rgba(0,0,0,0.03)' }}
//                   />
//                   <Bar dataKey="days" radius={[0, 3, 3, 0]} barSize={20}>
//                     {stageData.map((entry, i) => (
//                       <Cell key={i} fill={entry.isBottleneck ? ACCENT.red : ACCENT.slate} />
//                     ))}
//                   </Bar>
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer,
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

// Fixed left-to-right order for the stage chart, so Marketing always
// comes first and Customer always comes last, regardless of which
// stages actually have data for a given dataset.
const STAGE_ORDER = ['MARKETING', 'PPC', 'TQM', 'LEGAL', 'COMPLIANCE', 'LAB', 'CUSTOMER'];

// Human-readable labels for the "Trim Performance" chart — same
// category codes used across the Packaging Specification form.
const TRIM_LABELS = {
  RIBBON: 'Ribbon',
  BW_STICKER: 'B&W Sticker',
  LABEL: 'Label',
  PAPER_PRINTED_ITEM: 'Paper Printed Item',
  OTHER: 'Other',
};

const ACCENT = {
  amber: '#C68A2E',
  red: '#B44B3E',
  slate: '#4A5A73',
  navy: '#003366',
};

// Builds a [0, 5, 10, 15, 20, ...] tick array. It ALWAYS covers at
// least 0-20 (so the scale reads the same way even when the actual
// data is tiny), and extends further only if the real data needs it.
function fiveDayTicks(maxValue) {
  const MIN_TOP = 20;
  const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;
  const topTick = Math.max(MIN_TOP, Math.ceil(safeMax / 5) * 5);
  const ticks = [];
  for (let t = 0; t <= topTick; t += 5) ticks.push(t);
  return ticks;
}

// Formats a "days" value the readable way — minutes for very short
// times, hours for under a day, days once it's a full day or more.
// So "Marketing took 4 hours" shows as "4.0h", not an unreadable
// "0.17" on a days-based axis.
function formatDuration(days) {
  if (days == null) return '—';
  const hours = days * 24;
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  if (days < 1) {
    return `${hours.toFixed(1)}h`;
  }
  return `${days.toFixed(1)}d`;
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
  const stageTicks = fiveDayTicks(Math.max(0, ...stageData.map((d) => d.days)));

  // "Trim performance" — grouped by packaging category (Ribbon,
  // Label, etc.) instead of by vendor. Only the avg turnaround (days)
  // is plotted. Shows EVERY enabled category, not just the ones with
  // data — categories with no completed artwork yet get a 0-day bar
  // (and a "no data yet" tooltip), so the chart always covers the
  // full product range.
  const trimByCategory = {};
  (stats.trim_performance || []).forEach((t) => {
    trimByCategory[t.trim] = t.avg_turnaround_days;
  });
  const trimData = Object.keys(TRIM_LABELS).map((category) => ({
    trim: TRIM_LABELS[category],
    days: trimByCategory[category] ?? 0,
    hasData: trimByCategory[category] != null,
  }));
  const trimTicks = fiveDayTicks(Math.max(0, ...trimData.map((d) => d.days)));

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

          {/* Trim performance */}
          <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <PanelHeader
              title="Trim performance"
              subtitle="Avg. turnaround by trim/category, on a 0–5–10–15–20 day scale"
            />

            {trimData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">No trim data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={trimData} margin={{ top: 20, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="trim" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis
                    domain={[0, trimTicks[trimTicks.length - 1]]}
                    ticks={trimTicks}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
                          <p className="font-medium text-gray-700">{label}</p>
                          <p className="text-gray-500">
                            {payload[0].payload.hasData ? `${formatDuration(payload[0].value)} avg turnaround` : 'No completed artwork yet'}
                          </p>
                        </div>
                      ) : null
                    }
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="days" name="Avg turnaround" fill={ACCENT.navy} radius={[3, 3, 0, 0]} barSize={36}>
                    <LabelList dataKey="days" position="top" formatter={formatDuration} style={{ fontSize: 12, fill: '#4A5A73' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Avg review time by stage */}
          <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <PanelHeader
              title="Avg. review time by stage"
              subtitle="Mean time spent per stage, on a 0–5–10–15–20 day scale"
            />

            {stageData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">No stage data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(280, stageData.length * 34)}>
                <BarChart
                  data={stageData}
                  layout="vertical"
                  margin={{ top: 0, right: 36, left: 0, bottom: 0 }}
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
                          <p className="text-gray-500">{formatDuration(payload[0].value)} avg</p>
                        </div>
                      ) : null
                    }
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="days" radius={[0, 3, 3, 0]} barSize={20}>
                    {stageData.map((entry, i) => (
                      <Cell key={i} fill={entry.isBottleneck ? ACCENT.red : ACCENT.slate} />
                    ))}
                    <LabelList dataKey="days" position="right" formatter={formatDuration} style={{ fontSize: 12, fill: '#4A5A73' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ArtworkPerformanceDashboard;