import React, { useState } from 'react';
import ArtworkList from './ArtworkList';
import ArtworkPerformanceDashboard from './ArtworkPerformanceDashboard';

// Extensible tab config — to add a new tab in the future (e.g. a
// "Quality & Compliance" dashboard per BRD Section 12), just add one
// more entry here. Nothing else in this file needs to change, and
// none of the existing tab components (ArtworkList etc.) are touched.
const TABS = [
  { id: 'operational', label: 'Operational', component: ArtworkList },
  { id: 'performance', label: 'Performance', component: ArtworkPerformanceDashboard },
  // Example for later: { id: 'quality', label: 'Quality & Compliance', component: ArtworkQualityDashboard },
];

function ArtworkManagementTabs({ role }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || TABS[0].component;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 bg-white px-6 pt-3 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#003366] text-[#003366]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        <ActiveComponent role={role} />
      </div>
    </div>
  );
}

export default ArtworkManagementTabs;
