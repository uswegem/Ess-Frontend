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
import Box from '@mui/material/Box';

const COPY = {
  LOAN_LIQUIDATION_NOTIFICATION: {
    title: 'Confirm loan liquidation',
    warning: 'LOAN_LIQUIDATION_NOTIFICATION permanently closes this loan. This cannot be undone.',
    acknowledgement: 'I understand this closes the loan permanently.',
  },
  LOAN_DISBURSEMENT_NOTIFICATION: {
    title: 'Confirm disbursement notification',
    warning: 'This tells Utumishi that the loan money has been disbursed. It cannot be recalled.',
    acknowledgement: 'I have checked the values below and the money has been disbursed.',
  },
};

const defaultCopy = (messageType) => ({
  title: 'Confirm message',
  warning: `${messageType} is a sensitive message to Utumishi and cannot be recalled.`,
  acknowledgement: 'I have checked the values below.',
});

const applicationNumberIn = (xml) =>
  (xml || '').match(/<ApplicationNumber>\s*([^<]*?)\s*<\/ApplicationNumber>/)?.[1] || '';

const fieldsIn = (xml) =>
  [...(xml || '').matchAll(/<(\w+)>([^<]*)<\/\1>/g)].map(([, name, value]) => ({ name, value }));

// Elevated confirmation gate for sensitive sends. Beyond the permission check, the operator
// must type the application number being sent AND check the acknowledgement box.
const SensitiveSendConfirmModal = ({ open, messageType, messageDetails, applicationNumber, onCancel, onConfirm }) => {
  const [typedNumber, setTypedNumber] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const copy = COPY[messageType] || defaultCopy(messageType);
  const inMessage = applicationNumberIn(messageDetails);
  const selected = (applicationNumber || '').trim();
  const expected = inMessage || selected;
  const mismatch = Boolean(inMessage && selected && inMessage !== selected);

  const reset = () => {
    setTypedNumber('');
    setAcknowledged(false);
  };

  const handleClose = () => {
    reset();
    onCancel();
  };

  const handleConfirm = () => {
    reset();
    onConfirm();
  };

  const canConfirm = acknowledged && !mismatch && Boolean(expected) && typedNumber.trim() === expected;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{copy.title}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" className="mb-3">
          {copy.warning}
        </Alert>
        {mismatch && (
          <Alert severity="error" className="mb-3">
            The message is for {inMessage}, but the selected loan is {selected}. Correct it before sending.
          </Alert>
        )}
        <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.5, fontSize: 13, mb: 2 }}>
          {fieldsIn(messageDetails).map(({ name, value }) => (
            <React.Fragment key={name}>
              <Box component="dt" sx={{ color: 'text.secondary' }}>{name}</Box>
              <Box component="dd" sx={{ m: 0, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{value}</Box>
            </React.Fragment>
          ))}
        </Box>
        <DialogContentText className="mb-2">
          Type the application number <strong>{expected}</strong> to confirm.
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
          label={copy.acknowledgement}
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

export default SensitiveSendConfirmModal;
