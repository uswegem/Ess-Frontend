import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { Paper, Typography, Box, IconButton, Tooltip, Button } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import { getDashboardDetail, getDashboardDetailPdf } from '../../services/dashboardService';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { formatCurrency, formatNumber } from '../../utils/formatAmount';
import { computeRange, loadStoredRangeSelection } from '../../utils/dashboardDateRange';
import { exportRowsAsCsv } from '../../utils/exportCsv';
import { toast } from 'react-toastify';

// Fineract-sourced date fields on detail rows are plain "yyyy-MM-dd" strings (see
// fineractIncomeSummary.js/fineractLoanRows.js) or full ISO instants for actualDisbursementDate
// (needed for range comparisons server-side). Formatting with timeZone: 'UTC' here keeps the
// displayed calendar date matching what Fineract actually recorded, regardless of the
// viewer's browser timezone - the same class of off-by-one-day bug fixed server-side for the
// income-entry dates would otherwise resurface client-side.
function formatDateCell(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // already a plain yyyy-MM-dd string
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC' });
}

const currencyColumn = (field, headerName, flex = 1) => ({
  field, headerName, flex,
  valueFormatter: (params) => formatCurrency(params.value)
});

const numberColumn = (field, headerName, flex = 1) => ({
  field, headerName, flex,
  valueFormatter: (params) => formatNumber(params.value)
});

const dateColumn = (field, headerName, flex = 1) => ({
  field, headerName, flex,
  valueFormatter: (params) => formatDateCell(params.value)
});

const BUCKET_LABELS = {
  current: 'Current',
  days_1_30: '1-30 Days',
  days_31_60: '31-60 Days',
  days_61_90: '61-90 Days',
  days_90_plus: '90+ Days',
};

// Full 19-field per-loan breakdown - see dashboardDetailService.js's delinquency-<bucket>
// case for the exact field list/sourcing (Fineract loan summary for the money figures,
// Fineract GET /v1/clients for Mobile/Email, a per-loan GET /v1/loans/{id} for Last Repayment
// Date - none of this is a Mongo join). Loan Officer intentionally omitted: confirmed
// unavailable on this Fineract deployment (no loanOfficerName/loanOfficerId field on any loan
// response). Used as-is for exportColumns (CSV) and the PDF export (dashboardDetailColumns.js
// mirrors this same full set server-side) - only the on-screen DataGrid gets a narrower view.
const DELINQUENCY_FULL_COLUMNS = [
  { field: 'loanAccountNo', headerName: 'Loan Account', flex: 1 },
  { field: 'clientName', headerName: 'Client', flex: 1.3 },
  { field: 'clientExternalId', headerName: 'NIN', flex: 1 },
  { field: 'mobileNo', headerName: 'Mobile', flex: 0.9 },
  { field: 'emailAddress', headerName: 'Email', flex: 1.2 },
  currencyColumn('principalDisbursed', 'Principal Disbursed'),
  currencyColumn('interestCharged', 'Interest Booked'),
  currencyColumn('penaltyChargesCharged', 'Penalty Booked'),
  currencyColumn('principalPaid', 'Principal Collected'),
  currencyColumn('interestPaid', 'Interest Collected'),
  currencyColumn('penaltyChargesPaid', 'Penalty Collected'),
  currencyColumn('totalCollected', 'Total Collected'),
  currencyColumn('principalOutstanding', 'Principal Outstanding'),
  currencyColumn('interestOutstanding', 'Interest Outstanding'),
  currencyColumn('penaltyChargesOutstanding', 'Penalty Outstanding'),
  currencyColumn('totalOutstanding', 'Total Outstanding'),
  numberColumn('pastDueDays', 'Days Overdue', 0.8),
  dateColumn('disbursementDate', 'Disbursement Date'),
  dateColumn('lastRepaymentDate', 'Last Repayment Date'),
];

