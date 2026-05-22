const fs = require('fs');

// We have the raw code, let's extract the sync queue part and fix the regex
const codeRaw = fs.readFileSync('legacy_script.js', 'utf8');

// Use a simpler approach to find the start and end of processSyncQueue
const startIndex = codeRaw.indexOf('async function processSyncQueue() {');
if (startIndex !== -1) {
    // Find the matching end brace
    let braceCount = 0;
    let endIndex = -1;
    let started = false;

    for (let i = startIndex; i < codeRaw.length; i++) {
        if (codeRaw[i] === '{') {
            braceCount++;
            started = true;
        } else if (codeRaw[i] === '}') {
            braceCount--;
        }

        if (started && braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }

    if (endIndex !== -1) {
        let code = codeRaw.substring(startIndex, endIndex);

        code = code.replace(/async function processSyncQueue\(\)/g, 'export async function processSyncQueue(getAppState, updateAppState, showToast, renderSyncStatus)');
        code = code.replace(/state\.syncQueue/g, 'getAppState().syncQueue');
        code = code.replace(/state\.auth/g, 'getAppState().auth');
        code = code.replace(/saveSyncQueue\(\)/g, 'updateAppState({ syncQueue: getAppState().syncQueue })');
        code = `import { apiCall } from './db.js';\nlet _isSyncProcessing = false;\n\n` + code;

        fs.writeFileSync('src/services/sync.js', code);
        console.log("Successfully extracted sync.js");
    } else {
        console.error("Could not find matching end brace for processSyncQueue");
    }
} else {
    console.error("Could not find start of processSyncQueue");
}
