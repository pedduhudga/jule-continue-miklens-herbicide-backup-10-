const fs = require('fs');

let code = `
export function safeJsonParse(str, fallback = null) {
    try {
        return str ? JSON.parse(str) : fallback;
    } catch (e) {
        return fallback;
    }
}

export function truncateText(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

export function escapeHtml(text) {
    if (!text) return '';
    // We shouldn't use document.createElement in a pure util file. Use regex replace instead.
    return text.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
`;

const metricRegex = /window\.extractMetricValue = function \([\s\S]*?return null;\s*\};/;
const codeRaw = fs.readFileSync('legacy_script.js', 'utf8');
const match = metricRegex.exec(codeRaw);
if(match) {
    let metricCode = match[0].replace(/window\.extractMetricValue = function/g, 'export function extractMetricValue');
    metricCode = metricCode.replace(/window\.canonicalizeWeedSpecies/g, 'canonicalizeWeedSpecies');
    code += `\nimport { canonicalizeWeedSpecies } from './weedUtils.js';\n` + metricCode;
}

fs.writeFileSync('src/utils/helpers.js', code);
