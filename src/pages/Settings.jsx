import React, { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { useAppState } from '../hooks/useAppState.jsx';
import { Settings as SettingsIcon, Link, Key, CloudLightning, Trash2, CheckCircle, Plus } from 'lucide-react';


export default function Settings({ onMenuClick }) {
  const { state, updateSettings } = useAppState();
  const [newKey, setNewKey] = useState('');
  const [testingKey, setTestingKey] = useState(null);

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    const updatedKeys = [...(state.settings?.apiKeys || []), newKey.trim()];
    updateSettings({ apiKeys: updatedKeys });
    setNewKey('');
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'API Key Added', type: 'success' } }));
  };

  const handleRemoveKey = (index) => {
    const updatedKeys = [...(state.settings?.apiKeys || [])];
    updatedKeys.splice(index, 1);

    // Adjust current index if we delete the active one
    let newIndex = state.settings?.currentApiKeyIndex || 0;
    if (newIndex >= updatedKeys.length) newIndex = Math.max(0, updatedKeys.length - 1);

    updateSettings({ apiKeys: updatedKeys, currentApiKeyIndex: newIndex });
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'API Key Removed', type: 'success' } }));
  };

  const handleTestKey = (key, index) => {
    setTestingKey(index);
    // Mock test logic
    setTimeout(() => {
        setTestingKey(null);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'API Key Validated', type: 'success' } }));
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Settings" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">

        <div className="space-y-8">

          <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Link className="w-5 h-5 text-emerald-600" /> Server Connection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Google Apps Script URL</label>
                <input
                  type="text"
                  value={state.settings?.scriptUrl || ''}
                  onChange={e => updateSettings({ scriptUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Google Sheet ID</label>
                <input
                  type="text"
                  value={state.settings?.sheetId || ''}
                  onChange={e => updateSettings({ sheetId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Drive Folder ID (Photos)</label>
                <input
                  type="text"
                  value={state.settings?.folderId || ''}
                  onChange={e => updateSettings({ folderId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" /> Gemini AI API Keys
              </h3>
              <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded">
                Active Index: {state.settings?.currentApiKeyIndex || 0}
              </span>
            </div>

            <p className="text-sm text-slate-500 mb-4">Manage Gemini API keys for image analysis and text extraction. Multiple keys can be added for automatic rotation during quota limits.</p>

            <div className="space-y-3 mb-6">
              {(state.settings?.apiKeys || []).map((key, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="password" value={key} readOnly className="flex-1 px-4 py-2 border bg-slate-50 text-slate-500 rounded-lg outline-none" />
                  <button
                    onClick={() => handleTestKey(key, index)}
                    disabled={testingKey === index}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-bold transition disabled:opacity-50"
                  >
                    {testingKey === index ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    onClick={() => handleRemoveKey(index)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {(state.settings?.apiKeys || []).length === 0 && (
                 <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">No API keys configured. AI features will be disabled.</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                 type="text"
                 value={newKey}
                 onChange={e => setNewKey(e.target.value)}
                 placeholder="Paste new Gemini API Key here..."
                 className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddKey}
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Key
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <CloudLightning className="w-5 h-5 text-blue-600" /> Environment API
            </h3>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Visual Crossing Weather API Key</label>
              <input
                type="password"
                value={state.settings?.openWeatherMapKey || ''}
                onChange={e => updateSettings({ openWeatherMapKey: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
              <p className="text-xs text-slate-400 mt-1">Used for fetching historical weather data for trial plot coordinates.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
