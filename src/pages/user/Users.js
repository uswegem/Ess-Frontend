import React, { useCallback, useEffect, useState } from 'react';
import {
  Paper, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Box, Alert, Typography, InputAdornment, IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { usePermissions } from '../../hooks/usePermissions';
import {
  listTenantUsers, createTenantUser, updateTenantUser, deactivateTenantUser, resetTenantUserPassword,
} from '../../services/userService';
import { TENANT_ROLES } from '../../constants/tenantRolePermissions';
import RolePermissionsMatrixModal from '../../components/users/RolePermissionsMatrixModal';
import ResetPasswordConfirmModal from '../../components/users/ResetPasswordConfirmModal';

function copyToClipboard(value, label) {
  navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error(`Could not copy ${label.toLowerCase()}`),
  );
}

export default function Users() {
  const { tenantId } = useActiveTenant();
  const { can, user: currentUser } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [rolesMatrixOpen, setRolesMatrixOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
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
        customPermissions: u.customPermissions || [],
      }));
      setUsers(rows);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const username = form.username.trim();
  const canInvite = form.email.trim()
    && form.fullName.trim()
    && username.length >= 3
    && username.length <= 50;

  const handleCreate = async () => {
    if (!canInvite) {
      toast.error('Email, full name, and username (3–50 characters) are required.');
      return;
    }
    try {
      const result = await createTenantUser(tenantId, { ...form, username });
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

  const closeResetDialog = () => { if (!resetLoading) setResetTarget(null); };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    try {
      const result = await resetTenantUserPassword(tenantId, resetTarget.userId || resetTarget.id);
      const issued = result.data?.credentials;
      setResetTarget(null);
      if (issued?.temporaryPassword) {
        setCredentials({
          username: issued.username,
          email: issued.email,
          password: issued.temporaryPassword,
        });
      } else {
        toast.success('Password reset.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const columns = [
    { field: 'fullName', headerName: 'Name', flex: 0.6, minWidth: 140 },
    { field: 'email', headerName: 'Email', flex: 0.8, minWidth: 180 },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      sortable: false,
      // Design shows Role specifically as the indigo pill variant (distinct from Active's
      // green/gray below) - a "role chip" style, not a status-outcome pill.
      renderCell: (p) => <Chip size="small" label={p.value} sx={{ bgcolor: 'statusPill.indigo.bg', color: 'statusPill.indigo.text' }} />,
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 90,
      sortable: false,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.row.isActive ? 'Yes' : 'No'}
          sx={p.row.isActive ? { bgcolor: 'statusPill.green.bg', color: 'statusPill.green.text' } : { bgcolor: 'statusPill.gray.bg', color: 'statusPill.gray.text' }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 360,
      renderCell: (params) => can('users:manage') && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            select size="small" value={params.row.role}
            onChange={(e) => handleRoleChange(params.row, e.target.value)}
            sx={{ minWidth: 140 }}
          >
            {TENANT_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <Box
            component="span"
            onClick={() => setResetTarget(params.row)}
            sx={{ fontSize: 13, fontWeight: 600, color: '#B54708', cursor: 'pointer' }}
          >
            Reset Password
          </Box>
          <Box
            component="span"
            onClick={() => handleDeactivate(params.row)}
            sx={{ fontSize: 13, fontWeight: 600, color: '#D92D20', cursor: 'pointer' }}
          >
            Deactivate
          </Box>
        </Box>
      ),
    },
  ];

  if (!tenantId) {
    return <Box sx={{ p: 3 }}>Select a tenant to manage users, or log in as a tenant admin.</Box>;
  }

  return (
    <div className="p-3">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.2px' }}>Tenant Users</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<InfoOutlinedIcon />}
            onClick={() => setRolesMatrixOpen(true)}
            sx={{ borderRadius: '20px', borderColor: 'designBorder.input', color: '#344054' }}
          >
            Roles &amp; permissions
          </Button>
        </Box>
        {can('users:manage') && (
          <Button variant="contained" onClick={() => setOpen(true)} sx={{ height: 38 }}>Invite User</Button>
        )}
      </Box>

      <RolePermissionsMatrixModal
        open={rolesMatrixOpen}
        onClose={() => setRolesMatrixOpen(false)}
        users={users}
        tenantId={tenantId}
        currentUserId={currentUser?._id}
        onPermissionsChanged={fetchUsers}
      />
      <Paper sx={{ height: 520 }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25]}
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAFBFC' } }}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Tenant User</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField required label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField required label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <TextField
            required
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            helperText="3–50 characters"
            inputProps={{ minLength: 3, maxLength: 50 }}
          />
          <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {TENANT_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!canInvite}>Invite</Button>
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

      <ResetPasswordConfirmModal
        open={Boolean(resetTarget)}
        userName={resetTarget?.fullName}
        loading={resetLoading}
        onCancel={closeResetDialog}
        onConfirm={handleResetPassword}
      />
    </div>
  );
}
