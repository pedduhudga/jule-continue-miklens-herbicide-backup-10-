const fs = require('fs');

let code = fs.readFileSync('src/main.jsx', 'utf8');

const swCode = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
`;

code = code.replace(/import '\.\/index\.css'/g, "import './index.css'\n" + swCode);
fs.writeFileSync('src/main.jsx', code);
