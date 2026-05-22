import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import Modal from '../components/Modal.jsx';
import { addTrial, deleteTrial } from '../services/db.js';
import { Plus, Trash2, Edit, Copy, ChevronRight, Activity, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { safeJsonParse } from '../utils/helpers.js';

export default function Trials({ onMenuClick }) {
  const { state, updateState, getAppState } = useAppState();
  const [activeTab, setActiveTab] = useState('standard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Scaffolding just the core list for now
  const standardTrials = (state.trials || []).filter(t => !t.ProjectID);
  const rcbdTrials = (state.trials || []).filter(t => t.ProjectID);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trial?')) return;

    const newTrials = state.trials.filter(t => t.ID !== id);
    updateState({ trials: newTrials });

    try {
      await deleteTrial({ ID: id }, getAppState);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Trial deleted', type: 'success' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to delete trial', type: 'error' } }));
    }
  };

  const TrialCard = ({ trial }) => {
    const efficacyData = safeJsonParse(trial.EfficacyDataJSON, []);
    const isCompleted = trial.IsCompleted === 'true' || trial.IsCompleted === true;

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-emerald-500/50 flex flex-col h-full cursor-pointer">
        <div className="absolute top-4 right-4 flex gap-1 bg-white rounded-lg shadow-sm border p-1">
          <button className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Duplicate"><Copy className="w-4 h-4" /></button>
          <button className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(trial.ID); }} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>

        <div className="flex items-start gap-3 mb-2 pr-24">
          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
            {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 leading-tight">{trial.FormulationName || 'Unknown Formulation'}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{trial.ID}</p>
          </div>
        </div>

        <div className="space-y-2 mt-4 flex-grow">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{trial.Date ? new Date(trial.Date).toLocaleDateString() : 'No date'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="truncate">{trial.Location || 'No location'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Activity className="w-4 h-4 text-slate-400" />
            <span>Dosage: {trial.Dosage || 'N/A'}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-500">{efficacyData.length} Observations</span>
          <span className="text-emerald-600 font-bold text-sm flex items-center">View Details <ChevronRight className="h-4 w-4 ml-1" /></span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Trials" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-slate-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('standard')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'standard' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Standard Trials
            </button>
            <button
              onClick={() => setActiveTab('rcbd')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'rcbd' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              RCBD Plots
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Trial
          </button>
        </div>

        {activeTab === 'standard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {standardTrials.length > 0 ? (
              standardTrials.map(t => <TrialCard key={t.ID} trial={t} />)
            ) : (
              <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100 shadow-sm">
                No standard trials found.
              </div>
            )}
          </div>
        )}

        {activeTab === 'rcbd' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rcbdTrials.length > 0 ? (
              rcbdTrials.map(t => <TrialCard key={t.ID} trial={t} />)
            ) : (
              <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100 shadow-sm">
                No RCBD plots found.
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Trial">
        <div className="p-4 text-center">
          <p className="mb-4">Trial creation form migration in progress.</p>
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-lg">Close</button>
        </div>
      </Modal>
    </div>
  );
}
