import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// Confirmation gate before PRODUCT_DETAIL is sent to Utumishi - same guard pattern as
// LiquidationConfirmModal (src/pages/messages/components/LiquidationConfirmModal.js), sized
// down since this isn't a money-movement message: a single acknowledgement checkbox is enough.
const ProductSubmitConfirmModal = ({ open, productName, isRetry, submitting, onCancel, onConfirm }) => {
    const [acknowledged, setAcknowledged] = useState(false);

    const handleClose = () => {
        setAcknowledged(false);
        onCancel();
    };

    const handleConfirm = () => {
        setAcknowledged(false);
        onConfirm();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isRetry ? 'Retry submit to Utumishi' : 'Submit product to Utumishi'}</DialogTitle>
            <DialogContent>
                <Alert severity="warning" className="mb-3">
                    This sends live PRODUCT_DETAIL data to production Utumishi for "{productName}".
                </Alert>
                <DialogContentText className="mb-2">
                    This will notify Utumishi of this product. Continue?
                </DialogContentText>
                <FormControlLabel
                    className="mt-2"
                    control={
                        <Checkbox
                            checked={acknowledged}
                            onChange={(e) => setAcknowledged(e.target.checked)}
                        />
                    }
                    label="I understand this notifies Utumishi with this product's current saved data."
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
                <Button
                    variant="contained"
                    color="warning"
                    disabled={!acknowledged || submitting}
                    onClick={handleConfirm}
                >
                    {submitting ? 'Submitting...' : 'Confirm and submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductSubmitConfirmModal;
