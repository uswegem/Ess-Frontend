import React, { useCallback, useEffect, useState } from 'react';
import {
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Box, Alert, Typography, InputAdornment, IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { usePermissions } from '../../hooks/usePermissions';
import {
  listTenantUsers, createTenantUser, updateTenantUser, deactivateTenantUser,
} from '../../services/userService';

const TENANT_ROLES = [
  'tenant_admin',
  'operations_manager',
  'finance_officer',
  'support_staff',
];

function copyToClipboard(value, label) {
  navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error(`Could not copy ${label.toLowerCase()}`),
  );
}

export default function Users() {
  const { tenantId } = useActiveTenant();
  const { can } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({
    email: '', fullName: '', role: 'support_staff', username: '', phone: '',
  });

  const fetchUsers = useCallback(async () => {
    if (!tenantId) {
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await listTenantUsers(tenantId);
      const rows = (result.data?.users || []).map((u) => ({
        id: u._id || u.id,
        email: u.email || u.user?.email,
        fullName: u.fullName || u.user?.fullName,
        role: u.role,
        isActive: u.isActive !== false,
        userId: u.userId || u.user?._id,
      }));
      setUsers(rows);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    try {
      const result = await createTenantUser(tenantId, form);
      const issued = result.data?.credentials;
      setOpen(false);
      setForm({ email: '', fullName: '', role: 'support_staff', username: '', phone: '' });
      fetchUsers();

      if (issued?.isNewAccount && issued.temporaryPassword) {
        setCredentials({
          username: issued.username,
          email: issued.email,
          password: issued.temporaryPassword,
        });
      } else {
        toast.success('User added to tenant. They can sign in with their existing password.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const closeCredentialsDialog = () => setCredentials(null);

  const handleRoleChange = async (row, role) => {
    try {
      await updateTenantUser(tenantId, row.userId || row.id, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleDeactivate = async (row) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await deactivateTenantUser(tenantId, row.userId || row.id);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const columns = [
    { field: 'fullName', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'role', headerName: 'Role', width: 180 },
    { field: 'isActive', headerName: 'Active', width: 100, valueGetter: (p) => (p.row.isActive ? 'Yes' : 'No') },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      renderCell: (params) => can('users:manage') && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select size="small" value={params.row.role}
            onChange={(e) => handleRoleChange(params.row, e.target.value)}
            sx={{ minWidth: 140 }}
          >
            {TENANT_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <Button size="small" color="error" onClick={() => handleDeactivate(params.row)}>Deactivate</Button>
        </Box>
      ),
    },
  ];

  if (!tenantId) {
    return <Box sx={{ p: 3 }}>Select a tenant to manage users, or log in as a tenant admin.</Box>;
  }

  return (
    <div className="p-3">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h5>Tenant Users</h5>
        {can('users:manage') && (
          <Button variant="contained" onClick={() => setOpen(true)}>Invite User</Button>
        )}
      </Box>
      <Paper sx={{ height: 520 }}>
        <DataGrid rows={users} columns={columns} loading={loading} pageSizeOptions={[10, 25]} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Tenant User</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <TextField label="Username (optional)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {TENANT_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Invite</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(credentials)} onClose={closeCredentialsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Share login credentials (one-time)</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Alert severity="warning">
            Copy these credentials now and share them securely with the user.
            The password will not be shown again.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Email: {credentials?.email}
          </Typography>
          <TextField
            label="Username"
            value={credentials?.username || ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Copy username"
                    onClick={() => copyToClipboard(credentials?.username, 'Username')}
                    edge="end"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Temporary password"
            value={credentials?.password || ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Copy password"
                    onClick={() => copyToClipboard(credentials?.password, 'Password')}
                    edge="end"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => copyToClipboard(
              `Username: ${credentials?.username}\nPassword: ${credentials?.password}`,
              'Credentials',
            )}
          >
            Copy both
          </Button>
          <Button variant="contained" onClick={closeCredentialsDialog}>Done</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
