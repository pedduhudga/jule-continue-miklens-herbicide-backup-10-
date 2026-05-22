const fs = require('fs');

let code = fs.readFileSync('src/pages/Projects.jsx', 'utf8');

const importReplacement = `import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import Modal from '../components/Modal.jsx';
import { addProject, deleteProject } from '../services/db.js';
import { Plus, Trash2, Layers, Beaker, Activity, ChevronRight, ArrowLeft } from 'lucide-react';
import { safeJsonParse } from '../utils/helpers.js';
import { AnalysisEngine } from '../utils/analysisUtils.js';`;

code = code.replace(/import React, \{ useState \} from 'react';[\s\S]*?import \{ safeJsonParse \} from '\.\.\/utils\/helpers\.js';/, importReplacement);

// We'll replace the entire `openProjectDashboard` implementation to actually show the dashboard instead of a toast
// and conditionally render either the project list or the dashboard view.

const componentBody = `
export default function Projects({ onMenuClick }) {
  const { state, updateState, getAppState } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  const [formData, setFormData] = useState({
    Name: '', Metric: 'Weed Control Efficiency', TargetWeed: '', Crop: '', Location: ''
  });

  const projects = state.projects || [];
  const activeProject = activeProjectId ? projects.find(p => p.ID === activeProjectId) : null;

  // Run analysis when a project is selected
  useEffect(() => {
    if (activeProjectId) {
      const runAnalysis = async () => {
        try {
          const engine = new AnalysisEngine(activeProjectId, state);
          const results = await engine.analyze('wce');
          setAnalysisResults(results);
        } catch (e) {
          console.error("Analysis failed", e);
        }
      };
      runAnalysis();
    }
  }, [activeProjectId, state]);

  const handleOpenModal = () => {
    setFormData({ Name: '', Metric: 'Weed Control Efficiency', TargetWeed: '', Crop: '', Location: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      ID: Date.now().toString(),
      Status: 'Draft',
      CreatedAt: new Date().toISOString(),
      BlocksJSON: '[]',
      AnalysisResultsJSON: '{}',
      Conclusion: '',
      CreatedBy: state.auth?.user?.id || 'system'
    };

    const newProjects = [...state.projects, payload];
    updateState({ projects: newProjects });
    setIsModalOpen(false);

    try {
      await addProject(payload, getAppState);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Project created successfully', type: 'success' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to create project', type: 'error' } }));
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project? All associated blocks and trials will be orphaned or deleted.')) return;

    const newProjects = state.projects.filter(p => p.ID !== id);
    updateState({ projects: newProjects });

    try {
      await deleteProject({ ID: id }, getAppState);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Project deleted', type: 'success' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to delete project', type: 'error' } }));
    }
  };

  // Render Dashboard View
  if (activeProject) {
    const projectBlocks = (state.blocks || []).filter(b => b.ProjectID === activeProject.ID);
    const projectTrials = (state.trials || []).filter(t => t.ProjectID === activeProject.ID);

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        <TopBar title={activeProject.Name} onMenuClick={onMenuClick} />
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setActiveProjectId(null)}
              className="p-2 bg-white rounded-lg border shadow-sm hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{activeProject.Name} Dashboard</h2>
              <p className="text-sm text-slate-500">RCBD Analysis & Management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">

              {/* ANOVA Results Panel */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-6">
                <h3 className="font-bold text-lg text-slate-800 border-b pb-3 mb-4">Statistical Significance (ANOVA)</h3>
                {!analysisResults ? (
                  <div className="py-8 text-center text-slate-400">Running analysis engine...</div>
                ) : analysisResults.anova ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="p-3 rounded-tl-lg">Source</th>
                          <th className="p-3">DF</th>
                          <th className="p-3">SS</th>
                          <th className="p-3">MS</th>
                          <th className="p-3">F-Value</th>
                          <th className="p-3 rounded-tr-lg">P-Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-3 font-semibold text-slate-700">Treatments</td>
                          <td className="p-3">{analysisResults.anova.treatment?.df}</td>
                          <td className="p-3">{analysisResults.anova.treatment?.ss.toFixed(2)}</td>
                          <td className="p-3">{analysisResults.anova.treatment?.ms.toFixed(2)}</td>
                          <td className="p-3">{analysisResults.anova.treatment?.f.toFixed(2)}</td>
                          <td className="p-3 font-bold text-emerald-600">{analysisResults.anova.treatment?.p.toFixed(4)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-700">Blocks</td>
                          <td className="p-3">{analysisResults.anova.block?.df}</td>
                          <td className="p-3">{analysisResults.anova.block?.ss.toFixed(2)}</td>
                          <td className="p-3">{analysisResults.anova.block?.ms.toFixed(2)}</td>
                          <td className="p-3">{analysisResults.anova.block?.f.toFixed(2)}</td>
                          <td className="p-3 text-slate-500">{analysisResults.anova.block?.p.toFixed(4)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-700">Error</td>
                          <td className="p-3">{analysisResults.anova.error?.df}</td>
                          <td className="p-3">{analysisResults.anova.error?.ss.toFixed(2)}</td>
                          <td className="p-3">{analysisResults.anova.error?.ms.toFixed(2)}</td>
                          <td className="p-3">-</td>
                          <td className="p-3">-</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm border border-emerald-100 flex justify-between">
                      <span className="font-semibold">Coefficient of Variation (CV)</span>
                      <span className="font-bold">{analysisResults.anova.cv.toFixed(2)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed">
                    Insufficient data for ANOVA. Ensure blocks have complete replication data.
                  </div>
                )}
              </div>

              {/* Treatment Groupings Panel */}
              {analysisResults && analysisResults.grouping && (
                <div className="bg-white rounded-xl shadow border border-slate-100 p-6">
                  <h3 className="font-bold text-lg text-slate-800 border-b pb-3 mb-4">Treatment Efficacy Grouping (LSD)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="p-3 rounded-tl-lg">Formulation</th>
                          <th className="p-3">Mean WCE (%)</th>
                          <th className="p-3 rounded-tr-lg text-center">Significance Group</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analysisResults.grouping.map((g, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-semibold text-slate-700">{g.name || 'Unknown'}</td>
                            <td className="p-3">{g.mean.toFixed(2)}%</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 font-bold rounded-md">
                                {g.grouping}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Stats Area */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Project Scope</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex justify-between border-b pb-2"><span>Blocks</span> <span className="font-bold">{projectBlocks.length}</span></li>
                  <li className="flex justify-between border-b pb-2"><span>Total Plots</span> <span className="font-bold">{projectTrials.length}</span></li>
                  <li className="flex justify-between border-b pb-2"><span>Crop</span> <span className="font-bold">{activeProject.Crop || 'N/A'}</span></li>
                  <li className="flex justify-between border-b pb-2"><span>Location</span> <span className="font-bold truncate max-w-[120px]" title={activeProject.Location}>{activeProject.Location || 'N/A'}</span></li>
                  <li className="flex justify-between"><span>Metric</span> <span className="font-bold truncate max-w-[120px]" title={activeProject.Metric}>{activeProject.Metric}</span></li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Render List View
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Projects (RCBD)" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">All RCBD Projects</h2>
          <button
            onClick={handleOpenModal}
            className="btn-primary text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map(p => {
              const projectBlocks = (state.blocks || []).filter(b => b.ProjectID === p.ID);
              const projectTrials = (state.trials || []).filter(t => t.ProjectID === p.ID);
              const statusClass = p.Status === 'Draft' ? 'bg-amber-100 text-amber-700' : p.Status === 'Finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700';

              return (
                <div key={p.ID} onClick={() => setActiveProjectId(p.ID)} className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 truncate pr-2">{p.Name}</h3>
                      <span className={\`text-xs px-2 py-0.5 rounded-full font-semibold \${statusClass}\`}>{p.Status}</span>
                    </div>
                    <button onClick={(e) => handleDelete(e, p.ID)} className="text-slate-300 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Layers className="h-4 w-4" />
                      <span>{projectBlocks.length} Blocks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Beaker className="h-4 w-4" />
                      <span>{projectTrials.length} Plots</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Activity className="h-4 w-4" />
                      <span className="truncate">Metric: {p.Metric || 'Weed Control Efficiency'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">Created: {new Date(p.CreatedAt).toLocaleDateString()}</span>
                    <span className="text-emerald-600 font-bold text-sm flex items-center">View Dashboard <ChevronRight className="h-4 w-4 ml-1" /></span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500 mb-4">No RCBD Projects yet.</p>
              <button onClick={handleOpenModal} className="text-emerald-600 font-bold hover:underline">Create your first project</button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New RCBD Project">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
            <input type="text" required value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" placeholder="e.g., 2024 Pre-Emergent Corn Study" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
              <input type="text" value={formData.Location} onChange={e => setFormData({...formData, Location: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" placeholder="e.g., North Field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Crop</label>
              <input type="text" value={formData.Crop} onChange={e => setFormData({...formData, Crop: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" placeholder="e.g., Corn" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Target Weed Species</label>
            <input type="text" value={formData.TargetWeed} onChange={e => setFormData({...formData, TargetWeed: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none" placeholder="e.g., Amaranthus palmeri" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Metric</label>
            <select value={formData.Metric} onChange={e => setFormData({...formData, Metric: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-emerald-500 outline-none bg-white">
              <option value="Weed Control Efficiency">Weed Control Efficiency (%)</option>
              <option value="Crop Injury">Crop Injury / Phytotoxicity (%)</option>
              <option value="Yield">Yield (kg/ha)</option>
              <option value="Biomass Reduction">Biomass Reduction (%)</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="btn-primary px-6 py-2 rounded-xl">Create Project</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}`;

code = code.replace(/export default function Projects\(\{ onMenuClick \}\) \{[\s\S]*/, componentBody);

fs.writeFileSync('src/pages/Projects.jsx', code);
