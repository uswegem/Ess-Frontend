import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { IconButton, Tooltip, Box, Typography, TextField, Button } from '@mui/material';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import { getRequest, postRequest } from '../../ApiFunction';
import API from '../../Api';
import { toast } from 'react-toastify';
import { usePermissions } from '../../hooks/usePermissions';
import { MESSAGE_TYPES, buildMessageDetails } from '../../services/messages/messageTypes';
import { formatNumber } from '../../utils/formatAmount';
import DateRangeControl from '../../components/DateRangeControl';
import { computeRange, loadStoredRangeSelection } from '../../utils/dashboardDateRange';
import { exportRowsAsCsv } from '../../utils/exportCsv';
import { debounce } from '../../utils/performance';

const NOTIFIABLE_STATUSES = ['LOAN_CREATED', 'DISBURSED', 'FAILED'];

// Every real-application status from LoanMapping's schema enum (models/LoanMapping.js),
// excluding CHARGES_CALCULATED - that one stays hidden-by-default on this page (no
// LOAN_OFFER_REQUEST received yet, not a real application), same as before this change.
const LOAN_STATUSES = [
  'INITIAL_OFFER', 'OFFER_SUBMITTED', 'INITIAL_APPROVAL_SENT', 'APPROVED',
  'FINAL_APPROVAL_RECEIVED', 'CLIENT_CREATED', 'LOAN_CREATED', 'DISBURSED',
  'COMPLETED', 'WAITING_FOR_LIQUIDATION', 'DISBURSEMENT_FAILURE_NOTIFICATION_SENT',
  'FAILED', 'REJECTED', 'CANCELLED', 'RESTRUCTURE_INITIAL_APPROVAL_SENT', 'CLOSED',
  'PAYMENT_FAILED',
];

const STATUS_COLORS = {
  DISBURSED: '#12794A',
  OFFER_SUBMITTED: '#B54708',
  LOAN_CREATED: '#1E3A8A',
  FAILED: '#B42318',
  CANCELLED: '#475467',
};

function clientDisplayName(loan) {
  const c = loan.clientData;
  if (!c) return '—';
  return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ') || c.checkNumber || '—';
}

