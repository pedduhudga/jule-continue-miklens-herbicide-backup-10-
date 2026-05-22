const fs = require('fs');
const content = fs.readFileSync('legacy_index.html', 'utf-8');

// Extract the main module script
const moduleScriptRegex = /<script type="module">([\s\S]*?)<\/script>/;
const moduleMatch = moduleScriptRegex.exec(content);
if (moduleMatch) {
  fs.writeFileSync('legacy_script.js', moduleMatch[1]);
}

console.log('Extraction complete');
