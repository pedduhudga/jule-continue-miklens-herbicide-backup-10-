const fs = require('fs');
let code = fs.readFileSync('src/services/ai.js', 'utf8');

// There are duplicate declarations due to my previous append scripts. Let's clean up the end of the file.
// Everything after the actual end of MultiProviderAI needs to go.
// The real aiAnalyzer is instantiated right after MultiProviderAI.

const duplicateStart = code.lastIndexOf('export const aiAnalyzer = {');
if (duplicateStart !== -1) {
    code = code.substring(0, duplicateStart);
}

fs.writeFileSync('src/services/ai.js', code);
