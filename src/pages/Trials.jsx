import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import Modal from '../components/Modal.jsx';
import { addTrial, deleteTrial, updateTrial } from '../services/db.js';
import { Plus, Trash2, Edit, Copy, ChevronRight, Activity, MapPin, Calendar, CheckCircle, Camera, Grid, Info, Sparkles } from 'lucide-react';
import { safeJsonParse } from '../utils/helpers.js';
import { extractMetricValue } from '../utils/helpers.js';
import { calculateDAA, toDateKey } from '../utils/dateUtils.js';
import { validateEfficacyData } from '../utils/analysisUtils.js';
import CameraCapture from '../components/CameraCapture.jsx';
import GridWeedCoverTool from '../components/GridWeedCoverTool.jsx';


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



  const [activeTrial, setActiveTrial] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState(new Set());

  const toggleBulkSelect = (id) => {
     setSelectedForBulk(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
     });
  };

  const clearBulkSelection = () => setSelectedForBulk(new Set());


  const navigateToCompare = () => {
    const selected = state.trials.filter(t => selectedForBulk.has(t.ID));
    updateState({ selectedTrials: selected });
    window.location.hash = '/compare'; // Or use React Router navigate if imported
    // For now we will rely on a simple toast or routing
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Trials sent to comparison view. Use the sidebar to navigate.', type: 'info' } }));
  };

  const handleBulkDelete = async () => {
      if(!window.confirm(`Delete ${selectedForBulk.size} trials?`)) return;
      const idsToDelete = Array.from(selectedForBulk);
      const newTrials = state.trials.filter(t => !idsToDelete.includes(t.ID));
      updateState({ trials: newTrials });
      clearBulkSelection();

      try {
         // Assuming backend supports a batch delete or we loop it
         for(const id of idsToDelete) {
             await deleteTrial({ ID: id }, getAppState);
         }
         window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: `${idsToDelete.length} trials deleted`, type: 'success' } }));
      } catch(e) {
         window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to delete some trials', type: 'error' } }));
      }
  };


  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [obsFormData, setObsFormData] = useState({ daa: '', date: new Date().toISOString().split('T')[0], weedCover: '', notes: '' });

  const handleFinalizeTrial = async () => {
     if(!activeTrial) return;
     if(!window.confirm('Mark this trial as finalized?')) return;

     const updated = { ...activeTrial, IsCompleted: true };
     updateState({ trials: state.trials.map(t => t.ID === updated.ID ? updated : t) });
     setActiveTrial(updated);

     try {
       await updateTrial({ ID: updated.ID, IsCompleted: true }, getAppState);
       window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Trial finalized', type: 'success' } }));
     } catch(e) {
       window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to finalize trial', type: 'error' } }));
     }
  };

  const handleSaveObservation = async (e) => {
     e.preventDefault();
     if(!activeTrial) return;

     const efficacyData = safeJsonParse(activeTrial.EfficacyDataJSON, []);
     const newObs = {
        daa: Number(obsFormData.daa),
        date: obsFormData.date,
        weedCover: Number(obsFormData.weedCover),
        notes: obsFormData.notes,
        weedDetails: [{ species: 'Total', cover: Number(obsFormData.weedCover), status: '', notes: obsFormData.notes }]
     };

     efficacyData.push(newObs);
     efficacyData.sort((a,b) => a.daa - b.daa);

     const updated = { ...activeTrial, EfficacyDataJSON: JSON.stringify(efficacyData) };
     updateState({ trials: state.trials.map(t => t.ID === updated.ID ? updated : t) });
     setActiveTrial(updated);
     setIsObservationModalOpen(false);

     try {
       await updateTrial({ ID: updated.ID, EfficacyDataJSON: updated.EfficacyDataJSON }, getAppState);
       window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Observation saved', type: 'success' } }));
     } catch(err) {
       window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to save observation', type: 'error' } }));
     }
  };

  const openTrialDetail = (trial) => {

    setActiveTrial(trial);
    setIsDetailModalOpen(true);
  };

  const handleCapturePhoto = async (dataUrl) => {
     if(!activeTrial) return;
     window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Photo captured! Processing...', type: 'info' } }));

     const photos = safeJsonParse(activeTrial.PhotoURLs, []);
     photos.push({
         fileData: dataUrl,
         date: new Date().toISOString(),
         label: 'Field Observation',
         identifications: []
     });

     const updatedTrial = { ...activeTrial, PhotoURLs: JSON.stringify(photos) };

     // Optimistic update
     const newTrials = state.trials.map(t => t.ID === updatedTrial.ID ? updatedTrial : t);
     updateState({ trials: newTrials });
     setActiveTrial(updatedTrial);

     try {
       await updateTrial({ ID: updatedTrial.ID, PhotoURLs: updatedTrial.PhotoURLs }, getAppState);
     } catch(e) {
       window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to save photo', type: 'error' } }));
     }
  };

  const renderObservationList = (trial) => {
     const efficacyData = validateEfficacyData(safeJsonParse(trial.EfficacyDataJSON, []));

     return (
       <div className="mt-6">
         <div className="flex justify-between items-center mb-4">
           <h4 className="text-lg font-semibold text-slate-800">Observation Timeline</h4>
           <button onClick={() => { setObsFormData({ daa: '', date: new Date().toISOString().split('T')[0], weedCover: '', notes: '' }); setIsObservationModalOpen(true); }} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-200">
             + Log Observation
           </button>
         </div>

         {efficacyData.length > 0 ? (
           <div className="space-y-4">
             {efficacyData.map((obs, idx) => (
               <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm">
                 <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                   <div className="flex items-center gap-2">
                     <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded text-xs">DAA {obs.daa || 0}</span>
                     <span className="text-sm text-slate-500">{obs.date ? new Date(obs.date).toLocaleDateString() : 'No date'}</span>
                   </div>
                   <div className="flex gap-2">
                     <button className="text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                     <button className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-slate-50 p-3 rounded-lg text-center">
                     <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Cover</p>
                     <p className="text-lg font-bold text-slate-800">{obs.weedCover || 0}%</p>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-lg text-center">
                     <p className="text-xs text-slate-500 uppercase font-bold mb-1">Control</p>
                     <p className="text-lg font-bold text-emerald-600">{obs.controlPct !== undefined ? obs.controlPct + '%' : '-'}</p>
                   </div>
                   <div className="col-span-2 bg-slate-50 p-3 rounded-lg">
                     <p className="text-xs text-slate-500 uppercase font-bold mb-1">Species Breakdown</p>
                     <ul className="text-sm">
                       {(obs.weedDetails || []).map((wd, wIdx) => (
                         <li key={wIdx} className="flex justify-between">
                           <span className="truncate pr-2">{wd.species || 'Unknown'}</span>
                           <span className="font-semibold text-slate-700">{wd.cover}%</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No observations logged yet. Track weed cover over time to evaluate efficacy.
           </div>
         )}
       </div>
     );
  };

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
    const isSelected = selectedForBulk.has(trial.ID);

    return (
      <div
         onClick={() => toggleBulkSelect(trial.ID)}
         className={`bg-white p-6 rounded-xl shadow-lg relative transition-all duration-300 hover:-translate-y-1 cursor-pointer ${isSelected ? 'border-2 border-emerald-500 ring-2 ring-emerald-200' : 'border border-transparent hover:shadow-xl hover:border-emerald-500/50'}`}
      >
        {isSelected && (
           <div className="absolute -top-3 -left-3 bg-emerald-500 text-white rounded-full p-1 shadow-md z-10">
              <CheckCircle className="w-5 h-5" />
           </div>
        )}
        <div className="absolute top-4 right-4 flex gap-1 bg-white rounded-lg shadow-sm border p-1" onClick={e => e.stopPropagation()}>

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
          <span onClick={(e) => { e.stopPropagation(); openTrialDetail(trial); }} className="text-emerald-600 font-bold text-sm flex items-center hover:underline">View Details <ChevronRight className="h-4 w-4 ml-1" /></span>
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


      {selectedForBulk.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-[1000] animate-[slideInUp_0.3s_ease-out]">
            <span className="font-bold text-sm text-nowrap"><span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full mr-2">{selectedForBulk.size}</span> Selected</span>
            <div className="h-4 w-px bg-slate-600"></div>
            <div className="flex items-center gap-3">
                <button onClick={navigateToCompare} className="hover:text-emerald-400 font-medium text-sm transition flex items-center gap-1"><Activity className="h-4 w-4" /> Compare</button>
                <button className="hover:text-emerald-400 font-medium text-sm transition flex items-center gap-1"><Activity className="h-4 w-4" /> Print</button>
                <button onClick={handleBulkDelete} className="hover:text-red-400 font-medium text-sm transition flex items-center gap-1"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
            <button onClick={clearBulkSelection} className="ml-2 p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <Modal isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)} title="New Trial">
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

      <Modal isOpen={isObservationModalOpen} onClose={() => setIsObservationModalOpen(false)} title="Log Observation">
         <form onSubmit={handleSaveObservation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Days After App (DAA)</label>
                  <input type="number" required value={obsFormData.daa} onChange={e => setObsFormData({...obsFormData, daa: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" required value={obsFormData.date} onChange={e => setObsFormData({...obsFormData, date: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
               </div>
            </div>
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1">Weed Cover %</label>
               <input type="number" required min="0" max="100" value={obsFormData.weedCover} onChange={e => setObsFormData({...obsFormData, weedCover: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
               <textarea value={obsFormData.notes} onChange={e => setObsFormData({...obsFormData, notes: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" rows="3"></textarea>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t">
               <button type="button" onClick={() => setIsObservationModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
               <button type="submit" className="btn-primary px-6 py-2 rounded-xl">Save</button>
            </div>
         </form>
      </Modal>

    </div>
  );
}