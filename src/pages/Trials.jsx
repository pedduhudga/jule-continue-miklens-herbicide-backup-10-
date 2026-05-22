import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import Modal from '../components/Modal.jsx';
import { addTrial, deleteTrial } from '../services/db.js';
import { Plus, Trash2, Edit, Copy, ChevronRight, Activity, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { safeJsonParse } from '../utils/helpers.js';
import { extractMetricValue } from '../utils/helpers.js'; // Needed if we do full extraction
import { calculateDAA, toDateKey } from '../utils/dateUtils.js';


export default function Trials({ onMenuClick }) {
  const { state, updateState, getAppState } = useAppState();
  const [activeTab, setActiveTab] = useState('standard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Scaffolding just the core list for now

  const [formData, setFormData] = useState({
    ProjectID: '',
    FormulationName: '',
    InvestigatorName: '',
    Date: new Date().toISOString().split('T')[0],
    Location: '',
    Dosage: '',
    WeedSpecies: '',
    Result: ''
  });

  const handleOpenModal = (trial = null, isDuplicate = false) => {
    if (trial) {
      setFormData({
        ProjectID: trial.ProjectID || '',
        FormulationName: isDuplicate ? `${trial.FormulationName} (Copy)` : trial.FormulationName,
        InvestigatorName: trial.InvestigatorName || '',
        Date: isDuplicate ? new Date().toISOString().split('T')[0] : trial.Date,
        Location: trial.Location || '',
        Dosage: trial.Dosage || '',
        WeedSpecies: trial.WeedSpecies || '',
        Result: trial.Result || ''
      });
    } else {
      setFormData({
        ProjectID: '', FormulationName: '', InvestigatorName: state.auth?.user?.username || '',
        Date: new Date().toISOString().split('T')[0], Location: '', Dosage: '', WeedSpecies: '', Result: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      ID: Date.now().toString(),
      EfficacyDataJSON: '[]',
      PhotoURLs: '[]',
      WeedPhotosJSON: '[]',
      IsControl: false,
      IsCompleted: false,
      CreatedAt: new Date().toISOString()
    };

    // Auto-link formulation if exact name match found
    const formMatch = state.formulations.find(f => f.Name === payload.FormulationName);
    if (formMatch) {
      payload.FormulationID = formMatch.ID;
      payload.IngredientsJSON = formMatch.IngredientsJSON;
    } else {
      payload.IngredientsJSON = '[]';
    }

    const newTrials = [...state.trials, payload];
    updateState({ trials: newTrials });
    setIsModalOpen(false);

    try {
      await addTrial(payload, getAppState);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Trial saved', type: 'success' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to save trial', type: 'error' } }));
    }
  };

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
          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(trial, true); }} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Duplicate"><Copy className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(trial, false); }} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
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
            onClick={() => handleOpenModal()}
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
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Formulation Name</label>
              <input type="text" list="formulation-list" required value={formData.FormulationName} onChange={e => setFormData({...formData, FormulationName: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" placeholder="Select or type..." />
              <datalist id="formulation-list">
                {state.formulations.map(f => <option key={f.ID} value={f.Name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Project (RCBD) - Optional</label>
              <select value={formData.ProjectID} onChange={e => setFormData({...formData, ProjectID: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none bg-white">
                <option value="">-- None (Standard Trial) --</option>
                {state.projects.map(p => <option key={p.ID} value={p.ID}>{p.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Investigator</label>
              <input type="text" required value={formData.InvestigatorName} onChange={e => setFormData({...formData, InvestigatorName: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Application Date</label>
              <input type="date" required value={formData.Date} onChange={e => setFormData({...formData, Date: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
              <input type="text" value={formData.Location} onChange={e => setFormData({...formData, Location: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" placeholder="Field 5A" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Dosage / Treatment Details</label>
              <input type="text" value={formData.Dosage} onChange={e => setFormData({...formData, Dosage: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" placeholder="e.g. 1500 ml/ha" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Target Weed Species</label>
            <input type="text" value={formData.WeedSpecies} onChange={e => setFormData({...formData, WeedSpecies: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" placeholder="Comma separated list" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="btn-primary px-6 py-2 rounded-xl">Save Trial</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
