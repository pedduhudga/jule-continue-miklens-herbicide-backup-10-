const fs = require('fs');

let code = fs.readFileSync('src/pages/Trials.jsx', 'utf8');

const compareLogic = `
  const navigateToCompare = () => {
    const selected = state.trials.filter(t => selectedForBulk.has(t.ID));
    updateState({ selectedTrials: selected });
    window.location.hash = '/compare'; // Or use React Router navigate if imported
    // For now we will rely on a simple toast or routing
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Trials sent to comparison view. Use the sidebar to navigate.', type: 'info' } }));
  };
`;

code = code.replace(/const handleBulkDelete = async \(\) => \{/, compareLogic + '\n  const handleBulkDelete = async () => {');
code = code.replace(/<button className="hover:text-emerald-400 font-medium text-sm transition flex items-center gap-1"><Activity className="h-4 w-4" \/> Compare<\/button>/, '<button onClick={navigateToCompare} className="hover:text-emerald-400 font-medium text-sm transition flex items-center gap-1"><Activity className="h-4 w-4" /> Compare</button>');

fs.writeFileSync('src/pages/Trials.jsx', code);
