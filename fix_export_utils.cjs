const fs = require('fs');
let code = fs.readFileSync('src/utils/exportUtils.js', 'utf8');

code = code.replace(/export function exportCSV\(data, filename\) \{[\s\S]*?\}/g, `export function exportCSV(data, filename) {
    if (!data || !data.length) return;
    const replacer = (key, value) => value === null ? '' : value;
    const header = Object.keys(data[0]);
    const csv = [
        header.join(','),
        ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\\r\\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, filename + '.csv');
}`);

fs.writeFileSync('src/utils/exportUtils.js', code);
