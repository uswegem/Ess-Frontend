import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// Elevated confirmation gate for LOAN_LIQUIDATION_NOTIFICATION - this message type closes
// the loan permanently. Beyond the messages:trigger_sensitive permission check, the operator
// must both type the loan's application number AND check the acknowledgement box.
const LiquidationConfirmModal = ({ open, applicationNumber, onCancel, onConfirm }) => {
  const [typedNumber, setTypedNumber] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const handleClose = () => {
    setTypedNumber('');
    setAcknowledged(false);
    onCancel();
  };

  const handleConfirm = () => {
    setTypedNumber('');
    setAcknowledged(false);
    onConfirm();
  };

  const canConfirm = acknowledged && typedNumber.trim() === (applicationNumber || '').trim() && Boolean(applicationNumber);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm loan liquidation</DialogTitle>
      <DialogContent>
        <Alert severity="warning" className="mb-3">
          LOAN_LIQUIDATION_NOTIFICATION permanently closes this loan. This cannot be undone.
        </Alert>
        <DialogContentText className="mb-2">
          Type the application number <strong>{applicationNumber}</strong> to confirm.
        </DialogContentText>
        <TextField
          fullWidth
          autoFocus
          label="Application number"
          value={typedNumber}
          onChange={(e) => setTypedNumber(e.target.value)}
        />
        <FormControlLabel
          className="mt-2"
          control={
            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
          }
          label="I understand this closes the loan permanently."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" color="error" disabled={!canConfirm} onClick={handleConfirm}>
          Confirm and send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LiquidationConfirmModal;
