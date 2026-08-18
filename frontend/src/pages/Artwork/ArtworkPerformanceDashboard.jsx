import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getPerformanceStats } from '../../api/artworkApi';

const STAGE_LABELS = { MARKETING: 'Marketing', PPC: 'Packaging (PPC)', TQM: 'TQM', CUSTOMER: 'Customer' };

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-[#003366] mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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

  return (
    <div className="p-6 w-full h-full overflow-y-auto thin-scrollbar">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">Performance Dashboard</h1>
      <p className="text-sm text-gray-500 mb-5">
        Average review time by department, first-pass approval rate, and the current approval bottleneck.
      </p>

      {/* First-Pass Approval Rate + Bottleneck — headline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <StatCard
          label="First-Pass Approval Rate"
          value={stats.first_pass_approval_rate !== null ? `${stats.first_pass_approval_rate}%` : '—'}
          sub={`Based on ${stats.sample_size.terminal_artworks} completed artwork(s)`}
        />
        <StatCard
          label="Current Approval Bottleneck"
          value={stats.bottleneck_stage ? STAGE_LABELS[stats.bottleneck_stage] : '—'}
          sub={stats.bottleneck_days !== null ? `Avg ${stats.bottleneck_days} day(s) at this stage` : 'Not enough data yet'}
        />
      </div>

      {/* Average Review Time by Department */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-medium text-gray-800 mb-3">Average Review Time by Department</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(stats.avg_review_time_by_department).map(([stage, days]) => (
            <div
              key={stage}
              className={`border rounded-md p-3 ${
                stage === stats.bottleneck_stage ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <p className="text-xs font-semibold text-gray-600 uppercase">{STAGE_LABELS[stage]}</p>
              <p className={`text-lg font-medium ${stage === stats.bottleneck_stage ? 'text-red-700' : 'text-blue-700'}`}>
                {days !== null ? `${days}d` : '—'}
              </p>
              {stage === stats.bottleneck_stage && (
                <p className="text-[10px] text-red-600 font-medium mt-1">SLOWEST STAGE</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Based on {stats.sample_size.versions_analyzed} version(s) analyzed across all artworks.
        </p>
      </div>
    </div>
  );
}

export default ArtworkPerformanceDashboard;
