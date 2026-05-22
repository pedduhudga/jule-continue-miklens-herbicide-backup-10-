import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';
import pptxgen from 'pptxgenjs';

// We will implement these empty stubs for now.
// The actual logic is very tightly coupled with DOM elements (Chart.js canvas instances)
// and requires careful refactoring into React components later.
export async function exportScientificReportAsDOC(trial, state) {
    console.log("exportScientificReportAsDOC stub called");
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
