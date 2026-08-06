import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { IconButton, Tooltip } from '@mui/material';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { getRequest, postRequest } from '../../ApiFunction';
import API from '../../Api';
import { toast } from 'react-toastify';
import { usePermissions } from '../../hooks/usePermissions';
import { MESSAGE_TYPES, buildMessageDetails } from '../../services/messages/messageTypes';
import { formatNumber } from '../../utils/formatAmount';

const NOTIFIABLE_STATUSES = ['LOAN_CREATED', 'DISBURSED', 'FAILED'];

const STATUS_COLORS = {
  DISBURSED: 'green',
  OFFER_SUBMITTED: 'orange',
  LOAN_CREATED: 'blue',
  FAILED: 'red',
  CANCELLED: 'gray',
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
    { field: 'mifosLoanAccountNumber', headerName: 'MIFOS Account', width: 140 },
    { field: 'productCode', headerName: 'Product', width: 100 },
    {
      field: 'clientName',
      headerName: 'Client',
      width: 200,
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
        <span style={{ color: STATUS_COLORS[params.value] || 'black', fontWeight: 600 }}>
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

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      // CHARGES_CALCULATED loans have no LOAN_OFFER_REQUEST yet - not a real application,
      // so excluded from this listing too (same excludeStatuses param used by the
      // message-trigger loan lookup).
      const result = await getRequest(API.ALL_EMPLOYEES_LOAN, { params: { excludeStatuses: 'CHARGES_CALCULATED' } });
      const { success, data, message } = result.data;

      if (!success) {
        toast.error(message || 'Failed to load loans');
        return;
      }

      const newData = (data?.loans || []).map((loan) => ({
        id: loan._id,
        essApplicationNumber: loan.essApplicationNumber,
        mifosLoanAccountNumber: loan.mifosLoanAccountNumber || '—',
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
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">Loan Management</h5>
          <p className="text-muted mb-0">
            Tenant-scoped loan mappings linked to ESS applications and MIFOS.
          </p>
        </div>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchLoans} aria-label="Refresh loans">
            <RefreshOutlined sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </div>
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          autoHeight
          sx={{ border: 0 }}
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
