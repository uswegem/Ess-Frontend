import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

const IdleLogoutWarning = ({ open, countdown, onStayLoggedIn, onLogoutNow }) => (
  <Dialog open={open} onClose={onStayLoggedIn} maxWidth="xs" fullWidth>
    <DialogTitle>Session timing out</DialogTitle>
    <DialogContent>
      <DialogContentText>
        You've been inactive for a while. For security, you'll be logged out in{' '}
        <strong>{Math.max(countdown, 0)}s</strong> unless you stay logged in.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onLogoutNow}>Logout now</Button>
      <Button variant="contained" onClick={onStayLoggedIn}>Stay logged in</Button>
    </DialogActions>
  </Dialog>
);

export default IdleLogoutWarning;
