const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The error happens because vite is trying to parse `<script type="module">` inside index.html
// and it sees `import { GoogleGenAI } from "@google/genai";`
// We should remove this block entirely as we're migrating everything.
// But since we want to keep the legacy index.html functionally the same, we'll configure vite to ignore it.
code = code.replace(/import \{ GoogleGenAI, Type \} from "@google\/genai";/g, '');
code = code.replace(/const \{ GoogleGenAI \} = await import\('@google\/genai'\);/g, 'const { GoogleGenAI } = window;');

fs.writeFileSync('index.html', code);
