import React from 'react';

const ACCENT_NAVY = '#003366';

// Placeholder shell only — no data-fetching, no charts yet. The
// planned content for this tab is listed below purely as a reminder
// of scope; nothing here is wired up until that's confirmed.
const PLANNED_METRICS = [
  'Plant-wise, Business-wise and Customer-wise artwork status',
  'Monthly artwork request volume (count)',
];

function BusinessAnalyticsDashboard() {
  return (
    <div className="w-full h-full overflow-y-auto thin-scrollbar bg-gray-50">
      <div className="h-1.5 w-full" style={{ background: ACCENT_NAVY }} />

      <div className="p-6 w-full">
        <h1 className="text-xl font-semibold text-gray-800 mb-1">Business Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">
          This tab is set up and ready — content is coming next.
        </p>

        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 max-w-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Planned for this dashboard
          </p>
          <ul className="space-y-2">
            {PLANNED_METRICS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BusinessAnalyticsDashboard;