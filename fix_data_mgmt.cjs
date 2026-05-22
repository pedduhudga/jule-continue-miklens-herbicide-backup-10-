const fs = require('fs');
let code = fs.readFileSync('src/pages/DataManagement.jsx', 'utf8');

const newCode = `import React from 'react';
import TopBar from '../components/TopBar.jsx';
import { useAppState } from '../hooks/useAppState.jsx';
import { Database, Download, Upload, Archive, Activity } from 'lucide-react';
import { exportCSV, exportZIP } from '../utils/exportUtils.js';

export default function DataManagement({ onMenuClick }) {
  const { state } = useAppState();

  const handleExportJSON = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`herbicide_backup_\${new Date().toISOString().split('T')[0]}.json\`;
    a.click();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'JSON exported successfully', type: 'success' } }));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Data Management" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Export Raw JSON</h3>
              <p className="text-sm text-slate-500 mb-3">Download a complete, uncompressed JSON dump of all trials, formulations, and ingredients for manual analysis.</p>
              <button onClick={handleExportJSON} className="text-sm font-semibold text-blue-600 hover:underline">Download JSON</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Export Complete ZIP</h3>
              <p className="text-sm text-slate-500 mb-3">Creates a ZIP file containing the JSON database alongside all downloaded trial photos.</p>
              <button onClick={() => exportZIP(state.trials)} className="text-sm font-semibold text-emerald-600 hover:underline">Generate ZIP</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Import Data</h3>
              <p className="text-sm text-slate-500 mb-3">Restore from a previous JSON backup. Warning: This will overwrite current local data.</p>
              <button className="text-sm font-semibold text-amber-600 hover:underline">Select File</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">AI Data Repair</h3>
              <p className="text-sm text-slate-500 mb-3">Run an automated sweep to detect missing efficacy values and attempt reconstruction using AI models.</p>
              <button className="text-sm font-semibold text-purple-600 hover:underline">Run Diagnostics</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
           <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
             <Database className="w-5 h-5 text-slate-500" /> Synchronization Queue
           </h3>
           <div className="bg-slate-50 rounded-lg p-8 text-center border-2 border-dashed border-slate-200">
             {state.syncQueue && state.syncQueue.length > 0 ? (
                <div className="text-slate-700">
                  <p className="font-bold">{state.syncQueue.length} items waiting to sync</p>
                </div>
             ) : (
                <p className="text-slate-500">The sync queue is currently empty. All data is securely backed up to the cloud.</p>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/DataManagement.jsx', newCode);
