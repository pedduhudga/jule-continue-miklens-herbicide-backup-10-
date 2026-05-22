import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import { Settings } from 'lucide-react';

export default function Setup({ onComplete }) {
  const { updateSettings } = useAppState();
  const [scriptUrl, setScriptUrl] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [folderId, setFolderId] = useState('');
  const [error, setError] = useState('');

  const handleSetupSave = (e) => {
    e.preventDefault();
    const url = scriptUrl.replace(/\s/g, '');
    const sId = sheetId.trim();
    const fId = folderId.trim();

    if (!url || !sId || !fId) {
      setError('All fields are required.');
      return;
    }

    updateSettings({ scriptUrl: url, sheetId: sId, folderId: fId });
    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">First-Time Setup</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your configuration details to connect this app to your Google Sheet.</p>
        </div>
        <form onSubmit={handleSetupSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Google Apps Script URL</label>
            <input
              type="url"
              value={scriptUrl}
              onChange={e => setScriptUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white text-sm"
              placeholder="https://script.google.com/macros/s/.../exec"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Go to Apps Script -&gt; Deploy -&gt; Manage Deployments -&gt; copy the URL</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Google Sheet ID</label>
            <input
              type="text"
              value={sheetId}
              onChange={e => setSheetId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white text-sm"
              placeholder="1aBcDeFgHiJk..."
              required
            />
            <p className="text-xs text-slate-400 mt-1">Found in the Google Sheet URL: docs.google.com/spreadsheets/d/<strong>ID</strong>/edit</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Google Drive Folder ID</label>
            <input
              type="text"
              value={folderId}
              onChange={e => setFolderId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white text-sm"
              placeholder="1xYzAbC..."
              required
            />
            <p className="text-xs text-slate-400 mt-1">Found in the Drive folder URL: drive.google.com/drive/folders/<strong>ID</strong></p>
          </div>
          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800">
            Save &amp; Continue to Login
          </button>
        </form>
      </div>
    </div>
  );
}
