import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import QRScanner from './components/QRScanner.jsx';
import TopBar from './components/TopBar.jsx';
import DataManagement from './pages/DataManagement.jsx';
import Settings from './pages/Settings.jsx';
import UserManagement from './pages/UserManagement.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import SmartSearch from './pages/SmartSearch.jsx';
import Analytics from './pages/Analytics.jsx';
import Reports from './pages/Reports.jsx';
import FieldMap from './pages/FieldMap.jsx';
import Trials from './pages/Trials.jsx';
import Projects from './pages/Projects.jsx';
import Ingredients from './pages/Ingredients.jsx';
import Organisations from './pages/Organisations.jsx';
import Formulations from './pages/Formulations.jsx';
import { AppStateProvider } from './hooks/useAppState.jsx';
import Sidebar from './components/Sidebar.jsx';
import BottomNav from './components/BottomNav.jsx';
import Toast from './components/Toast.jsx';
import LoadingOverlay from './components/LoadingOverlay.jsx';

import Setup from './pages/Setup.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useAppState } from './hooks/useAppState.jsx';

import CompareTrials from './pages/CompareTrials.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';



function ScannerPage({ onMenuClick }) {
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState(null);

  const handleScan = (data) => {
    setScanResult(data);
    setIsScanning(false);
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'QR Code Scanned Successfully', type: 'success' } }));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Plot Scanner" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-10 max-w-lg w-full">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-qr-code"><path d="M17 12v4a1 1 0 0 1-1 1h-4"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M17 8V7"/><path d="M21 11v1a2 2 0 0 1-2 2h-2"/><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M7 17H5a2 2 0 0 1-2-2v-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="5" height="5" rx="1"/><rect x="7" y="17" width="5" height="5" rx="1"/><path d="M8 21h2a2 2 0 0 0 2-2v-2"/><path d="M8 3h2a2 2 0 0 1 2 2v2"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Plot Scanner</h2>
          <p className="text-slate-500 mb-6">Scan QR codes attached to field plots to quickly pull up trial data, add observations, or capture photos.</p>

          {scanResult && (
            <div className="bg-slate-50 p-4 rounded-lg border mb-6 text-left">
              <p className="text-xs font-bold text-slate-500 uppercase">Last Scan Result:</p>
              <p className="font-mono text-sm break-all mt-1 text-slate-800">{scanResult}</p>
            </div>
          )}

          <button
            onClick={() => setIsScanning(true)}
            className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            Open Camera Scanner
          </button>
        </div>
      </div>

      <QRScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScan={handleScan}
      />
    </div>
  );
}


function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { state } = useAppState();
  const { isAuthenticated } = useAuth();

  const isConfigured = !!state.settings?.scriptUrl && !!state.settings?.sheetId && !!state.settings?.folderId;

  if (!isConfigured) {
    return <Setup />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans">

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        <Routes>
          <Route path="/" element={<Dashboard onMenuClick={toggleSidebar} />} />
          <Route path="/projects" element={<Projects onMenuClick={toggleSidebar} />} />
          <Route path="/scanner" element={<ScannerPage onMenuClick={toggleSidebar} />} />
          <Route path="/formulations" element={<Formulations onMenuClick={toggleSidebar} />} />
          <Route path="/trials" element={<Trials onMenuClick={toggleSidebar} />} />
          <Route path="/reports" element={<Reports onMenuClick={toggleSidebar} />} />
          <Route path="/organisations" element={<Organisations onMenuClick={toggleSidebar} />} />
          <Route path="/ingredients" element={<Ingredients onMenuClick={toggleSidebar} />} />
          <Route path="/ai-assistant" element={<AIAssistant onMenuClick={toggleSidebar} />} />
          <Route path="/analytics" element={<Analytics onMenuClick={toggleSidebar} />} />
          <Route path="/map" element={<FieldMap onMenuClick={toggleSidebar} />} />
          <Route path="/search" element={<SmartSearch onMenuClick={toggleSidebar} />} />
          <Route path="/data" element={<DataManagement onMenuClick={toggleSidebar} />} />
          <Route path="/settings" element={<Settings onMenuClick={toggleSidebar} />} />
          <Route path="/users" element={<UserManagement onMenuClick={toggleSidebar} />} />
          <Route path="/compare" element={<CompareTrials onMenuClick={toggleSidebar} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </main>

      <BottomNav onMoreClick={toggleSidebar} />
      <Toast />
      <LoadingOverlay />
    </div>
  );
}


// Platform adapter for Web (React DOM)
function WebPlatformAdapter({ children }) {
  const { updateState } = useAppState();

  React.useEffect(() => {
    // Setup the platform adapter methods in global state for hooks/services to use
    updateState({
      isOnline: navigator.onLine,
      platformAdapter: {
        showToast: (msg, type) => window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg, type } })),
        showLoading: (show) => window.dispatchEvent(new CustomEvent('app:loading', { detail: { show } })),
        renderSyncStatus: () => window.dispatchEvent(new CustomEvent('app:sync-status-update'))
      }
    });

    const handleOnline = () => {
      updateState({ isOnline: true });
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Back online! Syncing data...', type: 'info' } }));
    };

    const handleOffline = () => {
      updateState({ isOnline: false });
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Offline Mode Active', type: 'info' } }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateState]);

  return children;
}

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <WebPlatformAdapter><AppLayout /></WebPlatformAdapter>
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;
