const fs = require('fs');

let code = fs.readFileSync('src/pages/Trials.jsx', 'utf8');

const importReplacement = `import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import Modal from '../components/Modal.jsx';
import { addTrial, deleteTrial, updateTrial } from '../services/db.js';
import { Plus, Trash2, Edit, Copy, ChevronRight, Activity, MapPin, Calendar, CheckCircle, Camera, Grid, Info } from 'lucide-react';
import { safeJsonParse } from '../utils/helpers.js';
import { extractMetricValue } from '../utils/helpers.js';
import { calculateDAA, toDateKey } from '../utils/dateUtils.js';
import { validateEfficacyData } from '../utils/analysisUtils.js';
import CameraCapture from '../components/CameraCapture.jsx';
import GridWeedCoverTool from '../components/GridWeedCoverTool.jsx';
`;

code = code.replace(/import React, \{ useState \} from 'react';[\s\S]*?import \{ calculateDAA, toDateKey \} from '\.\.\/utils\/dateUtils\.js';\n/, importReplacement);

// We'll append a simplified Trial Detail View to the component
// Since the full legacy HTML string is massive and relies heavily on innerHTML, we'll build a clean React implementation of the observation list

const trialDetailComponent = `
  const [activeTrial, setActiveTrial] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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
           <button className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-200">
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
`;

code = code.replace(/const handleDelete = async \(id\) => \{/g, trialDetailComponent + '\n  const handleDelete = async (id) => {');
code = code.replace(/<span className="text-emerald-600 font-bold text-sm flex items-center">View Details <ChevronRight className="h-4 w-4 ml-1" \/><\/span>/g, '<span onClick={(e) => { e.stopPropagation(); openTrialDetail(trial); }} className="text-emerald-600 font-bold text-sm flex items-center hover:underline">View Details <ChevronRight className="h-4 w-4 ml-1" /></span>');

const detailModalAppend = `
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Trial Details & Observations" maxWidth="max-w-4xl">
        {activeTrial && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-xl text-slate-800 mb-2">{activeTrial.FormulationName}</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                     <p><span className="text-slate-500">Investigator:</span> {activeTrial.InvestigatorName}</p>
                     <p><span className="text-slate-500">Date:</span> {activeTrial.Date}</p>
                     <p><span className="text-slate-500">Location:</span> {activeTrial.Location || 'N/A'}</p>
                     <p><span className="text-slate-500">Dosage:</span> {activeTrial.Dosage || 'N/A'}</p>
                     <p className="col-span-2"><span className="text-slate-500">Target Weeds:</span> {activeTrial.WeedSpecies || 'N/A'}</p>
                  </div>
               </div>
               <div className="flex flex-col gap-3">
                  <button onClick={() => setIsCameraOpen(true)} className="bg-blue-50 text-blue-700 p-4 rounded-xl border border-blue-100 font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition">
                     <Camera className="w-5 h-5" /> Capture Photo
                  </button>
                  <button className="bg-purple-50 text-purple-700 p-4 rounded-xl border border-purple-100 font-bold flex items-center justify-center gap-2 hover:bg-purple-100 transition">
                     <Grid className="w-5 h-5" /> Grid Cover Tool
                  </button>
               </div>
            </div>

            {renderObservationList(activeTrial)}
          </div>
        )}
      </Modal>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
      />
`;

code = code.replace(/<\/div>\s*<\/div>\s*<Modal isOpen=\{isModalOpen\}/, detailModalAppend + '\n      </div>\n    <Modal isOpen={isModalOpen}');

fs.writeFileSync('src/pages/Trials.jsx', code);
