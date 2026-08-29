import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// Confirmation gate for an admin-initiated password reset - disruptive (invalidates the
// user's existing sessions immediately) but recoverable, unlike LOAN_LIQUIDATION_NOTIFICATION
// (permanently closes a loan). Proportionate confirmation for that difference: a clear warning
// + explicit Confirm/Cancel, without LiquidationConfirmModal's "type the identifier to
// confirm" step, which is reserved for irreversible actions.
const ResetPasswordConfirmModal = ({ open, userName, loading, onCancel, onConfirm }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
    <DialogTitle>Reset password?</DialogTitle>
    <DialogContent>
      <Alert severity="warning" className="mb-3">
        This immediately signs {userName || 'this user'} out of all active sessions and issues
        a new temporary password.
      </Alert>
      <DialogContentText>
        You&apos;ll see the new one-time password on the next screen to share with{' '}
        {userName || 'the user'} directly. It won&apos;t be shown again.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={loading}>Cancel</Button>
      <Button variant="contained" color="warning" disabled={loading} onClick={onConfirm}>
        {loading ? 'Resetting…' : 'Reset password'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ResetPasswordConfirmModal;
