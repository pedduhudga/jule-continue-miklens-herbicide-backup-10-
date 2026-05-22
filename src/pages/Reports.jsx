import React from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import { FileBox, Download } from 'lucide-react';

export default function Reports({ onMenuClick }) {
  const { state } = useAppState();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Reports & Cards" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-slate-600">
            Generate printable trial cards, regulatory DOCX reports, and PDF exports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-shadow cursor-pointer">
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <FileBox className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-lg text-slate-800 mb-2">Scientific Trial Reports (DOCX)</h3>
             <p className="text-sm text-slate-500 mb-4">Export detailed per-trial reports with efficacy charts, environmental data, and AI-generated narratives.</p>
             <button className="text-blue-600 font-semibold flex items-center gap-2 text-sm hover:underline">
               Select Trials <Download className="w-4 h-4" />
             </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-shadow cursor-pointer">
             <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <FileBox className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-lg text-slate-800 mb-2">Printable Trial Cards (PDF)</h3>
             <p className="text-sm text-slate-500 mb-4">Generate layout-optimized cards with QR codes to attach to physical plot stakes in the field.</p>
             <button className="text-emerald-600 font-semibold flex items-center gap-2 text-sm hover:underline">
               Generate Cards <Download className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
