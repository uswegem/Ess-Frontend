import React from 'react';
import { toast } from 'react-toastify';
import { MANUAL_MESSAGE_TYPES, triggerManualMessage } from '../../services/manualMessages';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

const ManualMessageTrigger = () => {
  const [open, setOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState('');
  const [payload, setPayload] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleTrigger = async () => {
    if (!selectedType || !payload) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        toast.error('Invalid JSON payload');
        return;
      }

      await triggerManualMessage(selectedType, parsedPayload);
      toast.success('Message triggered successfully');
      setOpen(false);
      setPayload('');
    } catch (error) {
      toast.error(error.message || 'Failed to trigger message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Paper className="p-4 mb-4">
        <h5 className="mb-3">Manual Message Triggers</h5>
        <div className="d-flex flex-wrap gap-2">
          {Object.keys(MANUAL_MESSAGE_TYPES).map((type) => (
            <Button
              key={type}
              variant="outlined"
              onClick={() => {
                setSelectedType(type);
                setOpen(true);
              }}
            >
              {type.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Trigger {selectedType?.replace(/_/g, ' ')}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Payload (JSON)"
            multiline
            rows={8}
            fullWidth
            variant="outlined"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="mt-3"
            placeholder="Enter JSON payload..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleTrigger} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Triggering...' : 'Trigger Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManualMessageTrigger;