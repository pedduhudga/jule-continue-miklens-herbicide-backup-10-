import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import { Sparkles, SendHorizontal } from 'lucide-react';

export default function AIAssistant({ onMenuClick }) {
  const { state } = useAppState();
  const [input, setInput] = useState('');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <TopBar title="AI Assistant" onMenuClick={onMenuClick} />

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 md:p-6">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">

          <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
               <Sparkles className="w-5 h-5" />
            </div>
            <div>
               <h3 className="font-bold text-slate-800">Herbicide AI Agent</h3>
               <p className="text-xs text-slate-500">Ask questions about your trials, request efficacy predictions, or analyze ingredients.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {state.aiChatHistory && state.aiChatHistory.length > 0 ? (
               state.aiChatHistory.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                     <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                   </div>
                 </div>
               ))
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                  <Sparkles className="w-12 h-12 text-slate-300" />
                  <p className="text-center max-w-md">I am your AI research assistant. I can analyze trial data, suggest dose-response improvements, and verify ingredient compatibilities.</p>
               </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your trials..."
                className="flex-1 px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="btn-primary p-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendHorizontal className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
