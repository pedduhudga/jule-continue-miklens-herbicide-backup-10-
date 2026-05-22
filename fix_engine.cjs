const fs = require('fs');

const codeRaw = fs.readFileSync('legacy_script.js', 'utf8');

const engineRegex = /class AnalysisEngine \{[\s\S]*?\};?\s*\}\s*\}/;
const matchEngine = engineRegex.exec(codeRaw);

if(matchEngine) {
    let engineCode = matchEngine[0].replace(/class AnalysisEngine/g, 'export class AnalysisEngine');
    engineCode = engineCode.replace(/window\.safeJsonParse/g, 'safeJsonParse');
    engineCode = engineCode.replace(/window\.extractMetricValue/g, 'extractMetricValue');
    engineCode = engineCode.replace(/window\.computeObservationTotalCover/g, 'computeObservationTotalCover');
    engineCode = engineCode.replace(/const engine = new AnalysisEngine\(projectId, state\);/g, ''); // Remove stray initialization

    fs.appendFileSync('src/utils/analysisUtils.js', '\n\n' + engineCode);
} else {
    // Try simpler match
    const engineRegex2 = /class AnalysisEngine[\s\S]*?\}\s*\n\n/;
    const matchEngine2 = engineRegex2.exec(codeRaw);
    if (matchEngine2) {
       let engineCode = matchEngine2[0].replace(/class AnalysisEngine/g, 'export class AnalysisEngine');
       fs.appendFileSync('src/utils/analysisUtils.js', '\n\n' + engineCode);
    }
}
