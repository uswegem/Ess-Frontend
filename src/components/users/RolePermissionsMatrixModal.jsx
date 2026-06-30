import React from 'react';
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
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import {
  TENANT_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  roleHasPermission,
} from '../../constants/tenantRolePermissions';

export default function RolePermissionsMatrixModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Tenant roles &amp; permissions reference</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Default permissions assigned to each FSP tenant role. Custom permissions may be added per user via API.
          Platform <strong>super_admin</strong> bypasses all checks.
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
        <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
