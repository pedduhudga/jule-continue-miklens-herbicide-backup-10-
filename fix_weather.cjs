const fs = require('fs');

const weatherRegex = /async function fetchWeather\([\s\S]*?return \{.*\};\s*\}/;
const codeRaw = fs.readFileSync('legacy_script.js', 'utf8');

const match = weatherRegex.exec(codeRaw);
if (match) {
    let code = match[0];
    code = code.replace(/async function fetchWeather\(lat, lon, date\)/g, 'export async function fetchWeather(lat, lon, date = null, getAppState)');
    code = code.replace(/state\.settings/g, 'getAppState().settings');
    fs.writeFileSync('src/services/weather.js', code);
}
