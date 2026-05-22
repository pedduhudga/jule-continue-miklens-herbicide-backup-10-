const fs = require('fs');

const extractRegex = /class MultiProviderAI[\s\S]*?const aiAnalyzer = new MultiProviderAI\(\);/;
const codeRaw = fs.readFileSync('legacy_script.js', 'utf8');

const match = extractRegex.exec(codeRaw);
if (!match) { console.log('Could not find MultiProviderAI'); process.exit(1); }

let code = match[0];
code = code.replace(/class MultiProviderAI/g, 'export class MultiProviderAI');
code = code.replace(/const aiAnalyzer =/g, 'export const aiAnalyzer =');

// Import Gemini
code = `import { GoogleGenAI } from "@google/genai";\n\n` + code;

fs.writeFileSync('src/services/ai.js', code);

const enhanceRegex = /window\.enhanceWithAI = async function \([\s\S]*?\};/;
const match2 = enhanceRegex.exec(codeRaw);
if (match2) {
    let enhanceCode = match2[0].replace(/window\.enhanceWithAI = async function/g, 'export async function enhanceWithAI');
    fs.appendFileSync('src/services/ai.js', '\n\n' + enhanceCode);
}

const callGeminiRegex = /async function _callGeminiApiWithRetries[\s\S]*?function callGeminiApi\([\s\S]*?return result;\s*\}/;
const match3 = callGeminiRegex.exec(codeRaw);
if(match3) {
    let geminiCode = match3[0];
    geminiCode = geminiCode.replace(/async function _callGeminiApiWithRetries\(apiCallFunction, retries = 0\)/g, 'export async function _callGeminiApiWithRetries(apiCallFunction, getAppState, retries = 0)');
    geminiCode = geminiCode.replace(/function callGeminiApi\(description, apiCallFunction\)/g, 'export function callGeminiApi(description, apiCallFunction, getAppState)');
    geminiCode = geminiCode.replace(/state\.settings\.apiKeys/g, 'getAppState().settings.apiKeys');
    geminiCode = geminiCode.replace(/state\.settings\.currentApiKeyIndex/g, 'getAppState().settings.currentApiKeyIndex');
    geminiCode = geminiCode.replace(/state\.aiQueue/g, 'getAppState().aiQueue');
    geminiCode = geminiCode.replace(/state\.isAiQueueRunning/g, 'getAppState().isAiQueueRunning');
    geminiCode = geminiCode.replace(/_callGeminiApiWithRetries\(apiCallFunction, retries \+ 1\)/g, '_callGeminiApiWithRetries(apiCallFunction, getAppState, retries + 1)');
    geminiCode = geminiCode.replace(/_callGeminiApiWithRetries\(task.apiCallFunction\)/g, '_callGeminiApiWithRetries(task.apiCallFunction, getAppState)');
    fs.appendFileSync('src/services/ai.js', '\n\n' + geminiCode);
}
