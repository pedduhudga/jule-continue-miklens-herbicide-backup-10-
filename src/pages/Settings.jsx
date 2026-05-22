import React from 'react';
import TopBar from '../components/TopBar.jsx';
import { useAppState } from '../hooks/useAppState.jsx';
import { Settings as SettingsIcon, Link, Key, CloudLightning } from 'lucide-react';

export default function Settings({ onMenuClick }) {
  const { state, updateSettings } = useAppState();

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
                <input type="text" value={state.settings?.scriptUrl || ''} readOnly className="w-full px-4 py-2 border bg-slate-50 text-slate-500 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Google Sheet ID</label>
                <input type="text" value={state.settings?.sheetId || ''} readOnly className="w-full px-4 py-2 border bg-slate-50 text-slate-500 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Drive Folder ID (Photos)</label>
                <input type="text" value={state.settings?.folderId || ''} readOnly className="w-full px-4 py-2 border bg-slate-50 text-slate-500 rounded-lg outline-none" />
              </div>
              <button className="text-sm font-bold text-red-600 hover:underline">Reset Connection (Requires Re-login)</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" /> AI API Keys
            </h3>
            <p className="text-sm text-slate-500 mb-4">Manage Gemini API keys for image analysis and text extraction. Multiple keys can be added for automatic rotation during quota limits.</p>

            <div className="space-y-3 mb-4">
              {(state.settings?.apiKeys || []).map((key, index) => (
                <div key={index} className="flex gap-2">
                  <input type="password" value={key} readOnly className="flex-1 px-4 py-2 border bg-slate-50 rounded-lg outline-none" />
                  <button className="px-3 py-2 bg-slate-200 rounded-lg text-slate-700 text-sm font-bold">Test</button>
                  <button className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-bold">Remove</button>
                </div>
              ))}
            </div>
            <button className="text-sm font-bold text-emerald-600 hover:underline">+ Add New API Key</button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <CloudLightning className="w-5 h-5 text-blue-600" /> Environment API
            </h3>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Visual Crossing Weather API Key</label>
              <input type="password" value={state.settings?.openWeatherMapKey || ''} readOnly className="w-full px-4 py-2 border bg-slate-50 text-slate-500 rounded-lg outline-none" placeholder="Optional" />
              <p className="text-xs text-slate-400 mt-1">Used for fetching historical weather data for trial plot coordinates.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
