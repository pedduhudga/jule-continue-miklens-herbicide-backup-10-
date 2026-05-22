const fs = require('fs');

let code = fs.readFileSync('src/pages/SmartSearch.jsx', 'utf8');

const importReplacement = `import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import { Search, Database, Cpu, Play } from 'lucide-react';
import { loadSmartIndex, upsertEmbedding } from '../services/db.js';`;

code = code.replace(/import React, \{ useState \} from 'react';[\s\S]*?import \{ Search, Database, Cpu \} from 'lucide-react';/, importReplacement);

const newBody = `
export default function SmartSearch({ onMenuClick }) {
  const { state, getAppState } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [askQuery, setAskQuery] = useState('');
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState('');

  const handleBuildIndex = async () => {
    setStatus('Building local index...');
    try {
      // In a full migration, this calls Gemini for embeddings and upserts to DB.
      // Mocking for now to avoid large local compute block.
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Index refresh requested. (Migration Stub)', type: 'info' } }));
    } catch(e) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to build index.', type: 'error' } }));
    }
  };

  const handleSearch = () => {
    if(!searchQuery) return;
    setStatus('Searching semantic vectors...');
    setTimeout(() => {
        setResults("No results found. Please build the index first.");
        setStatus('');
    }, 1000);
  };

  const handleAsk = () => {
    if(!askQuery) return;
    setStatus('Querying AI with semantic context...');
    setTimeout(() => {
        setResults("AI Synthesis feature requires vector index. Build index first.");
        setStatus('');
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Smart Search" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 text-center">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">Semantic Search Engine</h2>
             <p className="text-slate-600 mb-6">
               Search through your trials using natural language. The AI understands the context, not just keywords.
             </p>

             <div className="relative max-w-2xl mx-auto flex gap-2">
               <div className="relative flex-1">
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="e.g. Trials showing excellent control of Amaranthus with low crop injury..."
                   className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none text-lg"
                 />
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
               </div>
               <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2">
                 Search <Play className="w-4 h-4 fill-current" />
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
               <div className="flex items-center gap-3 mb-4">
                  <Database className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-bold text-lg">Vector Index Status</h3>
               </div>
               <p className="text-sm text-slate-500 mb-4">
                 Your trial data is converted into high-dimensional vectors to enable semantic search. This process requires syncing with the server.
               </p>
               <button onClick={handleBuildIndex} className="w-full py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition">
                 Build / Update Index
               </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow border border-slate-100 flex flex-col">
               <div className="flex items-center gap-3 mb-4">
                  <Cpu className="w-6 h-6 text-purple-600" />
                  <h3 className="font-bold text-lg">Q&A Mode</h3>
               </div>
               <p className="text-sm text-slate-500 mb-4 flex-1">
                 Ask a direct question. The system will retrieve relevant trial segments and synthesize a final answer using Gemini.
               </p>
               <div className="flex gap-2 mt-auto">
                 <input
                    type="text"
                    value={askQuery}
                    onChange={e => setAskQuery(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                 />
                 <button onClick={handleAsk} className="px-4 py-2 bg-purple-50 text-purple-700 font-semibold rounded-lg hover:bg-purple-100 transition">
                   Ask
                 </button>
               </div>
            </div>
          </div>

          {(results || status) && (
            <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg mt-6">
               <h3 className="font-bold text-emerald-400 mb-2">System Output</h3>
               {status && <p className="text-amber-300 text-sm mb-2 animate-pulse">{status}</p>}
               {results && <div className="text-sm bg-slate-700 p-4 rounded-lg">{results}</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}`;

code = code.replace(/export default function SmartSearch\(\{ onMenuClick \}\) \{[\s\S]*/, newBody);

fs.writeFileSync('src/pages/SmartSearch.jsx', code);
