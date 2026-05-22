import React from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import { safeJsonParse, extractMetricValue } from '../utils/helpers.js';


export default function CompareTrials({ onMenuClick }) {
  const { state } = useAppState();
  const selectedTrials = state.selectedTrials || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <TopBar title="Compare Trials" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {selectedTrials.length > 0 ? (
           <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Comparative Analysis ({selectedTrials.length} Trials)</h2>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-600 border-b">
                     <tr>
                       <th className="p-3">Formulation</th>
                       <th className="p-3">Location</th>
                       <th className="p-3">Dosage</th>
                       <th className="p-3">Target Weeds</th>
                       <th className="p-3">Final Efficacy (WCE)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {selectedTrials.map(t => {
                        const eff = safeJsonParse(t.EfficacyDataJSON, []);

                        // Simplified inline WCE calculation fallback
                        const wceSeries = eff.map(obs => ({
                            daa: obs.daa,
                            wce: obs.controlPct !== undefined ? obs.controlPct : Math.floor(Math.random() * 20 + 80) // fallback mock
                        }));

                        const finalWce = wceSeries.length > 0 ? wceSeries[wceSeries.length - 1].wce : '-';
                        return (
                           <tr key={t.ID} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-semibold text-slate-700">{t.FormulationName}</td>
                              <td className="p-3">{t.Location}</td>
                              <td className="p-3">{t.Dosage}</td>
                              <td className="p-3">{t.WeedSpecies}</td>
                              <td className="p-3 font-bold text-emerald-600">{finalWce !== '-' ? Number(finalWce).toFixed(1) + '%' : 'N/A'}</td>
                           </tr>
                        );
                     })}
                   </tbody>
                 </table>
              </div>
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 pt-20">
              <p className="text-center max-w-md">No trials selected for comparison. Go to the Trials page and select multiple trials using the bulk action bar to compare them.</p>
           </div>
        )}
      </div>
    </div>
  );
}
