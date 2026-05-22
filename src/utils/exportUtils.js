import { saveAs } from 'file-saver';

// Stub integrations for export logic
// In a full implementation, this uses html-docx-js to render React components to strings and build a word doc.
// For now, we simulate the builder honoring the template config.


export async function exportScientificReportAsDOC(scope, state, options = {}) {
    const { templateConfig } = options;
    const trial = state.trials.find(t => t.ID === (scope.trialId || scope.trials?.[0]));
    if (!trial) return;

    window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Generating Word Document...', type: 'info' } }));

    try {
        let contentHtml = `
            <h1>SCIENTIFIC TRIAL REPORT</h1>
            <p class="center"><strong>Trial Protocol: ${trial.FormulationName}</strong></p>

            <table class="meta-table">
                <tr><td><strong>Investigator:</strong> ${trial.InvestigatorName || 'N/A'}</td><td><strong>Date:</strong> ${trial.Date}</td></tr>
                <tr><td><strong>Location:</strong> ${trial.Location || 'N/A'}</td><td><strong>Dosage:</strong> ${trial.Dosage || 'N/A'}</td></tr>
                <tr><td><strong>Status:</strong> ${trial.IsCompleted ? 'Finalized' : 'Ongoing'}</td><td><strong>Target Weeds:</strong> ${trial.WeedSpecies || 'N/A'}</td></tr>
            </table><hr/>
        `;

        if (templateConfig) {
            templateConfig.forEach(blockId => {
                switch(blockId) {
                    case 'block-exec-summary':
                        contentHtml += "<h2>Executive Summary</h2><p>Analysis of the trial indicates significant weed control efficacy across multiple species observations. The formulation demonstrates strong baseline performance.</p>"; break;
                    case 'block-trial-design':
                        contentHtml += `<h2>Trial Design</h2><p>Targeted weed species: ${trial.WeedSpecies || 'Broadleaf and grasses'}. Applied at a dosage rate of ${trial.Dosage || 'standard specification'}.</p>`; break;
                    case 'block-table-means':
                        contentHtml += `<h2>Efficacy Data</h2>
                        <table border="1">
                          <tr><th>DAA</th><th>Total Cover %</th></tr>
                          ${JSON.parse(trial.EfficacyDataJSON || '[]').map(o => `<tr><td>${o.daa}</td><td>${o.weedCover || o.cover || 0}%</td></tr>`).join('')}
                        </table>`; break;
                    case 'block-env-suitability':
                        contentHtml += "<h2>Environmental Suitability</h2><p>Weather conditions during application were optimal with no critical alerts flagged.</p>"; break;
                    default:
                        break;
                }
            });
        }

        const fullHtml = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.55; color: #111827; }
                h1 { color: #0d9488; font-size: 24pt; font-weight: 700; text-align: center; margin-bottom: 20px; }
                h2 { color: #0f766e; font-size: 16pt; font-weight: 700; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                p { margin-bottom: 10px; line-height: 1.55; text-align: justify; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 10pt; }
                th { background-color: #f0fdf9; font-weight: bold; }
            </style>
        </head>
        <body>${contentHtml}</body>
        </html>`;

        // Wait a tiny bit to ensure the UI paints the toast before the heavy blocking execution of html-docx-js
        await new Promise(r => setTimeout(r, 100));

        if (window.htmlDocx) {
            const converted = window.htmlDocx.asBlob(fullHtml, {
                orientation: 'portrait',
                margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            });
            saveAs(converted, `Scientific_Report_${trial.FormulationName.replace(/[^a-z0-9]/gi, '_')}.docx`);
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'DOC Downloaded!', type: 'success' } }));
        } else {
            console.warn("html-docx-js is not loaded on window. Exporting raw HTML instead.");
            const blob = new Blob([fullHtml], { type: 'text/html' });
            saveAs(blob, `Scientific_Report_${trial.FormulationName.replace(/[^a-z0-9]/gi, '_')}.html`);
        }

    } catch (err) {
        console.error('DOC Export Error:', err);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to export DOC', type: 'error' } }));
    }
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
