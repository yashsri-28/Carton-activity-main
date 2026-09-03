import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer,
} from 'recharts';
import { getPerformanceStats } from '../../api/artworkApi';

const STAGE_LABELS = {
  MARKETING: 'Marketing',
  PPC: 'Packaging',
  TQM: 'TQM',
  CUSTOMER: 'Customer',
};

const ACCENT = {
  amber: '#C68A2E',
  red: '#B44B3E',
  slate: '#4A5A73',
  navy: '#003366',
};

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

  const stageData = Object.entries(stats.avg_review_time_by_department || {}).map(([key, days]) => ({
    stage: STAGE_LABELS[key] || key,
    days: -(days ?? 0),
    isBottleneck: key === stats.bottleneck_stage,
  }));

  const vendorData = (stats.vendor_performance || []).map((v) => ({
    vendor: v.vendor,
    avgTurnaround: v.avg_turnaround_days,
    revisions: v.revisions,
  }));

  return (
    <div className="w-full h-full overflow-y-auto thin-scrollbar bg-gray-50">
      <div className="h-1.5 w-full" style={{ background: ACCENT.navy }} />

      <div className="p-6 w-full">
        <h1 className="text-xl font-semibold text-gray-800 mb-1">Performance Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">
          Vendor performance, average review time by department, and the current approval bottleneck.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <StatCard
            label="First-Pass Approval Rate"
            value={stats.first_pass_approval_rate !== null ? `${stats.first_pass_approval_rate}%` : '—'}
            sub={`target ≥ 90% · ${stats.sample_size?.terminal_artworks ?? 0} completed artwork(s)`}
            accent={ACCENT.amber}
          />
          <StatCard
            label="AI Validation Failure Rate"
            value={stats.ai_validation_failure_rate !== undefined && stats.ai_validation_failure_rate !== null ? `${stats.ai_validation_failure_rate}%` : '—'}
            sub={stats.sample_size?.proofing_runs ? `${stats.sample_size.proofing_runs} proofing runs analysed` : 'AI Proofing not yet enabled'}
            accent={ACCENT.red}
          />
          <StatCard
            label="Approval Bottleneck"
            value={stats.bottleneck_stage ? (STAGE_LABELS[stats.bottleneck_stage] || stats.bottleneck_stage) : '—'}
            sub="stage with longest avg. dwell time"
            accent={ACCENT.slate}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <PanelHeader
              title="Vendor performance"
              subtitle="Avg. turnaround (days) and revision count by vendor"
            />

            {vendorData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">No vendor data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={vendorData} margin={{ top: 0, right: 8, left: -8, bottom: 0 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="vendor" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
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
              subtitle="Mean days spent per lifecycle stage"
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
                    domain={['dataMin', 0]}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(v) => Math.abs(v)}
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
                          <p className="text-gray-500">{Math.abs(payload[0].value)}d avg</p>
                        </div>
                      ) : null
                    }
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="days" radius={[3, 0, 0, 3]} barSize={20}>
                    {stageData.map((entry, i) => (
                      <Cell key={i} fill={entry.isBottleneck ? ACCENT.red : ACCENT.slate} />
                    ))}
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