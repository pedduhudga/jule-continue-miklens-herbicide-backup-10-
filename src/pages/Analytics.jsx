import React from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import ChartCard from '../components/ChartCard.jsx';
import { BarChartBig } from 'lucide-react';

export default function Analytics({ onMenuClick }) {
  const { state } = useAppState();

  // Simple aggregation for placeholder charts
  const trialsByMonth = (state.trials || []).reduce((acc, t) => {
    if (!t.Date) return acc;
    const month = new Date(t.Date).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartConfig = {
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Analytics & Stats" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-slate-600">
            Statistical analysis engine and ANOVA calculations will be ported here.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            id="analytics-trials-chart"
            title="Trial Distribution"
            description="Number of trials created over time"
            config={Object.keys(trialsByMonth).length > 0 ? chartConfig : null}
          />

          <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-5 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
             <BarChartBig className="w-12 h-12 mb-4 text-slate-300" />
             <p className="font-semibold text-lg">More Charts Coming</p>
             <p className="text-sm">Efficacy distributions and variance plots are being migrated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