// Display-only reduction for screen width (11 of the 19 fields) - CSV/PDF still export all
// 19 (exportColumns below / dashboardDetailColumns.js server-side). Field selection per the
// explicit column list requested: drops Email, Penalty Booked, Penalty Collected, Interest
// Outstanding, Penalty Outstanding, Disbursement Date, Last Repayment Date, NIN from the
// visible table only.
const DELINQUENCY_DISPLAY_FIELDS = [
  'loanAccountNo', 'clientName', 'mobileNo', 'principalDisbursed', 'interestCharged',
  'principalPaid', 'interestPaid', 'totalCollected', 'principalOutstanding',
  'totalOutstanding', 'pastDueDays',
];

function delinquencyBucketConfig(bucketKey) {
  return {
    title: `Delinquency Bucket - ${BUCKET_LABELS[bucketKey] || bucketKey}`,
    columns: DELINQUENCY_FULL_COLUMNS.filter((c) => DELINQUENCY_DISPLAY_FIELDS.includes(c.field)),
    exportColumns: DELINQUENCY_FULL_COLUMNS,
  };
}

// Per-metric title + DataGrid column definitions. Row shapes match dashboardDetailService.js
// exactly (backend field names used directly as DataGrid `field`s).
const METRIC_CONFIG = {
  portfolio: {
    title: 'Total Outstanding Portfolio',
    columns: [
      { field: 'loanAccountNo', headerName: 'Loan Account', flex: 1 },
      { field: 'clientName', headerName: 'Client', flex: 1.5 },
      { field: 'clientExternalId', headerName: 'NIN', flex: 1 },
      currencyColumn('principal', 'Principal'),
      currencyColumn('principalOutstanding', 'Outstanding'),
      { field: 'status', headerName: 'Status', flex: 0.8 },
    ]
  },
  par30: {
    title: 'PAR30',
    columns: [
      { field: 'loanAccountNo', headerName: 'Loan Account', flex: 1 },
      { field: 'clientName', headerName: 'Client', flex: 1.5 },
      { field: 'clientExternalId', headerName: 'NIN', flex: 1 },
      currencyColumn('principalOutstanding', 'Outstanding'),
      numberColumn('pastDueDays', 'Days Overdue', 0.8),
      { field: 'delinquencyBucket', headerName: 'Bucket', flex: 0.8, valueFormatter: (p) => BUCKET_LABELS[p.value] || p.value },
    ]
  },
  disbursed: {
    title: 'Loans Disbursed This Month',
    columns: [
      { field: 'loanAccountNo', headerName: 'Loan Account', flex: 1 },
      { field: 'clientName', headerName: 'Client', flex: 1.5 },
      { field: 'clientExternalId', headerName: 'NIN', flex: 1 },
      currencyColumn('principal', 'Principal'),
      dateColumn('disbursementDate', 'Disbursement Date', 0.8),
    ]
  },
  borrowers: {
    title: 'Active Borrowers',
    columns: [
      { field: 'clientName', headerName: 'Client', flex: 1.5 },
      { field: 'clientExternalId', headerName: 'NIN', flex: 1 },
      numberColumn('loanCount', 'Active Loans', 0.8),
      currencyColumn('totalOutstanding', 'Total Outstanding'),
    ]
  },
  'collection-rate': {
    title: 'Collection Rate',
    columns: [
      { field: 'loanAccountNo', headerName: 'Loan Account', flex: 1 },
      { field: 'clientName', headerName: 'Client', flex: 1.5 },
      { field: 'clientExternalId', headerName: 'NIN', flex: 1 },
      currencyColumn('totalRepayment', 'Repaid'),
      currencyColumn('totalExpectedRepayment', 'Expected'),
      { field: 'ratePercent', headerName: 'Rate %', flex: 0.6, valueFormatter: (p) => `${p.value}%` },
    ]
  },
  'interest-income': {
    title: 'Interest Income This Month',
    // Lifetime accrued interest per loan (Fineract's interestCharged - booked/accrued, not
    // interestPaid), same as the summary card it backs - not actually scoped to the date range
    // below, same caveat as Collection Rate's own note elsewhere on this dashboard.
    note: 'Accrued interest to date per loan (lifetime) - not scoped to the date range below.',
    columns: [
      dateColumn('date', 'Date', 0.7),
      { field: 'loanAccountNo', headerName: 'Loan Account', flex: 1 },
      { field: 'clientName', headerName: 'Client', flex: 1.5 },
      currencyColumn('amount', 'Amount'),
    ]
  },
  'fee-income': {
    title: 'Fee Income This Month',
    columns: [
      dateColumn('date', 'Date', 0.7),
      { field: 'loanAccountNo', headerName: 'Loan Account', flex: 1 },
      { field: 'clientName', headerName: 'Client', flex: 1.5 },
      currencyColumn('amount', 'Amount'),
    ]
  },
};

