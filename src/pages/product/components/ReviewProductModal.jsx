import React, { useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { formatCurrency } from '../../../utils/formatAmount';

// Fields required by PRODUCT_DETAIL, mirrored from the backend's REQUIRED_FIELDS_BY_MESSAGE_TYPE
// (outgoingMessageValidator.js) so the operator sees the same gaps here that the backend would
// otherwise reject at Submit time. Label is what's shown; productField is the key on the product
// document; emptyCheck lets numeric 0 count as "provided" (only "", null, undefined are gaps).
const PRODUCT_DETAIL_FIELDS = [
    { label: 'Deduction Code', productField: 'deductionCode' },
    { label: 'Product Code', productField: 'productCode' },
    { label: 'Product Name', productField: 'productName' },
    { label: 'Product Description', productField: 'productDescription' },
    { label: 'Min Tenure', productField: 'minTenure' },
    { label: 'Max Tenure', productField: 'maxTenure' },
    { label: 'Interest Rate', productField: 'interestRate' },
    { label: 'Processing Fee', productField: 'processingFee' },
    { label: 'Insurance', productField: 'insurance' },
    { label: 'Max Amount', productField: 'maxAmount', isAmount: true },
    { label: 'Min Amount', productField: 'minAmount', isAmount: true },
    { label: 'Repayment Type', productField: 'repaymentType' },
    { label: 'Insurance Type', productField: 'insuranceType' },
];

const isMissing = (value) => value === '' || value === null || value === undefined;

const SYNC_STATUS_LABEL = {
    NOT_SUBMITTED: { label: 'Not submitted', color: 'default' },
    SUBMITTED: { label: 'Submitted', color: 'success' },
    EDITED_SINCE_SUBMIT: { label: 'Edited since last submit', color: 'warning' },
    SYNC_FAILED: { label: 'Sync failed', color: 'error' },
};

// Read-only summary of a product's currently saved data, opened from the products list'
// "Review" action. Offers Edit (back to the Add/Edit modal, no message sent) and Submit
// (validates required fields, then hands off to the confirm-before-send step).
const ReviewProductModal = ({ open, product, onClose, onEdit, onRequestSubmit }) => {
    const missingFields = useMemo(() => {
        if (!product) return [];
        return PRODUCT_DETAIL_FIELDS.filter((f) => isMissing(product[f.productField]));
    }, [product]);

    if (!product) return null;

    const syncStatus = SYNC_STATUS_LABEL[product.utumishiSyncStatus] || SYNC_STATUS_LABEL.NOT_SUBMITTED;
    const isRetry = product.utumishiSyncStatus === 'SYNC_FAILED';
    const isDraft = product.status === 'draft';
    const isDecommissioned = product.isActive === false;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            <DialogTitle>Review Product</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {product.productName || product.productCode}
                        </Typography>
                        {isDraft ? (
                            <Chip size="small" label="Draft" color="default" variant="outlined" />
                        ) : isDecommissioned ? (
                            <Chip size="small" label="Decommissioned" color="default" variant="outlined" />
                        ) : (
                            <Chip size="small" label={syncStatus.label} color={syncStatus.color} />
                        )}
                    </Stack>

                    {isDraft && (
                        <Alert severity="info">
                            This product is still a draft. Use Edit to fill in the remaining required
                            fields and save it (not "Save Draft") before it can be submitted to Utumishi.
                        </Alert>
                    )}

                    {isDecommissioned && (
                        <Alert severity="info">
                            This product has been decommissioned and is read-only.
                        </Alert>
                    )}

                    {!isDraft && product.utumishiSyncStatus === 'SYNC_FAILED' && product.lastSubmitError && (
                        <Alert severity="error">Last submit failed: {product.lastSubmitError}</Alert>
                    )}
                    {product.utumishiSyncStatus === 'EDITED_SINCE_SUBMIT' && (
                        <Alert severity="warning">
                            This product was edited after it was last submitted - Utumishi still has the
                            older data until you Submit again.
                        </Alert>
                    )}

                    {missingFields.length > 0 && (
                        <Alert severity="error">
                            Missing required field(s) before this can be submitted: {missingFields.map((f) => f.label).join(', ')}.
                            Use Edit to fill these in.
                        </Alert>
                    )}

                    <Table size="small">
                        <TableBody>
                            {PRODUCT_DETAIL_FIELDS.map((f) => (
                                <TableRow key={f.productField}>
                                    <TableCell sx={{ color: 'text.secondary', width: '45%' }}>{f.label}</TableCell>
                                    <TableCell>
                                        {isMissing(product[f.productField]) ? (
                                            <Typography component="span" color="error">Missing</Typography>
                                        ) : f.isAmount ? (
                                            formatCurrency(product[f.productField], product.currency || 'TZS')
                                        ) : (
                                            String(product[f.productField])
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell sx={{ color: 'text.secondary' }}>For Executive</TableCell>
                                <TableCell>{product.forExecutive ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ color: 'text.secondary' }}>Sharia Facility</TableCell>
                                <TableCell>{product.shariaFacility ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ color: 'text.secondary' }}>Terms & Conditions</TableCell>
                                <TableCell>{(product.termsConditions || []).length} term(s)</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                {!isDecommissioned && <Button onClick={onEdit}>Edit</Button>}
                {!isDecommissioned && (
                    <Button
                        variant="contained"
                        color={isRetry ? 'error' : 'primary'}
                        disabled={isDraft || missingFields.length > 0}
                        onClick={onRequestSubmit}
                    >
                        {isRetry ? 'Retry Submit' : 'Submit'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ReviewProductModal;
