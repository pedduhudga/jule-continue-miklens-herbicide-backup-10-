import { saveAs } from 'file-saver';

// Stub integrations for export logic
// In a full implementation, this uses html-docx-js to render React components to strings and build a word doc.
// For now, we simulate the builder honoring the template config.

export async function exportScientificReportAsDOC(scope, state, options = {}) {
    const { templateConfig } = options;

    console.log("Generating DOCX with the following blocks:", templateConfig);
    console.log("For Scope:", scope);

    // Create a dummy blob representing the document
    let content = "<h1>Custom Trial Report</h1>\n";

    if (templateConfig) {
        templateConfig.forEach(blockId => {
            switch(blockId) {
                case 'block-exec-summary':
                    content += "<h2>Executive Summary</h2><p>AI Narrative goes here...</p>\n"; break;
                case 'block-trial-design':
                    content += "<h2>Trial Design</h2><p>Methodology goes here...</p>\n"; break;
                case 'block-chart-wce':
                    content += "<h2>WCE Timeline</h2><p>[Chart Image Placeholder]</p>\n"; break;
                case 'block-chart-performance':
                    content += "<h2>Performance Bar Chart</h2><p>[Chart Image Placeholder]</p>\n"; break;
                case 'block-table-means':
                    content += "<h2>ANOVA Table</h2><p>[Table Placeholder]</p>\n"; break;
                case 'block-env-suitability':
                    content += "<h2>Environmental Suitability</h2><p>Index goes here...</p>\n"; break;
                case 'block-chart-dose':
                    content += "<h2>Dose Response Plot</h2><p>[Chart Image Placeholder]</p>\n"; break;
                case 'block-photos':
                    content += "<h2>Trial Photos</h2><p>[Images Placeholder]</p>\n"; break;
                default:
                    content += `<p>Unknown Block: ${blockId}</p>\n`;
            }
        });
    }

    const fullHtml = `<!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>body{font-family: Arial, sans-serif;}</style></head>
    <body>${content}</body>
    </html>`;

    // Simulate DOCX generation (using raw HTML blob for download stub)
    const blob = new Blob([fullHtml], { type: 'application/msword' });

    const projectName = state.projects.find(p => p.ID === scope.projectId)?.Name || 'Unknown_Project';
    saveAs(blob, `Custom_Report_${projectName.replace(/[^a-z0-9]/gi, '_')}.doc`);
}

export async function exportRegulatoryReportAsDOC(project, state) {
    console.log("exportRegulatoryReportAsDOC stub called");
}

export async function exportTrialCardsPDF(trials, project) {
    if (!trials || trials.length === 0) return;

    // Simple pdf generation logic equivalent
    const doc = new jsPDF();

    let y = 20;
    doc.setFontSize(16);
    doc.text('Trial Plot Cards', 20, y);
    y += 10;

    for(let i=0; i<trials.length; i++) {
        const trial = trials[i];
        if(y > 270) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(14);
        doc.text(trial.FormulationName || 'Unknown Trial', 20, y);
        y += 7;

        doc.setFontSize(10);
        doc.text(`ID: ${trial.ID}`, 20, y);
        doc.text(`Location: ${trial.Location || 'N/A'}`, 100, y);
        y += 5;
        doc.text(`Dosage: ${trial.Dosage || 'N/A'}`, 20, y);
        doc.text(`Date: ${trial.Date || 'N/A'}`, 100, y);

        y += 15;
    }

    doc.save(`Trial_Cards_${new Date().getTime()}.pdf`);
}

export function exportTrialToPPTX(trial) {
    console.log("exportTrialToPPTX stub called");
}

export function exportCSV(data, filename) {
    if (!data || !data.length) return;
    const replacer = (key, value) => value === null ? '' : value;
    const header = Object.keys(data[0]);
    const csv = [
        header.join(','),
        ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, filename + '.csv');
}

export async function exportZIP(trials) {
    if(!trials || trials.length === 0) return;

    const zip = new JSZip();

    // Add trial JSON data
    zip.file('trials_data.json', JSON.stringify(trials, null, 2));

    const imgFolder = zip.folder('photos');

    let photoCount = 0;
    trials.forEach(trial => {
       try {
           const photos = JSON.parse(trial.PhotoURLs || '[]');
           photos.forEach((photo, idx) => {
               if(photo.fileData && photo.fileData.includes('base64,')) {
                   const base64Data = photo.fileData.split('base64,')[1];
                   imgFolder.file(`${trial.ID}_photo_${idx}.jpg`, base64Data, {base64: true});
                   photoCount++;
               }
           });
       } catch(e) {}
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `Herbicide_Backup_${photoCount}_photos.zip`);
}
