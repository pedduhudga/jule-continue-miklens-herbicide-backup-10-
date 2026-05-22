const fs = require('fs');

const dateRegex = /window\.toDateKey = function[\s\S]*?return Math\.max\(0, daa\);\s*\} catch \(e\) \{\s*console\.error\('\[DAA\] Calculation failed:', e\);\s*return 0;\s*\}\s*\};/;
const codeRaw = fs.readFileSync('legacy_script.js', 'utf8');

const match = dateRegex.exec(codeRaw);
if (match) {
    let code = match[0];
    code = code.replace(/window\.toDateKey = function/g, 'export function toDateKey');
    code = code.replace(/window\.calculateDAA = function/g, 'export function calculateDAA');
    code = code.replace(/window\.toDateKey/g, 'toDateKey');
    fs.writeFileSync('src/utils/dateUtils.js', code);
}
