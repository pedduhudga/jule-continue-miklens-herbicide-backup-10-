const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(/<script type="importmap">[\s\S]*?<\/script>/g, '');
fs.writeFileSync('index.html', code);
