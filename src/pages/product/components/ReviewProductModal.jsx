import React, { useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { formatCurrency } from '../../../utils/formatAmount';

// Fields required by PRODUCT_DETAIL, mirrored from the backend's REQUIRED_FIELDS_BY_MESSAGE_TYPE
// (outgoingMessageValidator.js) so the operator sees the same gaps here that the backend would
// otherwise reject at Submit time. Label is what's shown; productField is the key on the product
// document; emptyCheck lets numeric 0 count as "provided" (only "", null, undefined are gaps).
// Unchanged from before this restyle - still drives missingFields/Submit-disabled below.
// productName/productDescription stay in this list (still required, still block Submit if
// missing) even though they're no longer rendered as their own grid row below - name moves to
// the modal title, description to the callout box, matching the design's layout.
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

// Same statusPill token mapping as Product.js's rowStatusChip - see that file's comment for
// why this goes through sx instead of Chip's `color` prop.
const STATUS_PILL_COLOR_MAP = { success: 'green', error: 'red', default: 'gray' };
const statusPillSx = (color, variant) => {
    const pillKey = STATUS_PILL_COLOR_MAP[color];
    if (!pillKey) return {}; // "warning" - no design-token equivalent, falls through to Chip's own default color
    return {
        bgcolor: variant === 'outlined' ? 'transparent' : `statusPill.${pillKey}.bg`,
        color: `statusPill.${pillKey}.text`,
        borderColor: variant === 'outlined' ? `statusPill.${pillKey}.text` : undefined,
    };
};

// Design-handoff's grouped-sections field grid: a section label above a responsive 2-column
// (auto-fit minmax(220,1fr), same pattern as the approved "narrow form" fixes elsewhere) grid
// of label/value pairs.
function FieldGroup({ title, fields, product }) {
    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.muted', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.25 }}>
                {title}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px 16px' }}>
                {fields.map((f) => (
                    <Box key={f.productField}>
                        <Typography sx={{ fontSize: 12, color: 'text.muted', mb: 0.25 }}>{f.label}</Typography>
                        {isMissing(product[f.productField]) ? (
                            <Typography sx={{ fontSize: 14, fontWeight: 500 }} color="error">Missing</Typography>
                        ) : (
                            <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
                                {f.isAmount ? formatCurrency(product[f.productField], product.currency || 'TZS') : String(product[f.productField])}
                                {f.suffix || ''}
                            </Typography>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

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

    const byField = (field) => PRODUCT_DETAIL_FIELDS.find((f) => f.productField === field);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper" PaperProps={{ sx: { borderRadius: '14px' } }}>
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'designBorder.subtle' }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <Typography sx={{ fontSize: 17, fontWeight: 700, color: 'text.primary' }}>
                        {product.productName || product.productCode}
                    </Typography>
                    {isDraft ? (
                        <Chip size="small" label="Draft" variant="outlined" sx={statusPillSx('default', 'outlined')} />
                    ) : isDecommissioned ? (
                        <Chip size="small" label="Decommissioned" variant="outlined" sx={statusPillSx('default', 'outlined')} />
                    ) : (
                        <Chip size="small" label={syncStatus.label} sx={statusPillSx(syncStatus.color)} />
                    )}
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 2.5 }}>
                <Stack spacing={2}>
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

                    {/* Callout box - product.productDescription is still one of the required
                        PRODUCT_DETAIL_FIELDS above (missing state already surfaced via the Alert
                        banner), this is just where its value is displayed. */}
                    <Box sx={{ bgcolor: 'designBackground.pageAlt', borderRadius: '10px', p: '14px 16px', fontSize: 14, lineHeight: 1.5, color: 'text.secondary' }}>
                        {product.productDescription || 'No description provided.'}
                    </Box>

                    <FieldGroup
                        title="Identifiers"
                        product={product}
                        fields={[byField('deductionCode'), byField('productCode')]}
                    />
                    <FieldGroup
                        title="Terms & Pricing"
                        product={product}
                        fields={[
                            { ...byField('minTenure'), suffix: ' mo' },
                            { ...byField('maxTenure'), suffix: ' mo' },
                            { ...byField('interestRate'), suffix: '%' },
                            { ...byField('processingFee'), suffix: '%' },
                            { ...byField('insurance'), suffix: '%' },
                            byField('insuranceType'),
                            byField('repaymentType'),
                        ]}
                    />
                    {/* Not a PRODUCT_DETAIL field (no Utumishi spec equivalent, ess2-internal
                        only) - never part of PRODUCT_DETAIL_FIELDS/missingFields, same as before
                        this restyle. Handled as its own cell (not via FieldGroup's generic field
                        list) because it has its own default-value/"(default)" annotation logic
                        that doesn't apply to any other field. */}
                    <Box sx={{ mt: -1.5, mb: 2.5 }}>
                        <Typography sx={{ fontSize: 12, color: 'text.muted', mb: 0.25 }}>Other Charges</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
                            {formatCurrency(isMissing(product.otherCharges) ? 50000 : product.otherCharges, product.currency || 'TZS')}
                            {isMissing(product.otherCharges) && (
                                <Typography component="span" sx={{ fontSize: 12 }} color="text.muted"> (default)</Typography>
                            )}
                        </Typography>
                    </Box>
                    <FieldGroup
                        title="Amount Limits"
                        product={product}
                        fields={[byField('minAmount'), byField('maxAmount')]}
                    />

                    <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.muted', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.25 }}>
                            Eligibility
                        </Typography>
                        <Stack direction="row" spacing={2.5}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography sx={{ fontSize: 13, color: 'text.muted' }}>For Executive</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                                    {product.forExecutive ? 'Yes' : 'No'}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography sx={{ fontSize: 13, color: 'text.muted' }}>Sharia Facility</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                                    {product.shariaFacility ? 'Yes' : 'No'}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography sx={{ fontSize: 13, color: 'text.muted' }}>Terms & Conditions</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                                    {(product.termsConditions || []).length} term(s)
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid', borderColor: 'designBorder.subtle', p: '16px 24px' }}>
                <Button onClick={onClose} sx={{ color: 'primary.main', textTransform: 'none', fontWeight: 600 }}>Close</Button>
                {!isDecommissioned && (
                    <Button
                        onClick={onEdit}
                        variant="outlined"
                        sx={{ borderColor: 'designBorder.input', color: '#344054', textTransform: 'none', fontWeight: 600 }}
                    >
                        Edit
                    </Button>
                )}
                {!isDecommissioned && (
                    <Button
                        variant="contained"
                        color={isRetry ? 'error' : 'primary'}
                        disabled={isDraft || missingFields.length > 0}
                        onClick={onRequestSubmit}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {isRetry ? 'Retry Submit' : 'Submit'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ReviewProductModal;
