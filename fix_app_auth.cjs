const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

const importReplacements = `
import Setup from './pages/Setup.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useAppState } from './hooks/useAppState.jsx';
`;

code = code.replace(/import Dashboard from '\.\/pages\/Dashboard\.jsx';/, importReplacements + "\nimport Dashboard from './pages/Dashboard.jsx';");

const appLayoutBody = `
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
`;

code = code.replace(/function AppLayout\(\) \{[\s\S]*?return \(\n    <div className="flex h-screen bg-slate-100 font-sans">/, appLayoutBody);

fs.writeFileSync('src/App.jsx', code);
