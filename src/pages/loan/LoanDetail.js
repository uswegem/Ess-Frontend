import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { getRequest, postRequest } from '../../ApiFunction';
import API from '../../Api';
import { toast } from 'react-toastify';
import { usePermissions } from '../../hooks/usePermissions';
import { MESSAGE_TYPES, buildMessageDetails } from '../../services/messages/messageTypes';

const STATUS_COLORS = {
  DISBURSED: 'success',
  OFFER_SUBMITTED: 'warning',
  LOAN_CREATED: 'info',
  FAILED: 'error',
  CANCELLED: 'default',
};

function InfoRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="d-flex justify-content-between mb-1">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{String(value)}</Typography>
    </div>
  );
}

const LoanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canTriggerSensitive = can('messages:trigger_sensitive');

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [sendingType, setSendingType] = useState(null);

  const fetchLoan = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRequest(API.loanDetail(id));
      const { success, data, message } = result.data;
      if (!success) {
        toast.error(message || 'Failed to load loan');
        return;
      }
      setLoan(data?.loan || null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  const sendNotification = async (messageType) => {
    setMenuAnchor(null);
    setSendingType(messageType);
    try {
      const template = MESSAGE_TYPES[messageType];
      const messageDetails = buildMessageDetails(template.messageDetails, loan);
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

  if (loading) {
    return (
      <div className="container d-flex justify-content-center p-4">
        <CircularProgress />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="container">
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate('/loan')} sx={{ mb: 3 }}>
          Back to Loans
        </Button>
        <Typography>Loan not found.</Typography>
      </div>
    );
  }

  const client = loan.clientData || {};
  const loanData = loan.loanData || {};
  const employment = loan.employmentData || {};

  return (
    <div className="container">
      <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate('/loan')} sx={{ mb: 3 }}>
        Back to Loans
      </Button>

      <Paper className="p-3 mb-3">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <Chip label={loan.status || 'Unknown'} color={STATUS_COLORS[loan.status] || 'default'} size="small" sx={{ mb: 1 }} />
            <Typography variant="h6">{loan.essApplicationNumber}</Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<SendOutlined />}
            disabled={!canTriggerSensitive || Boolean(sendingType)}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            {sendingType ? 'Sending...' : 'Send Notification'}
          </Button>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => sendNotification('LOAN_DISBURSEMENT_NOTIFICATION')}>
              Send Disbursement Notification
            </MenuItem>
            <MenuItem onClick={() => sendNotification('LOAN_DISBURSEMENT_FAILURE_NOTIFICATION')}>
              Send Disbursement Failure Notification
            </MenuItem>
          </Menu>
        </div>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper className="p-3 mb-2">
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Client Information</Typography>
            <InfoRow label="Full Name" value={[client.firstName, client.middleName, client.lastName].filter(Boolean).join(' ')} />
            <InfoRow label="NIN" value={client.nin} />
            <InfoRow label="Mobile Number" value={client.mobileNumber} />
            <InfoRow label="Email" value={client.emailAddress} />
            <InfoRow label="Sex" value={client.sex === 'M' ? 'Male' : client.sex === 'F' ? 'Female' : client.sex} />
            <InfoRow label="Bank Account Number" value={client.bankAccountNumber} />
          </Paper>

          <Paper className="p-3">
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Employment Information</Typography>
            <InfoRow label="Basic Salary" value={employment.basicSalary} />
            <InfoRow label="Net Salary" value={employment.netSalary} />
            <InfoRow label="Employment Date" value={client.employmentDate} />
            <InfoRow label="Designation" value={employment.designationName} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper className="p-3 mb-2">
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Loan Information</Typography>
            <InfoRow label="Requested Amount" value={loan.requestedAmount ?? loanData.requestedAmount} />
            <InfoRow label="Product Code" value={loan.productCode ?? loanData.productCode} />
            <InfoRow label="Tenure" value={loan.tenure ?? loanData.tenure} />
            <InfoRow label="Interest Rate" value={loanData.interestRate ?? loanData.annualInterestRate} />
            <InfoRow label="Processing Fee" value={loanData.processingFee} />
            <InfoRow label="Insurance" value={loanData.insurance} />
            <InfoRow label="Loan Purpose" value={loanData.loanPurpose} />
            <InfoRow label="Funding" value={loanData.funding} />
          </Paper>

          <Paper className="p-3">
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Timeline</Typography>
            <InfoRow label="Created" value={loan.createdAt ? new Date(loan.createdAt).toLocaleString() : null} />
            <InfoRow label="Updated" value={loan.updatedAt ? new Date(loan.updatedAt).toLocaleString() : null} />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default LoanDetail;
