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

export function exportTrialCardsPDF(trials, project) {
    console.log("exportTrialCardsPDF stub called");
}

export function exportTrialToPPTX(trial) {
    console.log("exportTrialToPPTX stub called");
}

export function exportCSV(data, filename) {
    console.log("exportCSV stub called");
}

export async function exportZIP(trials) {
    console.log("exportZIP stub called");
}
