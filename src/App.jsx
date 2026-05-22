import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider } from './hooks/useAppState.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import LoadingOverlay from './components/LoadingOverlay.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        <Routes>
          <Route path="/" element={<Dashboard onMenuClick={toggleSidebar} />} />
          <Route path="/projects" element={<PlaceholderPage title="Projects (RCBD)" onMenuClick={toggleSidebar} />} />
          <Route path="/scanner" element={<PlaceholderPage title="Plot Scanner" onMenuClick={toggleSidebar} />} />
          <Route path="/formulations" element={<PlaceholderPage title="Formulations" onMenuClick={toggleSidebar} />} />
          <Route path="/trials" element={<PlaceholderPage title="Trials" onMenuClick={toggleSidebar} />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports & Cards" onMenuClick={toggleSidebar} />} />
          <Route path="/organisations" element={<PlaceholderPage title="Organisations" onMenuClick={toggleSidebar} />} />
          <Route path="/ingredients" element={<PlaceholderPage title="Ingredient Costs" onMenuClick={toggleSidebar} />} />
          <Route path="/ai-assistant" element={<PlaceholderPage title="AI Assistant" onMenuClick={toggleSidebar} />} />
          <Route path="/analytics" element={<PlaceholderPage title="Analytics & Stats" onMenuClick={toggleSidebar} />} />
          <Route path="/map" element={<PlaceholderPage title="Field Map" onMenuClick={toggleSidebar} />} />
          <Route path="/search" element={<PlaceholderPage title="Smart Search" onMenuClick={toggleSidebar} />} />
          <Route path="/data" element={<PlaceholderPage title="Data Management" onMenuClick={toggleSidebar} />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" onMenuClick={toggleSidebar} />} />
          <Route path="/users" element={<PlaceholderPage title="User Management" onMenuClick={toggleSidebar} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Toast />
      <LoadingOverlay />
    </div>
  );
}

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;
