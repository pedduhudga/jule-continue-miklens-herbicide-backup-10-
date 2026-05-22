import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import { Search, Database, Cpu } from 'lucide-react';

export default function SmartSearch({ onMenuClick }) {
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

             <div className="relative max-w-2xl mx-auto">
               <input
                 type="text"
                 placeholder="e.g. Trials showing excellent control of Amaranthus with low crop injury..."
                 className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none text-lg"
               />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
               <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                 Search
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
               <button className="w-full py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition">
                 Build / Update Index
               </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
               <div className="flex items-center gap-3 mb-4">
                  <Cpu className="w-6 h-6 text-purple-600" />
                  <h3 className="font-bold text-lg">Q&A Mode</h3>
               </div>
               <p className="text-sm text-slate-500 mb-4">
                 Ask a direct question. The system will retrieve relevant trial segments and synthesize a final answer using Gemini.
               </p>
               <button className="w-full py-2 bg-purple-50 text-purple-700 font-semibold rounded-lg hover:bg-purple-100 transition">
                 Ask a Question
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
