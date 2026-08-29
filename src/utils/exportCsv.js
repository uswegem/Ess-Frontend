// Small client-side CSV builder for Dashboard detail-page "Export CSV" buttons - deliberately
// not a library (no CSV-writing dependency exists in this app yet - see package.json), just
// enough quoting/escaping to be correct for the plain string/number/date values these tables
// ever contain.

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @param {{field: string, headerName: string}[]} columns
 * @param {Object[]} rows
 * @param {string} filename - without extension
 */
export function exportRowsAsCsv(columns, rows, filename) {
  const header = columns.map((c) => escapeCsvCell(c.headerName)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(row[c.field])).join(',')).join('\n');
  const csv = `${header}\n${body}`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
