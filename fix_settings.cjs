const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.jsx', 'utf8');
code = code.replace(/import \{ testApiKey \} from '\.\.\/services\/ai\.js'; \/\/ You'd export a test function in a full implementation/g, '');
fs.writeFileSync('src/pages/Settings.jsx', code);
