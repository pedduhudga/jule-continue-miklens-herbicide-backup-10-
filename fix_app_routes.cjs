const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

const importReplacement = `import CompareTrials from './pages/CompareTrials.jsx';\nimport Dashboard from './pages/Dashboard.jsx';`;

code = code.replace(/import Dashboard from '\.\/pages\/Dashboard\.jsx';/, importReplacement);

// Add the Compare Trials route if it doesn't exist. There's no placeholder for it, so we'll add it right before * route
code = code.replace(/<Route path="\*" element=\{<Navigate to="\/" replace \/>\} \/>/, '<Route path="/compare" element={<CompareTrials onMenuClick={toggleSidebar} />} />\n          <Route path="*" element={<Navigate to="/" replace />} />');

fs.writeFileSync('src/App.jsx', code);