const LoanListing = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canTrigger = can('messages:trigger');
  const canTriggerSensitive = can('messages:trigger_sensitive');

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuLoan, setMenuLoan] = useState(null);
  const [sendingType, setSendingType] = useState(null);

  const openNotifyMenu = (event, loan) => {
    setMenuAnchor(event.currentTarget);
    setMenuLoan(loan);
  };

  const closeNotifyMenu = () => {
    setMenuAnchor(null);
    setMenuLoan(null);
  };

  const sendNotification = async (messageType) => {
    if (!menuLoan) return;
    closeNotifyMenu();
    setSendingType(messageType);
    try {
      const template = MESSAGE_TYPES[messageType];
      const messageDetails = buildMessageDetails(template.messageDetails, menuLoan);
      const response = await postRequest(API.MANUAL_OUTGOING_MESSAGE, {
        MessageType: messageType,
        MessageDetails: messageDetails,
      });
      const { success, error } = response.data;
      if (!success) {
        toast.error(error || 'Failed to send notification');
        return;
      }
      toast.success('Notification sent');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message);
    } finally {
      setSendingType(null);
    }
  };

  const columns = [
    { field: 'essApplicationNumber', headerName: 'Application #', width: 160 },
    { field: 'productCode', headerName: 'Product', width: 100 },
    {
      // flex instead of a fixed width - this is the approved layout fix: the table's
      // columns previously summed to a fixed ~1390px, leaving blank space on wide screens
      // instead of filling the container (matching the pattern already used elsewhere,
      // e.g. FSP Tenants' Name column).
      field: 'clientName',
      headerName: 'Client',
      flex: 1,
      minWidth: 160,
      valueGetter: (params) => params.row.clientName,
    },
    {
      field: 'requestedAmount',
      headerName: 'Amount',
      width: 120,
      valueGetter: (params) => formatNumber(params.row.requestedAmount),
    },
    { field: 'tenure', headerName: 'Tenure (mo)', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: (params) => (
        <span style={{ color: STATUS_COLORS[params.value] || '#1A2233', fontWeight: 600, fontSize: 13 }}>
          {params.value || 'Unknown'}
        </span>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 170,
      valueGetter: (params) =>
        params.row.createdAt ? new Date(params.row.createdAt).toLocaleString() : '—',
    },
    {
      field: 'mifosLoanId',
      headerName: 'MIFOS Loan ID',
      width: 120,
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex align-items-center gap-2">
          <Tooltip title="View">
            <VisibilityOutlined
              sx={{ fontSize: 20, cursor: 'pointer' }}
              onClick={() => navigate(`/loan/${params.row.id}`)}
            />
          </Tooltip>
          {canTrigger && NOTIFIABLE_STATUSES.includes(params.row.status) && (
            <Tooltip title="Send Notification">
              <SendOutlined
                sx={{ fontSize: 20, cursor: 'pointer' }}
                onClick={(e) => openNotifyMenu(e, params.row)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Status filter (server-side, same TextField-select pattern as TenantsList.jsx's FSP
  // status filter) - kept as its own exact-match filter, not folded into the free-text
  // search below, since it's a small fixed set of values suited to that. '' means "no filter".
  const [statusFilter, setStatusFilter] = useState('');

  // Single unified search box - replaces the earlier three separate fields (Application #/
  // Check #/Client Name). searchInput updates immediately (responsive typing); search is
  // debounced ~400ms and is what fetchLoans actually depends on. Matches application #,
  // check #, full client name (any part), MIFOS loan ID, and MIFOS account - see
  // getAllWithDetails() in loanMappingService.js for the exact field list.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSetSearch = useMemo(() => debounce(setSearch, 400), []);

  // Same shared date-range control/logic as the Dashboard (dashboardDateRange.js) - reused
  // as-is, not reimplemented. Filters by Created date via startDate/endDate.
  const initialSelection = loadStoredRangeSelection();
  const [range, setRange] = useState(() => computeRange(initialSelection.preset, initialSelection.custom));

  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      // CHARGES_CALCULATED loans have no LOAN_OFFER_REQUEST yet - not a real application,
      // so excluded from this listing too (same excludeStatuses param used by the
      // message-trigger loan lookup). Only applied when no explicit status is chosen - the
      // backend already treats status/excludeStatuses as mutually exclusive (see
      // adminCompat.js's buildLoanListParams / LoanMappingService.getAllWithDetails).
      const params = {
        excludeStatuses: 'CHARGES_CALCULATED',
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
        startDate: range.from,
        endDate: range.to,
      };
      const result = await getRequest(API.ALL_EMPLOYEES_LOAN, { params });
      const { success, data, message } = result.data;

      if (!success) {
        toast.error(message || 'Failed to load loans');
        return;
      }

      const newData = (data?.loans || []).map((loan) => ({
        id: loan._id,
        essApplicationNumber: loan.essApplicationNumber,
        mifosLoanId: loan.mifosLoanId || '—',
        productCode: loan.productCode,
        clientName: clientDisplayName(loan),
        requestedAmount: loan.requestedAmount,
        tenure: loan.tenure,
        status: loan.status,
        createdAt: loan.createdAt,
      }));

      setRows(newData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, range.from, range.to]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Exports the currently-visible (filtered/searched/date-ranged) list, not the full dataset -
  // `rows` already reflects the active server-side filters at any given moment. Same
  // CSV-builder utility and pattern used by the Dashboard's detail pages.
  const handleExportCsv = () => {
    if (!rows.length) {
      toast.info('No records to export');
      return;
    }
    const exportColumns = columns.filter((c) => c.field !== 'action').map((c) => ({ field: c.field, headerName: c.headerName }));
    exportRowsAsCsv(exportColumns, rows, `loans-${range.from}-to-${range.to}`);
  };

  // PDF export re-queries the server with the exact same filter params rather than
  // serializing the current client rows - same approach as the Dashboard's PDF export,
  // guarantees the PDF and the on-screen table can never show different data.
  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const params = {
        excludeStatuses: 'CHARGES_CALCULATED',
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
        startDate: range.from,
        endDate: range.to,
      };
      const result = await getRequest(API.ALL_EMPLOYEES_LOAN_EXPORT_PDF, { params, responseType: 'blob' });
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `loans-${range.from}-to-${range.to}.pdf`;
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
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1A2233', letterSpacing: '-0.2px' }}>Loan Management</div>
          <p className="mb-0" style={{ fontSize: 14, color: '#475467', marginTop: 4 }}>
            Tenant-scoped loan mappings linked to ESS applications and MIFOS.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="outlined" size="small" startIcon={<DownloadOutlined />} onClick={handleExportCsv} disabled={loading}>
            Export CSV
          </Button>
          <Button variant="outlined" size="small" startIcon={<PictureAsPdfOutlined />} onClick={handleExportPdf} disabled={loading || exportingPdf}>
            {exportingPdf ? 'Exporting…' : 'Export PDF'}
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLoans} aria-label="Refresh loans" sx={{ border: '1px solid', borderColor: 'designBorder.input', borderRadius: '8px' }}>
              <RefreshOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          {LOAN_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField
          size="small"
          label="Search"
          placeholder="Application #, check #, client name, MIFOS loan ID/account"
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); debouncedSetSearch(e.target.value); }}
          sx={{ minWidth: 320 }}
        />
        <DateRangeControl onChange={(nextRange) => setRange(nextRange)} />
      </Box>

      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          autoHeight
          components={{
            NoRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6 }}>
                <Box sx={{ fontSize: 24, mb: 1 }}>📄</Box>
                <Typography sx={{ fontSize: 14, color: 'text.muted' }}>No loans found</Typography>
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

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeNotifyMenu}>
        <MenuItem
          disabled={!canTriggerSensitive || sendingType === 'LOAN_DISBURSEMENT_NOTIFICATION'}
          onClick={() => sendNotification('LOAN_DISBURSEMENT_NOTIFICATION')}
        >
          Send Disbursement Notification
        </MenuItem>
        <MenuItem
          disabled={!canTriggerSensitive || sendingType === 'LOAN_DISBURSEMENT_FAILURE_NOTIFICATION'}
          onClick={() => sendNotification('LOAN_DISBURSEMENT_FAILURE_NOTIFICATION')}
        >
          Send Disbursement Failure Notification
        </MenuItem>
      </Menu>
    </div>
  );
};

export default LoanListing;
