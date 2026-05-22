import React from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';

export default function Dashboard({ onMenuClick }) {
  const { state } = useAppState();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Dashboard" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="dashboard-card p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Trials</h3>
            <p className="text-3xl font-bold text-slate-800">{state.trials?.length || 0}</p>
          </div>
          <div className="dashboard-card p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Projects</h3>
            <p className="text-3xl font-bold text-slate-800">{state.projects?.length || 0}</p>
          </div>
          <div className="dashboard-card p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Formulations</h3>
            <p className="text-3xl font-bold text-slate-800">{state.formulations?.length || 0}</p>
          </div>
          <div className="dashboard-card p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Offline Queue</h3>
            <p className="text-3xl font-bold text-slate-800">{state.syncQueue?.length || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 dashboard-card">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Welcome to Herbicide Trial Manager</h2>
          <p className="text-slate-600">
            This is the modern React + Vite migration of the Herbicide Trial Manager. Use the sidebar to navigate between sections.
            Functionality will be populated module by module.
          </p>
        </div>
      </div>
    </div>
  );
}
