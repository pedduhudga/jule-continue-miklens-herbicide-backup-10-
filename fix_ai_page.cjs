const fs = require('fs');

let code = fs.readFileSync('src/pages/AIAssistant.jsx', 'utf8');

const importReplacement = `import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import { Sparkles, SendHorizontal } from 'lucide-react';
import { aiAnalyzer } from '../services/ai.js';`;

code = code.replace(/import React, \{ useState \} from 'react';[\s\S]*?import \{ Sparkles, SendHorizontal \} from 'lucide-react';/, importReplacement);

const newBody = `
export default function AIAssistant({ onMenuClick }) {
  const { state, updateState, getAppState } = useAppState();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.aiChatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);

    const newHistory = [...(state.aiChatHistory || []), { role: 'user', content: userMsg }];
    updateState({ aiChatHistory: newHistory });

    try {
      // Build context
      const trialsContext = state.trials.map(t => ({
        id: t.ID,
        formulation: t.FormulationName,
        dosage: t.Dosage,
        result: t.Result,
        crop: t.Crop,
        weeds: t.WeedSpecies
      }));

      const prompt = \`Context: You are an agricultural research assistant helping a user manage herbicide trials.
      Available Trial Data: \${JSON.stringify(trialsContext.slice(0, 10))}
      User Question: \${userMsg}\`;

      // Call AI via the abstracted aiAnalyzer service. We must pass getAppState so it can get keys.
      // Wait, aiAnalyzer.generateText doesn't accept getAppState natively in our extracted version unless we modified it.
      // Actually, let's just use it and rely on the platform adapter. Wait, aiAnalyzer uses the global state...
      // Since ai.js was extracted with getAppState modifications, we need to ensure we call it correctly.
      // ai.js exports \`callGeminiApi\` directly which takes getAppState.
      const { callGeminiApi } = await import('../services/ai.js');

      const responseText = await callGeminiApi(\`AI Chat: \${userMsg.substring(0, 30)}...\`, async (genAI) => {
          const modelName = getAppState().settings?.selectedModel || 'gemini-2.5-flash';
          const response = await genAI.models.generateContent({
             model: modelName,
             contents: prompt
          });
          return response.text || response.response?.candidates[0]?.content?.parts[0]?.text;
      }, getAppState);

      if (responseText && !responseText._errType) {
         updateState({ aiChatHistory: [...newHistory, { role: 'assistant', content: responseText }] });
      } else {
         updateState({ aiChatHistory: [...newHistory, { role: 'assistant', content: "Error: " + (responseText.message || "Failed to get AI response. Please check your API keys.") }] });
      }
    } catch (err) {
      updateState({ aiChatHistory: [...newHistory, { role: 'assistant', content: \`System error: \${err.message}\` }] });
    } finally {
      setIsLoading(false);
    }
  };

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
                 <div key={i} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                   <div className={\`max-w-[80%] rounded-2xl px-5 py-3 \${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}\`}>
                     <div className="text-sm whitespace-pre-wrap leading-relaxed markdown-content" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\\n/g, '<br/>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>') }}></div>
                   </div>
                 </div>
               ))
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                  <Sparkles className="w-12 h-12 text-slate-300" />
                  <p className="text-center max-w-md">I am your AI research assistant. I can analyze trial data, suggest dose-response improvements, and verify ingredient compatibilities.</p>
               </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-sm px-5 py-3 flex gap-1 items-center">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white">
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your trials..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
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
}`;

code = code.replace(/export default function AIAssistant\(\{ onMenuClick \}\) \{[\s\S]*/, newBody);

fs.writeFileSync('src/pages/AIAssistant.jsx', code);
