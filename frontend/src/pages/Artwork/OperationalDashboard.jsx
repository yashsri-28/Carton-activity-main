import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getOperationalStats } from '../../api/artworkApi';

// Human-readable labels for every status the ArtworkRequest model can
// be in — including LEGAL_REVIEW/COMPLIANCE_REVIEW/LAB_REVIEW, which
// the STANDARD flow can set even though they aren't in STATUS_CHOICES.
const STATUS_LABELS = {
  DRAFT: 'Draft',
  VENDOR_UPLOAD_PENDING: 'Procurement Upload Pending',
  VENDOR_UPLOADED: 'Procurement Uploaded',
  AI_VALIDATION_PENDING: 'AI Validation Pending',
  AI_VALIDATION_FAILED: 'AI Validation Failed',
  MARKETING_REVIEW: 'Marketing Review',
  PPC_REVIEW: 'PPC Review',
  TQM_REVIEW: 'TQM Review',
  LEGAL_REVIEW: 'Legal Review',
  COMPLIANCE_REVIEW: 'Compliance Review',
  LAB_REVIEW: 'Lab Review',
  CUSTOMER_REVIEW: 'Customer Review',
  PHYSICAL_SAMPLE_PENDING: 'Physical Sample Pending',
  SAMPLE_SENT: 'Sample Sent',
  SAMPLE_RECEIVED_REVIEW: 'Sample Received — Review',
  MATCODE_PENDING: 'Reference Code Pending',
  APPROVED: 'Approved',
  RELEASED: 'Released',
  REJECTED: 'Rejected',
  SAMPLE_REJECTED: 'Sample Rejected',
  ARCHIVED: 'Archived',
  OBSOLETE: 'Obsolete',
};

// Fixed left-to-right order for the workload chart.
const ROLE_ORDER = ['MARKETING', 'PROCUREMENT', 'PPC', 'TQM', 'LEGAL', 'COMPLIANCE', 'LAB', 'ADMIN'];
const ROLE_LABELS = {
  MARKETING: 'Marketing',
  PROCUREMENT: 'Procurement',
  PPC: 'PPC',
  TQM: 'TQM',
  TTQM: 'TQM',
  LEGAL: 'Legal',
  COMPLIANCE: 'Compliance',
  LAB: 'Lab',
  ADMIN: 'Customer',
};

// Only the categories currently enabled on the Packaging Specification
// form (PackagingSpecForm.jsx's CATEGORY_LABELS) — keep these two in
// sync if categories are added/removed there.
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'RIBBON', label: 'Ribbon' },
  { value: 'BW_STICKER', label: 'B&W Sticker' },
  { value: 'LABEL', label: 'Label' },
  { value: 'PAPER_PRINTED_ITEM', label: 'Paper Printed Item' },
  { value: 'OTHER', label: 'Other' },
];

const PERIOD_OPTIONS = [
  { value: '', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const ACCENT = {
  amber: '#C68A2E',
  red: '#B44B3E',
  teal: '#0F6E56',
  slate: '#4A5A73',
  navy: '#003366',
};

const WORKLOAD_COLORS = ['#003366', '#0F6E56', '#C68A2E', '#B44B3E', '#6B4FA0', '#2E7DB5', '#4A5A73', '#8C5B3E'];

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
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function OperationalDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [periodDays, setPeriodDays] = useState('');

  const hasActiveFilters = Boolean(category) || Boolean(periodDays);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (periodDays) params.period_days = periodDays;

    getOperationalStats(params)
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load operational stats.'))
      .finally(() => setLoading(false));
  }, [category, periodDays]);

  const handleResetFilters = () => {
    setCategory('');
    setPeriodDays('');
  };

  // Status breakdown — only statuses that actually have at least one
  // artwork are shown, largest count first.
  const statusData = Object.entries(stats?.status_breakdown || {})
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status: STATUS_LABELS[status] || status,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Team workload — fixed role order, only roles with pending work shown.
  const workloadData = ROLE_ORDER
    .filter((role) => (stats?.role_workload?.[role] || 0) > 0)
    .map((role) => ({
      role: ROLE_LABELS[role] || role,
      count: stats.role_workload[role],
    }));

  const summary = stats?.summary || {};

  return (
    <div className="w-full h-full overflow-y-auto thin-scrollbar bg-gray-50">
      <div className="h-1.5 w-full" style={{ background: ACCENT.navy }} />

      <div className="p-6 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 mb-1">Operational Dashboard</h1>
            <p className="text-sm text-gray-500">
              Real-time status breakdown and current team workload across all artwork requests.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Period
              </label>
              <select
                value={periodDays}
                onChange={(e) => setPeriodDays(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="text-sm font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : !stats ? (
          <div className="p-10 text-center text-gray-400">No data available.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-5 mb-6">
              <StatCard label="Total Requests" value={summary.total ?? 0} accent={ACCENT.navy} />
              <StatCard label="In Progress" value={summary.in_progress ?? 0} accent={ACCENT.amber} />
              <StatCard label="Approved" value={summary.approved ?? 0} accent={ACCENT.teal} />
              <StatCard label="Released" value={summary.released ?? 0} accent={ACCENT.slate} />
              <StatCard label="Rejected" value={summary.rejected ?? 0} accent={ACCENT.red} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <PanelHeader
                  title="Status breakdown"
                  subtitle="How many artwork requests are currently in each status"
                />
                {statusData.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No artwork data for this filter.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(280, statusData.length * 34)}>
                    <BarChart
                      data={statusData}
                      layout="vertical"
                      margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                      barCategoryGap={10}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis
                        type="category"
                        dataKey="status"
                        width={170}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
                              <p className="font-medium text-gray-700">{label}</p>
                              <p className="text-gray-500">{payload[0].value} artwork(s)</p>
                            </div>
                          ) : null
                        }
                        cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      />
                      <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={16} fill={ACCENT.navy} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <PanelHeader
                  title="Team workload"
                  subtitle="How many artwork requests are pending on each role right now"
                />
                {workloadData.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No pending work for this filter.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={workloadData} margin={{ top: 0, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="role" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm text-xs">
                              <p className="font-medium text-gray-700">{label}</p>
                              <p className="text-gray-500">{payload[0].value} artwork(s) pending</p>
                            </div>
                          ) : null
                        }
                        cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={36}>
                        {workloadData.map((entry, i) => (
                          <Cell key={i} fill={WORKLOAD_COLORS[i % WORKLOAD_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OperationalDashboard;