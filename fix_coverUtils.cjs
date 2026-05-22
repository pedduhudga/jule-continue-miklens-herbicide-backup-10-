const fs = require('fs');

const coverRegex = /window\.computeObservationTotalCover = function[\s\S]*?return null;\s*\};\s*window\.computeControlCoverReference = function[\s\S]*?return Math\.max\(0, Math\.min\(100, pct\)\);\s*\};/;
const codeRaw = fs.readFileSync('legacy_script.js', 'utf8');

const match = coverRegex.exec(codeRaw);
if (match) {
    let code = match[0];
    code = code.replace(/window\.computeObservationTotalCover = function/g, 'export function computeObservationTotalCover');
    code = code.replace(/window\.computeControlCoverReference = function/g, 'export function computeControlCoverReference');
    code = code.replace(/window\.computeControlPercentFromCover = function/g, 'export function computeControlPercentFromCover');

    code = `import { isMixedWeedPlaceholder } from './weedUtils.js';\nimport { validateEfficacyData } from './analysisUtils.js';\nimport { safeJsonParse } from './helpers.js';\n\n` + code;
    code = code.replace(/window\.isMixedWeedPlaceholder/g, 'isMixedWeedPlaceholder');
    code = code.replace(/window\.computeObservationTotalCover/g, 'computeObservationTotalCover');
    code = code.replace(/window\.computeControlCoverReference/g, 'computeControlCoverReference');
    code = code.replace(/window\.safeJsonParse/g, 'safeJsonParse');

    // Fix state.trials reference
    code = code.replace(/function \(trial, daa\)/g, 'function (trial, daa, allTrials)');
    code = code.replace(/state\.trials/g, 'allTrials');

    fs.writeFileSync('src/utils/coverUtils.js', code);
}
