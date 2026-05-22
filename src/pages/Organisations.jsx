import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import { safeJsonParse } from '../utils/helpers.js';
import { Trash2 } from 'lucide-react';
import { deleteOrganisation } from '../services/db.js';

export default function Organisations({ onMenuClick }) {
  const { state, updateState, getAppState } = useAppState();

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organisation?')) return;

    // Optimistic UI Update
    const newOrgs = state.organisations.filter(o => o.ID !== id);
    updateState({ organisations: newOrgs });

    try {
      await deleteOrganisation({ ID: id }, getAppState);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Organisation deleted', type: 'success' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to delete organisation', type: 'error' } }));
    }
  };

  const sortedOrgs = [...(state.organisations || [])]
    .sort((a, b) => String(b.ID).localeCompare(String(a.ID), undefined, { numeric: true }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Organisations" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-slate-600">
            Organisations group your trials together automatically based on metadata assigned during trial creation.
          </p>
        </div>

        <div className="space-y-6">
          {sortedOrgs.length > 0 ? (
            sortedOrgs.map(org => {
              const trialIds = safeJsonParse(org.TrialIDs, []);
              const trialDetails = trialIds
                .map(id => state.trials.find(t => t.ID === id))
                .filter(Boolean)
                .sort((a, b) => new Date(b.Date) - new Date(a.Date));

              return (
                <div key={org.ID} className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                  <div className="flex justify-between items-start mb-4 border-b pb-4">
                    <h3 className="font-bold text-xl text-emerald-800">{org.Name}</h3>
                    <button
                      onClick={() => handleDelete(org.ID)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                      title="Delete Organisation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {trialDetails.length > 0 ? (
                      trialDetails.map(t => (
                        <div key={t.ID} className="border rounded-lg p-4 bg-slate-50 hover:bg-white transition-colors hover:shadow-sm">
                          <p className="font-bold text-slate-700 truncate">{t.FormulationName}</p>
                          <p className="text-xs text-slate-500 mt-1">Location: {t.Location || 'N/A'}</p>
                          <p className="text-xs text-slate-500">Date: {t.Date ? new Date(t.Date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 col-span-full">No active trials found in this organisation.</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-md p-10 text-center text-slate-500">
              No organisations created yet. Go to the Trials page to group some together.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
