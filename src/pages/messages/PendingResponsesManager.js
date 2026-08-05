import React, { useCallback, useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { getRequest, postRequest } from '../../ApiFunction';
import API from '../../Api';
import { toast } from 'react-toastify';
import { usePermissions } from '../../hooks/usePermissions';

const PendingResponsesManager = () => {
  const { isPlatformAdmin } = usePermissions();
  const [pendingResponses, setPendingResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState(null);

  const fetchPendingResponses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getRequest(API.PENDING_RESPONSES);
      const { success, data, message } = result.data;

      if (!success) {
        toast.error(message || 'Failed to fetch pending responses');
        return;
      }

      setPendingResponses(data?.pendingResponses || []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingResponses();
  }, [fetchPendingResponses]);

  const handleResend = async (messageId) => {
    setResendingId(messageId);
    try {
      const result = await postRequest(API.messageResend(messageId), {});
      const { success, message } = result.data;
      if (!success) {
        toast.error(message || 'Failed to resend message');
        return;
      }
      toast.success('Message resent');
      fetchPendingResponses();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setResendingId(null);
    }
  };

  const columns = [
    { field: 'messageId', headerName: 'Message ID', width: 200 },
    { field: 'messageType', headerName: 'Type', width: 220 },
    { field: 'applicationNumber', headerName: 'Application #', width: 160 },
    { field: 'loanNumber', headerName: 'Loan #', width: 140 },
    { field: 'status', headerName: 'Status', width: 110 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params) => new Date(params.row.createdAt).toLocaleString(),
    },
    ...(isPlatformAdmin ? [{
      field: 'action',
      headerName: 'Action',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        params.row.status === 'failed' ? (
          <Button
            variant="contained"
            size="small"
            disabled={resendingId === params.row.messageId}
            onClick={() => handleResend(params.row.messageId)}
          >
            {resendingId === params.row.messageId ? 'Resending...' : 'Resend'}
          </Button>
        ) : null
      ),
    }] : []),
  ];

  return (
    <div className="container">
      <h5 className="mb-1">Pending Responses</h5>
      <p className="text-muted mb-4">
        Pending and failed outgoing message deliveries for this tenant.
      </p>
      <Paper>
        <DataGrid
          rows={pendingResponses}
          columns={columns}
          loading={loading}
          pageSize={10}
          pageSizeOptions={[10, 25]}
          getRowId={(row) => row.messageId}
          sx={{ border: 0 }}
        />
      </Paper>
    </div>
  );
};

export default PendingResponsesManager;
