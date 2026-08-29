import React, { useCallback, useEffect, useState } from 'react';
import {
  Paper, Button, Box, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import { listTenants, patchTenantStatus } from '../../services/tenantService';
import { reviewOnboarding } from '../../services/onboardingService';
import { useNavigate } from 'react-router-dom';
import TenantDetailDrawer, { shouldOpenOnboarding } from './TenantDetailDrawer';

const STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'active', 'rejected', 'suspended', 'disabled'];

// Same statusPill token approach as the Product screens (Product.js's rowStatusChip /
// ReviewProductModal.jsx's statusPillSx) - green for the two "in good standing" states,
// red for the three rejected/blocked states, gray for everything still in flight.
const TENANT_STATUS_PILL = {
  active: 'green',
  approved: 'green',
  rejected: 'red',
  suspended: 'red',
  disabled: 'red',
  draft: 'gray',
  submitted: 'gray',
  under_review: 'gray',
};
const statusPillSx = (status) => {
  const pillKey = TENANT_STATUS_PILL[status] || 'gray';
  return { bgcolor: `statusPill.${pillKey}.bg`, color: `statusPill.${pillKey}.text` };
};

function NoRowsOverlay() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.muted' }}>
      <Box sx={{ fontSize: 24, mb: 1 }}>📁</Box>
      <Typography sx={{ fontSize: 14, color: 'text.muted' }}>No FSPs match this filter</Typography>
    </Box>
  );
}

export default function TenantsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  // Defaults to "active" rather than "submitted" - active tenants are the common case an
  // admin lands on this page to find, and shouldn't take an extra click to see. "submitted"
  // (tenants awaiting review) is still one filter selection away.
  const [statusFilter, setStatusFilter] = useState('active');
  const [reviewOpen, setReviewOpen] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('approve');
  const [reviewReason, setReviewReason] = useState('');
  const [detailTenantId, setDetailTenantId] = useState(null);

  const fetchTenants = useCallback(async () => {
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
  }, [statusFilter]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

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
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      sortable: false,
      renderCell: (p) => <Chip size="small" label={p.value} sx={statusPillSx(p.value)} />,
    },
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.2px' }}>FSP Tenants</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={() => navigate('/onboarding')} sx={{ height: 38 }}>New FSP</Button>
        </Box>
      </Box>
      <Paper sx={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(r) => r.tenantId}
          components={{ NoRowsOverlay }}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAFBFC' },
          }}
        />
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
