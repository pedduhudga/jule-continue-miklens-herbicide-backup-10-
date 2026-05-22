const fs = require('fs');

let code = fs.readFileSync('src/pages/Trials.jsx', 'utf8');

const importReplacement = `import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import Modal from '../components/Modal.jsx';
import { addTrial, deleteTrial } from '../services/db.js';
import { Plus, Trash2, Edit, Copy, ChevronRight, Activity, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { safeJsonParse } from '../utils/helpers.js';
import { extractMetricValue } from '../utils/helpers.js'; // Needed if we do full extraction
import { calculateDAA, toDateKey } from '../utils/dateUtils.js';
`;

code = code.replace(/import React, \{ useState \} from 'react';[\s\S]*?import \{ safeJsonParse \} from '\.\.\/utils\/helpers\.js';/, importReplacement);

// We will add the complex form for creating trials.

const trialFormBody = `
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
        FormulationName: isDuplicate ? \`\${trial.FormulationName} (Copy)\` : trial.FormulationName,
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
`;

code = code.replace(/const standardTrials =/g, trialFormBody + '\n  const standardTrials =');
code = code.replace(/onClick=\{\(\) => setIsModalOpen\(true\)\}/g, 'onClick={() => handleOpenModal()}');

const modalReplacement = `<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Trial">
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
      </Modal>`;

code = code.replace(/<Modal isOpen=\{isModalOpen\} onClose=\{\(\) => setIsModalOpen\(false\)\} title="New Trial">[\s\S]*?<\/Modal>/, modalReplacement);
code = code.replace(/<button className="p-1\.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Duplicate"><Copy className="w-4 h-4" \/><\/button>/g, '<button onClick={(e) => { e.stopPropagation(); handleOpenModal(trial, true); }} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Duplicate"><Copy className="w-4 h-4" /></button>');
code = code.replace(/<button className="p-1\.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" \/><\/button>/g, '<button onClick={(e) => { e.stopPropagation(); handleOpenModal(trial, false); }} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" /></button>');

fs.writeFileSync('src/pages/Trials.jsx', code);
