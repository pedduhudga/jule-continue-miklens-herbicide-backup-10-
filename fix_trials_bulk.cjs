const fs = require('fs');

let code = fs.readFileSync('src/pages/Trials.jsx', 'utf8');

const replacement = `
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

  const handleBulkDelete = async () => {
      if(!window.confirm(\`Delete \${selectedForBulk.size} trials?\`)) return;
      const idsToDelete = Array.from(selectedForBulk);
      const newTrials = state.trials.filter(t => !idsToDelete.includes(t.ID));
      updateState({ trials: newTrials });
      clearBulkSelection();

      try {
         // Assuming backend supports a batch delete or we loop it
         for(const id of idsToDelete) {
             await deleteTrial({ ID: id }, getAppState);
         }
         window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: \`\${idsToDelete.length} trials deleted\`, type: 'success' } }));
      } catch(e) {
         window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to delete some trials', type: 'error' } }));
      }
  };

  const openTrialDetail = (trial) => {
`;

code = code.replace(/const \[activeTrial, setActiveTrial\] = useState\(null\);\s*const \[isDetailModalOpen, setIsDetailModalOpen\] = useState\(false\);\s*const \[isCameraOpen, setIsCameraOpen\] = useState\(false\);\s*const openTrialDetail = \(trial\) => \{/, replacement);

const trialCardBodyRegex = /const TrialCard = \(\{ trial \}\) => \{[\s\S]*?return \(\s*<div/;

const newCardTop = `
  const TrialCard = ({ trial }) => {
    const efficacyData = safeJsonParse(trial.EfficacyDataJSON, []);
    const isCompleted = trial.IsCompleted === 'true' || trial.IsCompleted === true;
    const isSelected = selectedForBulk.has(trial.ID);

    return (
      <div
         onClick={() => toggleBulkSelect(trial.ID)}
         className={\`bg-white p-6 rounded-xl shadow-lg relative transition-all duration-300 hover:-translate-y-1 cursor-pointer \${isSelected ? 'border-2 border-emerald-500 ring-2 ring-emerald-200' : 'border border-transparent hover:shadow-xl hover:border-emerald-500/50'}\`}
      >
        {isSelected && (
           <div className="absolute -top-3 -left-3 bg-emerald-500 text-white rounded-full p-1 shadow-md z-10">
              <CheckCircle className="w-5 h-5" />
           </div>
        )}
        <div className="absolute top-4 right-4 flex gap-1 bg-white rounded-lg shadow-sm border p-1" onClick={e => e.stopPropagation()}>
`;

code = code.replace(/const TrialCard = \(\{ trial \}\) => \{[\s\S]*?return \(\s*<div className="bg-white p-6 rounded-xl shadow-lg relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-emerald-500\/50 flex flex-col h-full cursor-pointer">[\s\S]*?<div className="absolute top-4 right-4 flex gap-1 bg-white rounded-lg shadow-sm border p-1">/, newCardTop);

const bulkBar = `
      {selectedForBulk.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-[1000] animate-[slideInUp_0.3s_ease-out]">
            <span className="font-bold text-sm text-nowrap"><span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full mr-2">{selectedForBulk.size}</span> Selected</span>
            <div className="h-4 w-px bg-slate-600"></div>
            <div className="flex items-center gap-3">
                <button className="hover:text-emerald-400 font-medium text-sm transition flex items-center gap-1"><Activity className="h-4 w-4" /> Compare</button>
                <button className="hover:text-emerald-400 font-medium text-sm transition flex items-center gap-1"><Activity className="h-4 w-4" /> Print</button>
                <button onClick={handleBulkDelete} className="hover:text-red-400 font-medium text-sm transition flex items-center gap-1"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
            <button onClick={clearBulkSelection} className="ml-2 p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <Modal isOpen={isModalOpen}
`;

code = code.replace(/<Modal isOpen=\{isModalOpen\}/, bulkBar);

fs.writeFileSync('src/pages/Trials.jsx', code);
