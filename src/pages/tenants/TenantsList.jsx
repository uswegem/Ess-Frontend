import React, { useEffect, useState } from 'react';
import {
  Paper, Button, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import { listTenants, patchTenantStatus } from '../../services/tenantService';
import { reviewOnboarding } from '../../services/onboardingService';
import { useNavigate } from 'react-router-dom';
import TenantDetailDrawer, { shouldOpenOnboarding } from './TenantDetailDrawer';

const STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'active', 'rejected', 'suspended', 'disabled'];

export default function TenantsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [reviewOpen, setReviewOpen] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('approve');
  const [reviewReason, setReviewReason] = useState('');
  const [detailTenantId, setDetailTenantId] = useState(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const result = await listTenants({ status: statusFilter, limit: 50 });
      const tenants = (result.data?.tenants || []).map((t) => ({
        id: t.tenantId,
        tenantId: t.tenantId,
        tenantName: t.tenantName,
        fspCode: t.fspCode,
        status: t.status,
        contactEmail: t.contactEmail,
      }));
      setRows(tenants);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, [statusFilter]);

  const handleOpen = (row) => {
    if (shouldOpenOnboarding(row.status)) {
      navigate(`/onboarding/${row.tenantId}`);
    } else {
      setDetailTenantId(row.tenantId);
    }
  };

  const handleReview = async () => {
    try {
      await reviewOnboarding(reviewOpen.tenantId, {
        decision: reviewDecision,
        reason: reviewReason || undefined,
      });

      if (reviewDecision === 'approve') {
        try {
          await patchTenantStatus(reviewOpen.tenantId, { status: 'active' });
          toast.success('Tenant approved and activated');
        } catch (activateErr) {
          toast.warn(
            activateErr.response?.data?.message
              || 'Tenant approved, but activation failed. Configure valid MIFOS credentials, then use Activate.'
          );
        }
      } else {
        toast.success('Review completed');
      }

      setReviewOpen(null);
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const columns = [
    { field: 'tenantId', headerName: 'ID', width: 140 },
    { field: 'tenantName', headerName: 'Name', flex: 1 },
    { field: 'fspCode', headerName: 'FSP Code', width: 120 },
    { field: 'status', headerName: 'Status', width: 130 },
    { field: 'contactEmail', headerName: 'Email', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 260,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={() => handleOpen(p.row)}>Open</Button>
          {['submitted', 'under_review'].includes(p.row.status) && (
            <Button size="small" variant="contained" onClick={() => setReviewOpen(p.row)}>Review</Button>
          )}
          {p.row.status === 'approved' && (
            <Button size="small" color="success" onClick={async () => {
              try {
                await patchTenantStatus(p.row.tenantId, { status: 'active' });
                toast.success('Activated');
                fetchTenants();
              } catch (err) {
                toast.error(err.response?.data?.message || err.message);
              }
            }}>Activate</Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <div className="p-3">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h5">FSP Tenants</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={() => navigate('/onboarding')}>New FSP</Button>
        </Box>
      </Box>
      <Paper sx={{ height: 520 }}>
        <DataGrid rows={rows} columns={columns} loading={loading} getRowId={(r) => r.tenantId} />
      </Paper>

      <Dialog open={Boolean(reviewOpen)} onClose={() => setReviewOpen(null)}>
        <DialogTitle>Review {reviewOpen?.tenantName}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 360 }}>
          <TextField select label="Decision" value={reviewDecision} onChange={(e) => setReviewDecision(e.target.value)}>
            <MenuItem value="approve">Approve</MenuItem>
            <MenuItem value="reject">Reject</MenuItem>
          </TextField>
          <TextField label="Reason (optional)" value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleReview}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <TenantDetailDrawer
        tenantId={detailTenantId}
        onClose={() => setDetailTenantId(null)}
      />
    </div>
  );
}
