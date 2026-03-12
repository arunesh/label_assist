import { FIELD_LABELS } from './constants.js';

export function exportToCSV(results) {
  if (!results?.fieldResults) return;

  const headers = ['Field', 'Application Value', 'Extracted Value', 'Status', 'Note'];
  const rows = results.fieldResults.map((r) => [
    FIELD_LABELS[r.field] || r.field,
    `"${(r.applicationValue || '').replace(/"/g, '""')}"`,
    `"${(r.extractedValue || '').replace(/"/g, '""')}"`,
    r.status,
    `"${(r.note || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csv, 'verification-results.csv', 'text/csv');
}

export function exportToJSON(session) {
  const json = JSON.stringify(session, null, 2);
  downloadFile(json, 'verification-session.json', 'application/json');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
