import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import moment from 'moment';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';

const TERM_NUMBER_MAX = 20;
const DESCRIPTION_MAX = 255;

// Keyed by header text stripped of all whitespace/punctuation and lowercased, so
// "Terms Condition Number", "terms_condition_number", and the legacy pre-harmonization
// "termsConditionNumber" all resolve to the same field.
const HEADER_ALIASES = {
  termsconditionnumber: 'termNumber',
  description: 'description',
  tceffectivedate: 'effectiveDate',
  effectivedate: 'effectiveDate',
};

const CANONICAL_LABELS = {
  termNumber: 'Terms Condition Number',
  description: 'Description',
  effectiveDate: 'TC Effective Date',
};

const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'D/M/YYYY', 'YYYY/MM/DD'];

function normalizeHeader(h) {
  return String(h || '')
    .replace(/^﻿/, '') // strip BOM Excel sometimes prepends to the first cell
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function parseDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  const parsed = moment(str, DATE_FORMATS, true);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
}

// Maps parsed rows (array of {header: value} objects, headers already whatever case the
// file used) into {termNumber, description, effectiveDate} + a validation result per row.
function validateRows(rawRows, rawHeaders) {
  const headerMap = {};
  rawHeaders.forEach((h) => {
    const key = HEADER_ALIASES[normalizeHeader(h)];
    if (key) headerMap[key] = h;
  });

  const missingHeaders = ['termNumber', 'description', 'effectiveDate'].filter((k) => !headerMap[k]);
  if (missingHeaders.length > 0) {
    const missingLabels = missingHeaders.map((k) => CANONICAL_LABELS[k]);
    return { fatalError: `Missing required column(s): ${missingLabels.join(', ')}`, valid: [], invalid: [] };
  }

  const valid = [];
  const invalid = [];
  const seenNumbers = new Map();

  rawRows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for 0-index, +1 for header row
    const termNumber = String(row[headerMap.termNumber] ?? '').trim();
    const description = String(row[headerMap.description] ?? '').trim();
    const rawDate = row[headerMap.effectiveDate];
    const effectiveDate = parseDate(rawDate);

    const rowErrors = [];
    if (!termNumber) rowErrors.push('Terms Condition Number is required');
    else if (termNumber.length > TERM_NUMBER_MAX) rowErrors.push(`Terms Condition Number exceeds ${TERM_NUMBER_MAX} characters`);
    if (!description) rowErrors.push('Description is required');
    else if (description.length > DESCRIPTION_MAX) rowErrors.push(`Description exceeds ${DESCRIPTION_MAX} characters`);
    if (!rawDate) rowErrors.push('TC Effective Date is required');
    else if (!effectiveDate) rowErrors.push(`TC Effective Date "${rawDate}" could not be parsed`);

    if (rowErrors.length > 0) {
      invalid.push({ rowNum, termNumber, errors: rowErrors });
      return;
    }

    if (seenNumbers.has(termNumber)) {
      seenNumbers.get(termNumber).push(rowNum);
    } else {
      seenNumbers.set(termNumber, [rowNum]);
    }

    valid.push({ rowNum, termNumber, description, effectiveDate });
  });

  const duplicates = [...seenNumbers.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([termNumber, rows]) => ({ termNumber, rows }));

  return { fatalError: null, valid, invalid, duplicates };
}

function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve({ rows: res.data, headers: res.meta.fields || [] }),
        error: reject,
      });
    });
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return file.arrayBuffer().then((buf) => {
      const workbook = XLSX.read(buf, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { rows, headers };
    });
  }
  return Promise.reject(new Error('Unsupported file type. Use .csv, .xlsx, or .xls'));
}

function downloadTemplate() {
  const csv = 'Terms Condition Number,Description,TC Effective Date\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'terms-and-conditions-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function TermsBulkImport({ existingCount, onImport }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [summary, setSummary] = useState(null); // { valid, invalid, duplicates, fatalError }
  const [fileError, setFileError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setFileError(null);
    try {
      const { rows, headers } = await parseFile(file);
      if (rows.length === 0) {
        setFileError('The file has no data rows.');
        return;
      }
      const result = validateRows(rows, headers);
      if (result.fatalError) {
        setFileError(result.fatalError);
        return;
      }
      setSummary(result);
    } catch (err) {
      setFileError(err.message || 'Failed to read file');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const onBrowse = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    e.target.value = '';
  };

  const closeSummary = () => setSummary(null);

  const confirmImport = () => {
    if (!summary) return;
    onImport(summary.valid.map(({ termNumber, description, effectiveDate }) => ({
      termNumber,
      description,
      effectiveDate,
    })));
    setSummary(null);
  };

  return (
    <Box>
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          bgcolor: dragActive ? 'action.hover' : 'background.default',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadFileOutlined color="action" />
          <Typography variant="body2" color="text.secondary">
            Drag & drop a CSV or Excel file of terms here, or
          </Typography>
          <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()}>
            Browse files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".csv,.xlsx,.xls"
            onChange={onBrowse}
          />
        </Box>
        <Link component="button" type="button" variant="body2" onClick={downloadTemplate}>
          Download template
        </Link>
      </Box>
      {fileError && <Alert severity="error" sx={{ mt: 1 }}>{fileError}</Alert>}

      <Dialog open={Boolean(summary)} onClose={closeSummary} maxWidth="sm" fullWidth>
        <DialogTitle>Import terms & conditions</DialogTitle>
        <DialogContent>
          {summary && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {summary.valid.length + summary.invalid.length} row(s) found —{' '}
                {summary.valid.length} valid, {summary.invalid.length} with errors.
              </Typography>

              {existingCount > 0 && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  This will replace {existingCount} existing term(s) with {summary.valid.length} imported term(s).
                </Alert>
              )}

              {summary.duplicates?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Duplicate Terms Condition Number(s) within the file: {summary.duplicates.map((d) => d.termNumber).join(', ')}
                </Alert>
              )}

              {summary.invalid.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="error" sx={{ mt: 1 }}>Rows with errors</Typography>
                  <List dense sx={{ maxHeight: 240, overflowY: 'auto' }}>
                    {summary.invalid.map((r) => (
                      <ListItem key={r.rowNum} disableGutters>
                        <ListItemText
                          primary={`Row ${r.rowNum}${r.termNumber ? ` (${r.termNumber})` : ''}`}
                          secondary={r.errors.join('; ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSummary}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!summary || summary.valid.length === 0}
            onClick={confirmImport}
          >
            Import {summary?.valid.length || 0} valid row(s)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
