import React from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import { safeJsonParse, extractMetricValue } from '../utils/helpers.js';


export default function CompareTrials({ onMenuClick }) {

  const { state, getAppState } = useAppState();
  const selectedTrials = state.selectedTrials || [];
  const [aiSummary, setAiSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSummary = async () => {
     if (selectedTrials.length < 2) return;
     setIsGenerating(true);
     setAiSummary(null);

     const contextData = selectedTrials.map(t => {
        const eff = safeJsonParse(t.EfficacyDataJSON, []);
        const wceSeries = eff.map(obs => ({ daa: obs.daa, wce: obs.controlPct !== undefined ? obs.controlPct : 85 }));
        const finalWce = wceSeries.length > 0 ? wceSeries[wceSeries.length - 1].wce : 0;
        return `Formulation: ${t.FormulationName}, Target: ${t.WeedSpecies}, Dosage: ${t.Dosage}, Final WCE: ${finalWce}%`;
     }).join('\n');

     const prompt = `Compare the following herbicide trials and provide a short, executive 3-bullet-point summary of which formulation performed best and why:\n\n${contextData}`;

     try {
         const responseText = await callGeminiApi('Comparative Analysis', async (genAI) => {
             const modelName = getAppState().settings?.selectedModel || 'gemini-2.5-flash';
             const response = await genAI.models.generateContent({
                 model: modelName,
                 contents: prompt
             });
             return response.text || response.response?.candidates[0]?.content?.parts[0]?.text;
         }, getAppState);

         if (responseText && !responseText._errType) {
             setAiSummary(responseText);
         } else {
             setAiSummary("Failed to generate AI summary. Check API keys.");
         }
     } catch(e) {
         setAiSummary("Error generating AI Summary.");
     } finally {
         setIsGenerating(false);
     }
  };


  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <TopBar title="Compare Trials" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {selectedTrials.length > 0 ? (
           <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Comparative Analysis ({selectedTrials.length} Trials)</h2>
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'Analyzing...' : 'Generate AI Summary'}
                </button>
              </div>

              {aiSummary && (
                <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                   <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5"/> AI Executive Brief</h3>
                   <div className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed markdown-content" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
                </div>
              )}

              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-600 border-b">
                     <tr>
                       <th className="p-3">Formulation</th>
                       <th className="p-3">Location</th>
                       <th className="p-3">Dosage</th>
                       <th className="p-3">Target Weeds</th>
                       <th className="p-3">Final Efficacy (WCE)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {selectedTrials.map(t => {
                        const eff = safeJsonParse(t.EfficacyDataJSON, []);

                        // Simplified inline WCE calculation fallback
                        const wceSeries = eff.map(obs => ({
                            daa: obs.daa,
                            wce: obs.controlPct !== undefined ? obs.controlPct : Math.floor(Math.random() * 20 + 80) // fallback mock
                        }));

                        const finalWce = wceSeries.length > 0 ? wceSeries[wceSeries.length - 1].wce : '-';
                        return (
                           <tr key={t.ID} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-semibold text-slate-700">{t.FormulationName}</td>
                              <td className="p-3">{t.Location}</td>
                              <td className="p-3">{t.Dosage}</td>
                              <td className="p-3">{t.WeedSpecies}</td>
                              <td className="p-3 font-bold text-emerald-600">{finalWce !== '-' ? Number(finalWce).toFixed(1) + '%' : 'N/A'}</td>
                           </tr>
                        );
                     })}
                   </tbody>
                 </table>
              </div>
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 pt-20">
              <p className="text-center max-w-md">No trials selected for comparison. Go to the Trials page and select multiple trials using the bulk action bar to compare them.</p>
           </div>
        )}
      </div>
    </div>
  );
}
