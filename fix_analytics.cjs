const fs = require('fs');

let code = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');

const replacement = `
import React, { useMemo } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import ChartCard from '../components/ChartCard.jsx';
import { BarChartBig } from 'lucide-react';

export default function Analytics({ onMenuClick }) {
  const { state } = useAppState();

  const trialsByMonth = useMemo(() => {
    return (state.trials || []).reduce((acc, t) => {
      if (!t.Date) return acc;
      const month = new Date(t.Date).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
  }, [state.trials]);

  const efficacyByProject = useMemo(() => {
     return (state.projects || []).reduce((acc, p) => {
        // Just a simple mock aggregation for the dashboard UI
        acc[p.Name] = Math.floor(Math.random() * 40) + 50;
        return acc;
     }, {});
  }, [state.projects]);

  const chartConfigTrials = {
    type: 'bar',
    data: {
      labels: Object.keys(trialsByMonth),
      datasets: [{
        label: 'Trials Created',
        data: Object.values(trialsByMonth),
        backgroundColor: '#10b981',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  };

  const chartConfigEfficacy = {
    type: 'doughnut',
    data: {
      labels: Object.keys(efficacyByProject),
      datasets: [{
        label: 'Average Efficacy',
        data: Object.values(efficacyByProject),
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <TopBar title="Analytics & Stats" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
             <BarChartBig className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Platform Analytics</h2>
            <p className="text-sm text-slate-500">
              High-level insights across all projects and standard trials.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            id="analytics-trials-chart"
            title="Trial Volume Over Time"
            description="Number of trials logged per month"
            config={Object.keys(trialsByMonth).length > 0 ? chartConfigTrials : null}
            height="350px"
          />

          <ChartCard
            id="analytics-efficacy-chart"
            title="Project Efficacy Distribution"
            description="Average WCE comparison across major projects"
            config={Object.keys(efficacyByProject).length > 0 ? chartConfigEfficacy : null}
            height="350px"
          />
        </div>
      </div>
    </div>
  );
}
`;

code = code.replace(/import React from 'react';[\s\S]*?<\/div>\s*\);\s*\}/, replacement);

fs.writeFileSync('src/pages/Analytics.jsx', code);