function getMetricConfig(metric) {
  if (metric?.startsWith('delinquency-')) {
    return delinquencyBucketConfig(metric.slice('delinquency-'.length));
  }
  return METRIC_CONFIG[metric] || { title: metric, columns: [] };
}

export default function DashboardDetail() {
  const { metric } = useParams();
  const navigate = useNavigate();
  const { tenantId } = useActiveTenant();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  const config = getMetricConfig(metric);

  // Respects whatever date range is currently active on the Dashboard (read from the same
  // sessionStorage key DateRangeControl writes to - see dashboardDateRange.js) rather than a
  // hardcoded "this month". Point-in-time metrics (portfolio, par30, borrowers,
  // delinquency-*) and Collection Rate (lifetime - see fineractPortfolioSummary.js) ignore
  // this server-side regardless of what's sent, so passing it unconditionally here is safe.
  const storedSelection = loadStoredRangeSelection();
  const range = computeRange(storedSelection.preset, storedSelection.custom);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = { ...(tenantId ? { tenantId } : {}), from: range.from, to: range.to };
        const res = await getDashboardDetail(metric, params);
        if (!cancelled) {
          setRows((res.data?.rows || []).map((r, i) => ({ id: i, ...r })));
        }
      } catch (err) {
        if (!cancelled) toast.error(err.response?.data?.message || err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [metric, tenantId, range.from, range.to]);

  const handleExportCsv = () => {
    if (!rows.length) {
      toast.info('No records to export');
      return;
    }
    // exportColumns (full field set) when a metric defines one (e.g. delinquency buckets,
    // which show a narrower set on screen than they export) - falls back to the on-screen
    // columns for every other metric, unchanged from before.
    exportRowsAsCsv(config.exportColumns || config.columns, rows, `${metric}-${range.from}-to-${range.to}`);
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const params = { ...(tenantId ? { tenantId } : {}), from: range.from, to: range.to };
      const blob = await getDashboardDetailPdf(metric, params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${metric}-${range.from}-to-${range.to}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Back to Dashboard">
            <IconButton onClick={() => navigate('/dashboard')} aria-label="Back to Dashboard" sx={{ border: '1px solid', borderColor: 'designBorder.input', borderRadius: '8px' }}>
              <ArrowBackOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h5">{config.title}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {config.note || `${storedSelection.preset}: ${range.from} to ${range.to}`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadOutlined />}
            onClick={handleExportCsv}
            disabled={loading}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PictureAsPdfOutlined />}
            onClick={handleExportPdf}
            disabled={loading || exportingPdf}
          >
            {exportingPdf ? 'Exporting…' : 'Export PDF'}
          </Button>
        </Box>
      </Box>

      <Paper>
        <DataGrid
          rows={rows}
          columns={config.columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          autoHeight
          components={{
            NoRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6 }}>
                <Box sx={{ fontSize: 24, mb: 1 }}>📄</Box>
                <Typography sx={{ fontSize: 14, color: 'text.muted' }}>No records found</Typography>
              </Box>
            ),
          }}
          sx={{
            border: 0,
            width: '100%',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAFBFC' },
          }}
        />
      </Paper>
    </div>
  );
}
