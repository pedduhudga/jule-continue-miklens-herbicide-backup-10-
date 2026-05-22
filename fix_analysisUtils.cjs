const fs = require('fs');

const valRegex = /window\.validateEfficacyData = function \([\s\S]*?return normalized;\s*\};/;
const engineRegex = /class AnalysisEngine \{[\s\S]*?const engine = new AnalysisEngine\(projectId, state\);/;
const codeRaw = fs.readFileSync('legacy_script.js', 'utf8');

let code = '';
const matchVal = valRegex.exec(codeRaw);
if(matchVal) {
    code += matchVal[0].replace(/window\.validateEfficacyData = function/g, 'export function validateEfficacyData');
    code = code.replace(/window\.isMixedWeedPlaceholder/g, 'isMixedWeedPlaceholder');
    code = code.replace(/window\.canonicalizeWeedSpecies/g, 'canonicalizeWeedSpecies');
    code = code.replace(/window\.normalizeLifecycleSafeStatus/g, 'normalizeLifecycleSafeStatus');
}

const matchEngine = engineRegex.exec(codeRaw);
if(matchEngine) {
    let engineCode = matchEngine[0].replace(/class AnalysisEngine/g, 'export class AnalysisEngine');
    engineCode = engineCode.replace(/window\.safeJsonParse/g, 'safeJsonParse');
    engineCode = engineCode.replace(/window\.extractMetricValue/g, 'extractMetricValue');
    engineCode = engineCode.replace(/window\.computeObservationTotalCover/g, 'computeObservationTotalCover');
    engineCode = engineCode.replace(/const engine = new AnalysisEngine\(projectId, state\);/g, ''); // Remove stray initialization
    code += '\n\n' + engineCode;
}

code = `import { isMixedWeedPlaceholder, canonicalizeWeedSpecies, normalizeLifecycleSafeStatus } from './weedUtils.js';\nimport { safeJsonParse, extractMetricValue } from './helpers.js';\nimport { computeObservationTotalCover } from './coverUtils.js';\n\n` + code;

fs.writeFileSync('src/utils/analysisUtils.js', code);
