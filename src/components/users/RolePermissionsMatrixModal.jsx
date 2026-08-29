import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';
import {
  TENANT_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  ASSIGNABLE_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  roleHasPermission,
} from '../../constants/tenantRolePermissions';
import { updateTenantUserPermissions } from '../../services/userService';

// Single surface for both viewing and editing roles/permissions - the static reference
// tables below are unchanged; the "Edit user permissions" section is the only place a
// tenant admin can add/remove an individual user's custom permission overrides
// (TenantUser.permissions). Editing role definitions or creating custom roles is
// out of scope (confirmed) - ROLE_PERMISSIONS itself is not editable here.
export default function RolePermissionsMatrixModal({
  open, onClose, users, tenantId, currentUserId, onPermissionsChanged,
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [pendingPermissions, setPendingPermissions] = useState([]);
  const [addValue, setAddValue] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedUser = (users || []).find((u) => (u.userId || u.id) === selectedUserId) || null;

  useEffect(() => {
    if (selectedUser) {
      setPendingPermissions(selectedUser.customPermissions || []);
      setAddValue('');
    }
  }, [selectedUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      setSelectedUserId('');
      setPendingPermissions([]);
      setConfirmOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const roleDefaults = selectedUser ? (ROLE_PERMISSIONS[selectedUser.role] || []) : [];
  const addablePermissions = ASSIGNABLE_PERMISSIONS.filter(
    (p) => !roleDefaults.includes(p) && !pendingPermissions.includes(p),
  );
  const isSelf = Boolean(currentUserId) && String(currentUserId) === String(selectedUserId);
  const hasChanges = selectedUser
    && JSON.stringify([...pendingPermissions].sort())
      !== JSON.stringify([...(selectedUser.customPermissions || [])].sort());
  const wouldSelfLockout = isSelf
    && !roleDefaults.includes('users:manage')
    && !pendingPermissions.includes('users:manage');

  const removePermission = (permission) => {
    setPendingPermissions((prev) => prev.filter((p) => p !== permission));
  };

  const addPermission = () => {
    if (addValue && !pendingPermissions.includes(addValue)) {
      setPendingPermissions((prev) => [...prev, addValue]);
    }
    setAddValue('');
  };

  const handleSaveConfirmed = async () => {
    setSaving(true);
    try {
      await updateTenantUserPermissions(tenantId, selectedUserId, pendingPermissions);
      toast.success('Permissions updated');
      setConfirmOpen(false);
      onPermissionsChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Roles &amp; permissions</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Default permissions assigned to each FSP tenant role. Custom permissions may be added per user below.
            Platform <strong>super_admin</strong> bypasses all checks.
            <br />
            <strong>reporting:read</strong> and <strong>reporting:all_tenants</strong> are integration
            (API key) permissions, never assignable to a user here.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {TENANT_ROLES.map((role) => (
              <Paper key={role} variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2">{ROLE_LABELS[role]}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  {ROLE_DESCRIPTIONS[role]}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {ROLE_PERMISSIONS[role].map((perm) => (
                    <Chip key={perm} label={perm} size="small" variant="outlined" />
                  ))}
                </Box>
              </Paper>
            ))}
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Permission matrix</Typography>
          <Paper variant="outlined" sx={{ overflowX: 'auto', mb: 3 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 160, fontWeight: 600 }}>Permission</TableCell>
                  <TableCell sx={{ minWidth: 200, fontWeight: 600 }}>Description</TableCell>
                  {TENANT_ROLES.map((role) => (
                    <TableCell key={role} align="center" sx={{ fontWeight: 600, minWidth: 88, verticalAlign: 'bottom' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {ROLE_LABELS[role]}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ALL_PERMISSIONS.map((permission) => (
                  <TableRow key={permission} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {permission}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {PERMISSION_DESCRIPTIONS[permission] || '—'}
                      </Typography>
                    </TableCell>
                    {TENANT_ROLES.map((role) => (
                      <TableCell key={role} align="center">
                        {roleHasPermission(role, permission) ? (
                          <CheckIcon color="success" fontSize="small" aria-label="Included" />
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Edit user permissions</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Add or remove custom permissions for an individual user, on top of their role&apos;s defaults.
            Role definitions themselves are not editable here.
          </Typography>

          <TextField
            select
            size="small"
            label="Select user"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            sx={{ minWidth: 280, mb: 2 }}
          >
            {(users || []).map((u) => (
              <MenuItem key={u.userId || u.id} value={u.userId || u.id}>
                {u.fullName || u.email} ({ROLE_LABELS[u.role] || u.role})
              </MenuItem>
            ))}
          </TextField>

          {selectedUser && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                From role ({ROLE_LABELS[selectedUser.role] || selectedUser.role}) — not removable here
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {roleDefaults.map((perm) => (
                  <Chip key={perm} label={perm} size="small" sx={{ bgcolor: 'action.disabledBackground' }} />
                ))}
              </Box>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Custom override
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, minHeight: 32 }}>
                {pendingPermissions.length === 0 && (
                  <Typography variant="caption" color="text.disabled">None</Typography>
                )}
                {pendingPermissions.map((perm) => (
                  <Chip
                    key={perm}
                    label={perm}
                    size="small"
                    color="primary"
                    onDelete={() => removePermission(perm)}
                    deleteIcon={<CloseIcon />}
                    disabled={saving}
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Add permission"
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  sx={{ minWidth: 240 }}
                  disabled={saving || addablePermissions.length === 0}
                >
                  {addablePermissions.map((perm) => (
                    <MenuItem key={perm} value={perm}>{perm}</MenuItem>
                  ))}
                </TextField>
                <Button size="small" variant="outlined" disabled={!addValue || saving} onClick={addPermission}>
                  Add
                </Button>
              </Box>

              {wouldSelfLockout && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  You cannot remove your own admin access. Ask another tenant admin to make this change.
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!hasChanges || saving || wouldSelfLockout}
                  onClick={() => setConfirmOpen(true)}
                >
                  Save permissions
                </Button>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm permission change?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This changes what {selectedUser?.fullName || 'this user'} can do immediately, and is
            audit-logged. These permissions gate real actions (messages to borrowers, financial
            reports, user management).
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>New custom permission set:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {pendingPermissions.length === 0 && (
              <Typography variant="caption" color="text.disabled">None — role defaults only</Typography>
            )}
            {pendingPermissions.map((perm) => (
              <Chip key={perm} label={perm} size="small" />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" color="warning" disabled={saving} onClick={handleSaveConfirmed}>
            {saving ? 'Saving…' : 'Confirm & save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
