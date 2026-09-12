import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import PowerSettingsNewOutlined from '@mui/icons-material/PowerSettingsNewOutlined';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Stack,
    Checkbox,
    FormControlLabel,
    FormHelperText,
    Chip,
    Popover,
    Box,
    Divider,
    Typography,
    CircularProgress,
} from "@mui/material";
import ViewColumnOutlined from '@mui/icons-material/ViewColumnOutlined';
import { getRequest, postRequest, putRequest, deleteRequest } from "../../ApiFunction";
import API from "../../Api";
import { toast } from "react-toastify";
import { getESSErrorMessage, isESSSuccess } from "../../utils/essErrorHandler";
import { useActiveTenant } from "../../hooks/useActiveTenant";
import { formatNumber } from "../../utils/formatAmount";
import TermsBulkImport from "./components/TermsBulkImport";
import ReviewProductModal from "./components/ReviewProductModal";
import ProductSubmitConfirmModal from "./components/ProductSubmitConfirmModal";

// Combined status shown in the products list: `status` (draft/active - form completeness),
// `isActive` (soft-deleted/decommissioned) and `utumishiSyncStatus` (whether Utumishi has the
// current data) together decide the chip. isActive is checked ahead of sync status - a
// decommissioned product's last sync state doesn't matter anymore.
const rowStatusChip = (row) => {
    if (row.status === "draft") return { label: "Draft", color: "default", variant: "outlined" };
    if (row.isActive === false) return { label: "Decommissioned", color: "default", variant: "outlined" };
    if (row.utumishiSyncStatus === "SYNC_FAILED") return { label: "Sync failed", color: "error" };
    if (row.utumishiSyncStatus === "SUBMITTED") return { label: "Submitted", color: "success" };
    if (row.utumishiSyncStatus === "EDITED_SINCE_SUBMIT") return { label: "Edited since submit", color: "warning" };
    return { label: "Not submitted", color: "default" };
};

// Maps rowStatusChip's MUI semantic color name to the design-token handoff's statusPill
// bg/text pairs, via explicit sx (rather than Chip's `color` prop, which pulls from
// theme.palette.success/error/warning - different, unrelated hex values used elsewhere for
// buttons/alerts/etc., not meant to be repurposed as the status-pill palette).
// "warning" (Edited since submit) has no equivalent in the design's token list (only
// green/gray/red/indigo are defined) - left on the theme's existing warning color rather
// than force-fit into one of the four.
const STATUS_PILL_COLOR_MAP = { success: "green", error: "red", default: "gray" };
const statusPillSx = (chip) => {
    const pillKey = STATUS_PILL_COLOR_MAP[chip.color];
    if (!pillKey) return {}; // "warning" - falls through to Chip's own default color styling
    return {
        bgcolor: chip.variant === "outlined" ? "transparent" : `statusPill.${pillKey}.bg`,
        color: `statusPill.${pillKey}.text`,
        borderColor: chip.variant === "outlined" ? `statusPill.${pillKey}.text` : undefined,
    };
};

// Namespaced so it doesn't collide with other pages' DataGrids (Loan, Users, etc. each have
// their own instance) if they ever grow the same feature.
const COLUMN_VISIBILITY_STORAGE_KEY = "ess2.products.columnVisibility";

const loadStoredColumnVisibility = () => {
    try {
        const raw = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

// Design-handoff grouped-sections pattern for the Add/Edit Product dialog - a section label
// above a responsive field grid, same shape as ReviewProductModal's FieldGroup. `grid=false`
// renders children as-is (used for Terms & Conditions, whose content is a dynamic Stack of
// rows, not a simple field grid). `last` skips the bottom margin/divider on the final section.
function FormSection({ title, children, grid = true, last = false }) {
    return (
        <Box sx={{ mb: last ? 0 : 2.75, pb: last ? 0 : 2.75, borderBottom: last ? 'none' : '1px solid', borderColor: 'designBorder.subtle' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.muted', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.25 }}>
                {title}
            </Typography>
            {grid ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
                    {children}
                </Box>
            ) : children}
        </Box>
    );
}

const emptyProductFields = {
        productCode: "",
        productName: "",
        minTenure: "",
        maxTenure: "",
        interestRate: "",
        processingFee: "",
        insurance: "",
        minAmount: "",
        maxAmount: "",
        otherCharges: "",
        repaymentType: "",
        insuranceType: "",
        productDescription: "",
        termsCondition: [],
        forExecutive: false,
        shariaFacility: false,
        deductionCode: "",
        mifosProductId: "",
};

const Product = () => {
    const { activeTenant, tenantId } = useActiveTenant();
    const [open, setOpen] = React.useState(false);
    const [scroll, setScroll] = React.useState('paper');

    const getTenantFspDefaults = useCallback(() => ({
        fspCode: activeTenant?.fspCode || "",
        fspName: activeTenant?.fspName || activeTenant?.tenantName || "",
    }), [activeTenant]);

    const [form, setForm] = useState({
        ...getTenantFspDefaults(),
        ...emptyProductFields,
    });
    const [activeRows, setActiveRows] = useState([])
    // Applied model drives the grid; pending model is what the popover's checkboxes reflect
    // while it's open - toggling a checkbox doesn't touch the grid until Apply is clicked.
    const [columnVisibilityModel, setColumnVisibilityModel] = useState(loadStoredColumnVisibility);
    const [pendingColumnVisibilityModel, setPendingColumnVisibilityModel] = useState(loadStoredColumnVisibility);
    const [columnsMenuAnchor, setColumnsMenuAnchor] = useState(null);
    const [errors, setErrors] = useState({});
    // Format-on-blur for Min/Max Amount: while a field is focused it shows the raw digits
    // being typed (comma-formatting would fight cursor position); on blur it switches to the
    // comma-formatted display via the shared formatNumber utility. `form.minAmount`/
    // `form.maxAmount` themselves always hold the raw value - this tracks display state only.
    const [amountFieldFocus, setAmountFieldFocus] = useState({ minAmount: false, maxAmount: false, otherCharges: false });
    // Tracks which row + action (View/Edit only - the two actions that make a real API call
    // directly on icon click, with no confirm dialog in between) is currently in flight, so
    // the Action column can swap that one icon for a spinner and lock the rest of its row.
    // Delete/Decommission already show equivalent feedback inside their own confirm dialog,
    // which covers the row anyway, so they're intentionally not tracked here.
    const [pendingRowAction, setPendingRowAction] = useState(null); // { rowId, action: 'view' | 'edit' }
    const [editMode, setEditMode] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
    const [discardTarget, setDiscardTarget] = useState(null);
    const [discarding, setDiscarding] = useState(false);
    const [selectedProductCodes, setSelectedProductCodes] = useState([]);
    const [decommissionDialogOpen, setDecommissionDialogOpen] = useState(false);
    const [decommissioning, setDecommissioning] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [savingDraft, setSavingDraft] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewProduct, setReviewProduct] = useState(null);
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);



    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        // Inline validation
        let error = "";
        switch (field) {
            case "productCode":
                if (!value) error = "Product Code is required";
                else if (value.length > 8) error = "Max 8 characters";
                break;
            case "productName":
                if (!value) error = "Product Name is required";
                else if (value.length > 255) error = "Max 255 characters";
                break;
            case "deductionCode":
                if (!value) error = "Deduction Code is required";
                else if (value.length > 10) error = "Max 10 characters";
                break;
            case "minTenure":
            case "maxTenure":
                if (!value) error = "This field is required";
                else if (+value > 999) error = "Max 3 digits";
                break;
            case "interestRate":
            case "processingFee":
            case "insurance":
                if (field !== "processingFee" && !value) error = "This field is required";
                else if (+value > 999.99) error = "Max 3,2 digits";
                break;
            case "minAmount":
            case "maxAmount":
                if (!value) error = "This field is required";
                else if (+value > 99999999999999999999999999999999999999)
                    error = "Max 38,2 digits";
                break;
            case "otherCharges":
                // Optional, like Processing Fee - has a server-side default (50000), so an
                // empty value here is valid (not "This field is required").
                if (value && +value > 99999999999999999999999999999999999999)
                    error = "Max 38,2 digits";
                break;
            case "insuranceType":
                if (!value) error = "Insurance Type is required";
                else if (value.length > 50) error = "Max 50 characters";
                break;
            case "termsCondition":
                if (!form.termsCondition.length) error = "At least one term is required";
                else {
                    form.termsCondition.forEach((t, i) => {
                        if (!t.termNumber || !t.description || !t.effectiveDate) {
                            error = `Term ${i + 1} is incomplete`;
                        }
                    });
                }
                break;
            default:
                return
        }
        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    // Strips anything but digits/decimal point - defends against a comma-formatted value
    // landing back in the field (e.g. pasted in) while it's supposed to hold a raw number.
    const handleAmountChange = (field, rawValue) => {
        handleFormChange(field, rawValue.replace(/[^0-9.]/g, ""));
    };

    const handleAmountFocus = (field) => {
        setAmountFieldFocus((prev) => ({ ...prev, [field]: true }));
    };

    const handleAmountBlur = (field) => {
        setAmountFieldFocus((prev) => ({ ...prev, [field]: false }));
    };

    // Raw digits while focused (so typing/cursor behaves like a normal number field);
    // comma-formatted once blurred. form.minAmount/form.maxAmount themselves are untouched
    // either way - this only decides what's shown in the input.
    const amountDisplayValue = (field) =>
        amountFieldFocus[field] ? form[field] : formatNumber(form[field], { emptyValue: "" });


    const resetForm = () => {
        setForm({
            ...getTenantFspDefaults(),
            ...emptyProductFields,
        });
        setErrors({});
    };

    // toNumberOrUndefined: for a draft, an empty field should stay "not provided" rather than
    // becoming 0 - otherwise the backend's completeness check can't tell "blank" from "zero".
    const toNumberOrUndefined = (v) => (v === "" || v === null || v === undefined ? undefined : Number(v));

    const buildProductPayload = (formData, status = "active") => ({
        status,
        productCode: formData.productCode,
        deductionCode: formData.deductionCode,
        productName: formData.productName,
        productDescription: formData.productDescription || "",
        minTenure: toNumberOrUndefined(formData.minTenure),
        maxTenure: toNumberOrUndefined(formData.maxTenure),
        interestRate: toNumberOrUndefined(formData.interestRate),
        processingFee: formData.processingFee ? Number(formData.processingFee) : 0,
        insurance: toNumberOrUndefined(formData.insurance),
        minAmount: toNumberOrUndefined(formData.minAmount),
        maxAmount: toNumberOrUndefined(formData.maxAmount),
        // Left undefined (not defaulted to 0 here) when omitted, same reasoning as the other
        // toNumberOrUndefined fields - lets the backend's own schema default (50000) apply
        // rather than this form silently forcing 0.
        otherCharges: toNumberOrUndefined(formData.otherCharges),
        repaymentType: formData.repaymentType || "Flat",
        insuranceType: formData.insuranceType,
        forExecutive: formData.forExecutive,
        shariaFacility: formData.shariaFacility,
        termsConditions: (formData.termsCondition || [])
            .filter((term) => term.termNumber || term.description || term.effectiveDate)
            .map((term) => ({
                termsConditionNumber: term.termNumber ? String(term.termNumber) : undefined,
                description: term.description || undefined,
                effectiveDate: term.effectiveDate || undefined,
            })),
        mifosProductId: formData.mifosProductId ? Number(formData.mifosProductId) : undefined,
    });

    const fetchDrafts = useCallback(async () => {
        try {
            // No `active` param here - drafts should surface regardless of isActive so a
            // draft that was previously soft-deleted (isActive: false) is still reachable
            // from the list instead of being invisible everywhere.
            const result = await getRequest(API.PRODUCTS, { params: { status: "draft" } });
            const { success, data } = result.data;
            if (success) setDrafts(data?.products || []);
        } catch (err) {
            // Non-fatal - drafts list just stays empty/stale
        }
    }, []);

    const handleSaveDraft = async () => {
        if (!tenantId || !form.fspCode) {
            toast.error("Select an active tenant before saving products.");
            return;
        }
        setSavingDraft(true);
        const toastId = toast.loading("Saving draft...");
        const payload = buildProductPayload(form, "draft");
        try {
            if (selectedProductId) {
                const result = await putRequest(API.product(selectedProductId), payload);
                const { success, message } = result.data;
                if (!success) {
                    toast.error(message || "Failed to save draft", { id: toastId });
                    return;
                }
            } else {
                const result = await postRequest(API.PRODUCTS, payload);
                const { success, message, data } = result.data;
                if (!success) {
                    toast.error(message || "Failed to save draft", { id: toastId });
                    return;
                }
                setSelectedProductId(data?.product?._id || null);
                setEditMode(true);
            }
            toast.success("Draft saved - you can close this and resume later from Drafts.", { id: toastId });
            fetchDrafts();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message, { id: toastId });
        } finally {
            setSavingDraft(false);
        }
    };

    const handleResumeDraft = (productId) => {
        openEditDialog(productId);
    };

    // Discarding a draft is destructive (same delete endpoint active-product Delete uses),
    // so it gets the same confirm-dialog guard Delete already has, rather than firing on
    // a single click the way the old text button did.
    const openDiscardDialog = (productId) => {
        setDiscardTarget({ id: productId });
        setDiscardDialogOpen(true);
    };

    const handleConfirmDiscard = async () => {
        if (!discardTarget) return;
        setDiscarding(true);
        try {
            const result = await deleteRequest(API.product(discardTarget.id));
            const { success, message } = result.data;
            if (!success) {
                toast.error(message || "Failed to discard draft");
                return;
            }
            toast.success("Draft discarded");
            setDiscardDialogOpen(false);
            setDiscardTarget(null);
            fetchDrafts();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setDiscarding(false);
        }
    };

    const updateProduct = async (productId, formData) => {
        const toastId = toast.loading("Updating product...");
        const payload = buildProductPayload(formData);
        try {
            const result = await putRequest(API.product(productId), payload);
            const { success, message } = result.data;
            if (!success) {
                toast.error(message || "Failed to update product", { id: toastId });
                return { success: false, message };
            }
            toast.success("Product updated successfully!", { id: toastId });
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            toast.error(message, { id: toastId });
            return { success: false, message };
        }
    };

    const createProduct = async (formData) => {
        const toastId = toast.loading("Creating product...");
        const payload = buildProductPayload(formData);

        try {
            const result = await postRequest(API.PRODUCTS, payload);
            console.log('Full API response:', result);

            // Handle ESS response format
            if (result.data && result.data.Document) {
                const essData = result.data.Document.Data;
                const messageDetails = essData.MessageDetails;
                const responseCode = messageDetails.ResponseCode;
                const description = messageDetails.Description;

                const userMessage = getESSErrorMessage(responseCode, description);

                if (!isESSSuccess(responseCode)) {
                    toast.error(userMessage, {
                        id: toastId,
                        autoClose: 5000,
                        position: "top-right"
                    });
                    return { success: false, message: userMessage };
                }

                // Success
                toast.success("Product created successfully!", {
                    id: toastId,
                    autoClose: 3000,
                    position: "top-right"
                });
                return { success: true, data: result.data };

            } else {
                // Handle non-ESS format (your backend errors)
                const { success, message } = result.data;
                if (!success) {
                    toast.error(message, {
                        id: toastId,
                        autoClose: 3000,
                        position: "top-right"
                    });
                    return { success: false, message };
                }

                toast.success("Product created successfully!", {
                    id: toastId,
                    autoClose: 3000,
                    position: "top-right"
                });
                return { success: true, data: result.data };
            }

        } catch (err) {
            console.error('API Error:', err);

            let errorMessage = 'An unexpected error occurred';

            if (err.response) {
                // Server responded with error
                const errorData = err.response.data;

                if (errorData.Document) {
                    // ESS format error
                    const essError = errorData.Document.Data.MessageDetails;
                    errorMessage = getESSErrorMessage(essError.ResponseCode, essError.Description);
                } else if (errorData.message) {
                    // Your backend error
                    errorMessage = errorData.message;
                } else if (errorData.responseCode) {
                    // Alternative error format
                    errorMessage = errorData.description || `Error: ${errorData.responseCode}`;
                }

            } else if (err.request) {
                // Network error
                errorMessage = 'Unable to connect to server. Please check your internet connection.';
            } else {
                // Other errors
                errorMessage = err.message;
            }

            toast.error(errorMessage, {
                id: toastId,
                autoClose: 5000,
                position: "top-right"
            });

            return { success: false, message: errorMessage };
        }
    };





   const handleSaveProduct = async () => {
        if (!tenantId || !form.fspCode) {
            toast.error("Select an active tenant before creating products.");
            return;
        }

        // Check all required fields
        const requiredFields = [
            "productCode",
            "productName",
            "minTenure",
            "maxTenure",
            "interestRate",
            "insurance",
            "minAmount",
            "maxAmount",
            "deductionCode",
            "insuranceType",
            "termsCondition",
        ];
        const newErrors = {};
        requiredFields.forEach((field) => {
            if (!form[field]) {
                newErrors[field] = "This field is required";
            }
        });
        if (!form.termsCondition || form.termsCondition.length === 0) {
            newErrors["termsCondition"] = "At least one term is required";
        }
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const result = editMode
                ? await updateProduct(selectedProductId, form)
                : await createProduct(form);
            if (result?.success) {
                handleClose();
                resetForm();
                setEditMode(false);
                setSelectedProductId(null);
                fetchProducts();
                fetchDrafts();
            }
        }
    };

    const openEditDialog = async (productId) => {
        setPendingRowAction({ rowId: productId, action: 'edit' });
        try {
            const result = await getRequest(API.product(productId));
            const { success, data, message } = result.data;
            if (!success) {
                toast.error(message || "Failed to load product");
                return;
            }
            const p = data?.product || {};
            setForm({
                ...getTenantFspDefaults(),
                productCode: p.productCode || "",
                productName: p.productName || "",
                minTenure: p.minTenure ?? "",
                maxTenure: p.maxTenure ?? "",
                interestRate: p.interestRate ?? "",
                processingFee: p.processingFee ?? "",
                insurance: p.insurance ?? "",
                minAmount: p.minAmount ?? "",
                maxAmount: p.maxAmount ?? "",
                otherCharges: p.otherCharges ?? "",
                repaymentType: p.repaymentType || "",
                insuranceType: p.insuranceType || "",
                productDescription: p.productDescription || "",
                termsCondition: (p.termsConditions || []).map((t) => ({
                    termNumber: t.termsConditionNumber || "",
                    description: t.description || "",
                    effectiveDate: t.effectiveDate ? String(t.effectiveDate).slice(0, 10) : "",
                })),
                forExecutive: !!p.forExecutive,
                shariaFacility: !!p.shariaFacility,
                deductionCode: p.deductionCode || "",
                mifosProductId: p.mifosProductId ?? "",
            });
            setErrors({});
            setEditMode(true);
            setSelectedProductId(productId);
            setOpen(true);
            setScroll('paper');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setPendingRowAction(null);
        }
    };

    const openDeleteDialog = (productId, productName) => {
        setDeleteTarget({ id: productId, name: productName });
        setDeleteDialogOpen(true);
    };

    const openReviewDialog = async (productId) => {
        setPendingRowAction({ rowId: productId, action: 'view' });
        try {
            const result = await getRequest(API.product(productId));
            const { success, data, message } = result.data;
            if (!success) {
                toast.error(message || "Failed to load product");
                return;
            }
            setReviewProduct(data?.product || null);
            setReviewOpen(true);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setPendingRowAction(null);
        }
    };

    const handleEditFromReview = () => {
        const productId = reviewProduct?._id;
        setReviewOpen(false);
        setReviewProduct(null);
        if (productId) openEditDialog(productId);
    };

    const handleRequestSubmit = () => {
        setSubmitConfirmOpen(true);
    };

    const handleConfirmedSubmit = async () => {
        if (!reviewProduct?._id) return;
        setSubmitting(true);
        const toastId = toast.loading("Submitting product to Utumishi...");
        try {
            const result = await postRequest(API.productSubmit(reviewProduct._id));
            const { success, message, data } = result.data;
            if (!success) {
                toast.error(message || "Failed to submit product to Utumishi", { id: toastId });
                if (data?.product) setReviewProduct(data.product);
                return;
            }
            toast.success("Product submitted to Utumishi", { id: toastId });
            setSubmitConfirmOpen(false);
            setReviewOpen(false);
            setReviewProduct(null);
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            toast.error(message, { id: toastId });
            const failedProduct = err.response?.data?.data?.product;
            if (failedProduct) setReviewProduct(failedProduct);
        } finally {
            setSubmitting(false);
            fetchProducts();
        }
    };

    // Drives the existing bulk decommission dialog/confirm flow from a single row's action
    // icon too, rather than duplicating the confirm-and-call logic.
    const openDecommissionDialog = (rowId) => {
        setSelectedProductCodes([rowId]);
        setDecommissionDialogOpen(true);
    };

    const handleDecommissionProducts = async () => {
        const productCodes = loanProducts
            .filter((p) => selectedProductCodes.includes(p.id))
            .map((p) => p.productCode);
        if (productCodes.length === 0) return;

        setDecommissioning(true);
        try {
            const result = await postRequest(API.PRODUCTS_DECOMMISSION, { productCodes });
            const { success, message } = result.data;
            if (!success) {
                toast.error(message || "Failed to decommission products");
                return;
            }
            toast.success(message || `${productCodes.length} product(s) decommissioned`);
            setDecommissionDialogOpen(false);
            setSelectedProductCodes([]);
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setDecommissioning(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const result = await deleteRequest(API.product(deleteTarget.id));
            const { success, message } = result.data;
            if (!success) {
                toast.error(message || "Failed to delete product");
                return;
            }
            toast.success("Product deleted");
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setDeleting(false);
        }
    };


    const fetchProducts = useCallback(async () => {
        try {
            const result = await getRequest(API.ALL_PRODUCTS);
            const { success, data, message } = result.data;

            if (!success) {
                toast.error(message || "Failed to load products");
                return;
            }

            const products = data?.products || [];
            const newData = products.map((p) => ({
                id: p.id || p._id,
                productCode: p.productCode,
                name: p.productName || p.name,
                deductionCode: p.deductionCode,
                minTenure: p.minTenure,
                maxTenure: p.maxTenure,
                minAmount: p.minAmount,
                maxAmount: p.maxAmount,
                interestRate: p.interestRate ?? p.rate,
                processingFee: p.processingFee,
                insurance: p.insurance,
                otherCharges: p.otherCharges,
                repaymentType: p.repaymentType,
                insuranceType: p.insuranceType,
                forExecutive: p.forExecutive ? "Yes" : "No",
                mifosProductId: p.mifosProductId ?? '—',
                utumishiSyncStatus: p.utumishiSyncStatus || "NOT_SUBMITTED",
                status: p.status || "active",
                isActive: p.isActive !== false,
            }));
            setActiveRows(newData);
        } catch (err) {
            toast.error(err.message);
            console.error(err.message);
        }
    }, []);



    const handleAddTerm = () => {
        setForm((prev) => ({
            ...prev,
            termsCondition: [
                ...prev.termsCondition,
                { termNumber: "", description: "", effectiveDate: "" },
            ],
        }));
    };

    const handleRemoveTerm = (index) => {
        setForm((prev) => ({
            ...prev,
            termsCondition: prev.termsCondition.filter((_, i) => i !== index),
        }));
    };

    const handleTermChange = (index, field, value) => {
        const updatedTerms = [...form.termsCondition];
        updatedTerms[index][field] = value;
        setForm((prev) => ({ ...prev, termsCondition: updatedTerms }));
    };



    const handleClickOpen = (scrollType) => () => {
        if (!tenantId) {
            toast.error("Select an active tenant before adding products.");
            return;
        }
        resetForm();
        setEditMode(false);
        setSelectedProductId(null);
        setOpen(true);
        setScroll(scrollType);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const descriptionElementRef = React.useRef(null);
    React.useEffect(() => {
        if (open) {
            const { current: descriptionElement } = descriptionElementRef;
            if (descriptionElement !== null) {
                descriptionElement.focus();
            }
        }
    }, [open]);

    React.useEffect(() => {
        if (open && activeTenant) {
            setForm((prev) => ({
                ...prev,
                ...getTenantFspDefaults(),
            }));
        }
    }, [open, activeTenant, getTenantFspDefaults]);

    // Drafts come back as raw product documents (from GET /products?status=draft), unlike
    // fetchProducts' already-remapped rows - normalize them to the same row shape here so
    // they can sit in the same DataGrid as active/submitted products.
    const draftRows = useMemo(() => drafts.map((p) => ({
        id: p._id,
        productCode: p.productCode,
        name: p.productName || "Untitled draft",
        deductionCode: p.deductionCode,
        minTenure: p.minTenure,
        maxTenure: p.maxTenure,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
        interestRate: p.interestRate,
        processingFee: p.processingFee,
        insurance: p.insurance,
        otherCharges: p.otherCharges,
        repaymentType: p.repaymentType,
        insuranceType: p.insuranceType,
        forExecutive: p.forExecutive ? "Yes" : "No",
        mifosProductId: p.mifosProductId ?? '—',
        utumishiSyncStatus: p.utumishiSyncStatus || "NOT_SUBMITTED",
        status: "draft",
        updatedAt: p.updatedAt,
    })), [drafts]);

    const loanProducts = useMemo(
        () => [...draftRows, ...activeRows],
        [draftRows, activeRows]
    );

    // Renders one Action-column icon with per-row/per-action loading feedback. `action` is
    // 'view' | 'edit' for the two icons that make a real API call directly on click (no confirm
    // dialog in between) - only those two ever show a spinner. `action: null` (Delete,
    // Decommission, Unlock) never spinners itself, but still gets locked/greyed while a
    // View/Edit fetch is in flight for this row, so it can't be clicked mid-fetch.
    const renderActionIcon = (Icon, { row, action = null, onClick, color, titleAccess }) => {
        const isRowBusy = pendingRowAction?.rowId === row.id;
        const isThisPending = isRowBusy && pendingRowAction.action === action;

        if (isThisPending) {
            return <CircularProgress size={18} thickness={5} sx={{ color }} />;
        }

        return (
            <Icon
                sx={{
                    fontSize: 20,
                    color,
                    cursor: isRowBusy ? "default" : "pointer",
                    opacity: isRowBusy ? 0.4 : 1,
                    pointerEvents: isRowBusy ? "none" : "auto",
                }}
                titleAccess={titleAccess}
                onClick={isRowBusy ? undefined : onClick}
            />
        );
    };

    // Status and Action (Review/Edit/etc.) are placed right after the identifying columns -
    // this DataGrid is the free @mui/x-data-grid (v5), which doesn't support column pinning
    // (that's a DataGrid Pro feature), so "always visible without scrolling" has to come from
    // column order instead.
    const columns = [
        { field: "productCode", headerName: "Product Code", width: 120 },
        { field: "mifosProductId", headerName: "MIFOS ID", width: 100 },
        { field: "name", headerName: "Product Name", width: 200 },
        {
            field: "status",
            headerName: "Status",
            width: 170,
            sortable: false,
            renderCell: (params) => {
                const chip = rowStatusChip(params.row);
                return <Chip size="small" label={chip.label} sx={statusPillSx(chip)} variant={chip.variant} />;
            },
        },
        { field: "deductionCode", headerName: "Deduction Code", width: 130 },
        { field: "minTenure", headerName: "Min Tenure", width: 110, align: "right", headerAlign: "right" },
        { field: "maxTenure", headerName: "Max Tenure", width: 110, align: "right", headerAlign: "right" },
        { field: "minAmount", headerName: "Min Amount", width: 130, align: "right", headerAlign: "right", valueFormatter: (v) => formatNumber(v.value) },
        { field: "maxAmount", headerName: "Max Amount", width: 130, align: "right", headerAlign: "right", valueFormatter: (v) => formatNumber(v.value) },
        { field: "interestRate", headerName: "Interest Rate (%)", width: 140, align: "right", headerAlign: "right" },
        { field: "processingFee", headerName: "Processing Fee (%)", width: 150, align: "right", headerAlign: "right" },
        { field: "insurance", headerName: "Insurance (%)", width: 120, align: "right", headerAlign: "right" },
        { field: "otherCharges", headerName: "Other Charges", width: 140, align: "right", headerAlign: "right", valueFormatter: (v) => formatNumber(v.value) },
        { field: "repaymentType", headerName: "Repayment Type", width: 140 },
        { field: "insuranceType", headerName: "Insurance Type", width: 140 },
        { field: "forExecutive", headerName: "For Executive", width: 120 },
        { field: "shariaFacility", headerName: "Sharia Facility", width: 130 },
        {
            field: "action",
            headerName: "Action",
            width: 180,
            sortable: false,
            renderCell: (params) => {
                const row = params.row;

                // Draft: still being filled in - preview via Review, or Resume/Discard.
                if (row.status === "draft") {
                    return (
                        <div className="d-flex justify-content-center gap-2 align-items-center">
                            {renderActionIcon(VisibilityOutlined, { row, action: "view", color: "#98A2B3", titleAccess: "View", onClick: () => openReviewDialog(row.id) })}
                            {renderActionIcon(EditOutlined, { row, action: "edit", color: "#1E3A8A", titleAccess: "Resume editing", onClick: () => handleResumeDraft(row.id) })}
                            {renderActionIcon(DeleteOutline, { row, color: "#B42318", titleAccess: "Discard draft", onClick: () => openDiscardDialog(row.id) })}
                        </div>
                    );
                }

                // Decommissioned: retired, nothing left to do but look at what it was.
                if (row.isActive === false) {
                    return (
                        <div className="d-flex justify-content-center gap-2 align-items-center">
                            {renderActionIcon(VisibilityOutlined, { row, action: "view", color: "#98A2B3", titleAccess: "View", onClick: () => openReviewDialog(row.id) })}
                        </div>
                    );
                }

                // Submitted to Utumishi: live product. Editing/deleting it here wouldn't
                // reach Utumishi, so the only supported actions are viewing it and
                // decommissioning it (which does notify Utumishi).
                if (row.utumishiSyncStatus === "SUBMITTED") {
                    return (
                        <div className="d-flex justify-content-center gap-2 align-items-center">
                            {renderActionIcon(VisibilityOutlined, { row, action: "view", color: "#98A2B3", titleAccess: "View", onClick: () => openReviewDialog(row.id) })}
                            {renderActionIcon(PowerSettingsNewOutlined, { row, color: "error.main", titleAccess: "Decommission", onClick: () => openDecommissionDialog(row.id) })}
                        </div>
                    );
                }

                // Active but not yet submitted (or needs re-submit / retry): full set.
                return (
                    <div className="d-flex justify-content-center gap-2 align-items-center">
                        {renderActionIcon(LockOpenOutlined, { row, color: "#12794A", titleAccess: "Unlock", onClick: () => console.log("Unlock product:", row.id) })}
                        {renderActionIcon(VisibilityOutlined, { row, action: "view", color: "#98A2B3", titleAccess: "View", onClick: () => openReviewDialog(row.id) })}
                        {renderActionIcon(EditOutlined, { row, action: "edit", color: "#1E3A8A", titleAccess: "Edit", onClick: () => openEditDialog(row.id) })}
                        {renderActionIcon(DeleteOutline, { row, color: "#B42318", titleAccess: "Delete", onClick: () => openDeleteDialog(row.id, row.name) })}
                        {renderActionIcon(PowerSettingsNewOutlined, { row, color: "error.main", titleAccess: "Decommission", onClick: () => openDecommissionDialog(row.id) })}
                    </div>
                );
            },
        },
    ];

    const openColumnsMenu = (event) => {
        // Seed the pending copy from what's actually applied, so a previous unsaved edit
        // (from opening the popover, toggling checkboxes, then dismissing without Apply)
        // doesn't linger into the next time it's opened.
        setPendingColumnVisibilityModel(columnVisibilityModel);
        setColumnsMenuAnchor(event.currentTarget);
    };

    const closeColumnsMenu = () => {
        setColumnsMenuAnchor(null);
    };

    const toggleColumnPending = (field) => {
        setPendingColumnVisibilityModel((prev) => ({
            ...prev,
            // Undefined/true both mean "visible" (DataGrid's default), so absence of the key
            // is treated as checked here too.
            [field]: prev[field] === undefined ? false : !prev[field],
        }));
    };

    const applyColumnVisibility = () => {
        setColumnVisibilityModel(pendingColumnVisibilityModel);
        try {
            localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(pendingColumnVisibilityModel));
        } catch {
            // Non-fatal - the selection still applies for this session, just won't persist.
        }
        closeColumnsMenu();
    };

    const paginationModel = { page: 0, pageSize: 5 };

    useEffect(() => {
        fetchProducts()
        fetchDrafts()
    }, [fetchProducts, fetchDrafts])




    return (
        <div className="container">
            <div className="row">
                <div className="col-xs-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2233", letterSpacing: "-0.2px" }}>Product Management</div>
                            <p className="mb-4" style={{ fontSize: 14, color: "#475467", marginTop: 4 }}>
                                Manage product catalog, update product details, and control availability.
                            </p>
                        </div>
                        <Stack direction="row" spacing={2}>
                            {selectedProductCodes.length > 0 && (
                                <button className="custom-button" onClick={() => setDecommissionDialogOpen(true)}>
                                    Decommission Selected ({selectedProductCodes.length})
                                </button>
                            )}
                            <button className="custom-button-outline" onClick={openColumnsMenu}>
                                <ViewColumnOutlined sx={{ fontSize: 18, verticalAlign: "text-bottom", mr: 0.5 }} />
                                Columns
                            </button>
                            <button className="custom-button" onClick={handleClickOpen('paper')}>Add Product</button>
                        </Stack>
                    </div>
                    <Popover
                        open={Boolean(columnsMenuAnchor)}
                        anchorEl={columnsMenuAnchor}
                        onClose={closeColumnsMenu}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                        <Box sx={{ p: 2, width: 260 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Show columns</Typography>
                            <Stack sx={{ maxHeight: 320, overflowY: "auto" }}>
                                {columns.map((col) => (
                                    <FormControlLabel
                                        key={col.field}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={pendingColumnVisibilityModel[col.field] !== false}
                                                onChange={() => toggleColumnPending(col.field)}
                                            />
                                        }
                                        label={col.headerName}
                                    />
                                ))}
                            </Stack>
                            <Divider sx={{ my: 1 }} />
                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                <button className="custom-button-outline" onClick={closeColumnsMenu}>Cancel</button>
                                <button className="custom-button" onClick={applyColumnVisibility}>Apply</button>
                            </Stack>
                        </Box>
                    </Popover>
                    <Paper className="custom-paper">
                        <DataGrid
                            rows={loanProducts}
                            columns={columns}
                            columnVisibilityModel={columnVisibilityModel}
                            onColumnVisibilityModelChange={() => {
                                // Intentionally a no-op - visibility is only ever changed via
                                // the Columns popover's Apply button, not by any built-in
                                // DataGrid UI (there isn't one enabled here) or stray events.
                            }}
                            initialState={{ pagination: { paginationModel } }}
                            pageSizeOptions={[5, 10]}
                            checkboxSelection
                            isRowSelectable={(params) => params.row.status !== "draft" && params.row.isActive !== false}
                            onRowSelectionModelChange={(model) => setSelectedProductCodes(model)}
                            rowSelectionModel={selectedProductCodes}
                            getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? "productRowEven" : "productRowOdd")}
                            sx={{
                                border: 0,
                                "& .productRowOdd": { bgcolor: "#FAFBFC" },
                                "& .MuiDataGrid-columnHeaders": { bgcolor: "#FAFBFC" },
                            }}
                        />
                    </Paper>
                </div>
            </div>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                scroll={scroll}
                aria-labelledby="scroll-dialog-title"
                aria-describedby="scroll-dialog-description"
            >
                <DialogTitle id="scroll-dialog-title" sx={{ borderBottom: '1px solid', borderColor: 'designBorder.subtle' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1A2233' }}>{editMode ? "Edit Product" : "Add Product"}</div>
                    {editMode && form.productName && (
                        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{form.productName}</div>
                    )}
                </DialogTitle>
                <DialogContent dividers={scroll === 'paper'}>
                    <DialogContentText
                        id="scroll-dialog-description"
                        ref={descriptionElementRef}
                        tabIndex={-1}
                    >
                        <Stack spacing={0}>
                            {/* Design-handoff grouped-sections pattern (same shape as ReviewProductModal's
                                FieldGroup): a section label above a responsive grid. Every field below keeps
                                its exact value/onChange/error/helperText prop from before this restyle -
                                only the wrapping layout changed. */}
                            <FormSection title="Tenant">
                                <TextField
                                    label="FSP Code"
                                    fullWidth
                                    size="small"
                                    value={form.fspCode}
                                    disabled
                                    helperText="From active tenant"
                                />
                                <TextField
                                    label="FSP Name"
                                    fullWidth
                                    size="small"
                                    value={form.fspName}
                                    disabled
                                    helperText="From active tenant"
                                />
                            </FormSection>

                            <FormSection title="Identifiers">
                                <TextField
                                    label="Product Code"
                                    fullWidth
                                    size="small"
                                    value={form.productCode}
                                    onChange={(e) => handleFormChange("productCode", e.target.value)}
                                    error={!!errors.productCode}
                                    helperText={errors.productCode}
                                />
                                <TextField
                                    label="Deduction Code"
                                    fullWidth
                                    size="small"
                                    value={form.deductionCode}
                                    onChange={(e) => handleFormChange("deductionCode", e.target.value)}
                                    error={!!errors.deductionCode}
                                    helperText={errors.deductionCode}
                                />
                                <TextField
                                    label="Product Name"
                                    fullWidth
                                    size="small"
                                    sx={{ gridColumn: "1 / -1" }}
                                    value={form.productName}
                                    onChange={(e) => handleFormChange("productName", e.target.value)}
                                    error={!!errors.productName}
                                    helperText={errors.productName}
                                />
                                <TextField
                                    label="MIFOS Product ID"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    sx={{ gridColumn: "1 / -1" }}
                                    value={form.mifosProductId}
                                    onChange={(e) => handleFormChange("mifosProductId", e.target.value)}
                                    helperText="Fineract loan product ID (e.g. 17)"
                                />
                            </FormSection>

                            <FormSection title="Description">
                                <TextField
                                    label="Product Description"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    size="small"
                                    sx={{ gridColumn: "1 / -1" }}
                                    value={form.productDescription}
                                    onChange={(e) => handleFormChange("productDescription", e.target.value)}
                                />
                            </FormSection>

                            <FormSection title="Terms & Pricing">
                                <TextField
                                    label="Min Tenure"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={form.minTenure}
                                    onChange={(e) => handleFormChange("minTenure", e.target.value)}
                                    error={!!errors.minTenure}
                                    helperText={errors.minTenure}
                                />
                                <TextField
                                    label="Max Tenure"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={form.maxTenure}
                                    onChange={(e) => handleFormChange("maxTenure", e.target.value)}
                                    error={!!errors.maxTenure}
                                    helperText={errors.maxTenure}
                                />
                                <TextField
                                    label="Interest Rate (%)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={form.interestRate}
                                    onChange={(e) => handleFormChange("interestRate", e.target.value)}
                                    error={!!errors.interestRate}
                                    helperText={errors.interestRate}
                                />
                                <TextField
                                    label="Processing Fee (%)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={form.processingFee}
                                    onChange={(e) => handleFormChange("processingFee", e.target.value)}
                                    error={!!errors.processingFee}
                                    helperText={errors.processingFee}
                                />
                                <TextField
                                    label="Insurance (%)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={form.insurance}
                                    onChange={(e) => handleFormChange("insurance", e.target.value)}
                                    error={!!errors.insurance}
                                    helperText={errors.insurance}
                                />
                                <FormControl fullWidth size="small">
                                    <InputLabel>Repayment Type</InputLabel>
                                    <Select
                                        value={form.repaymentType}
                                        onChange={(e) => handleFormChange("repaymentType", e.target.value)}
                                    >
                                        <MenuItem value="Flat">Flat</MenuItem>
                                        <MenuItem value="Reducing">Reducing</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth error={!!errors.insuranceType} size="small">
                                    <InputLabel>Insurance Type</InputLabel>
                                    <Select
                                        value={form.insuranceType}
                                        onChange={(e) => handleFormChange("insuranceType", e.target.value)}
                                    >
                                        <MenuItem value="UP_FRONT">Up Front</MenuItem>
                                        <MenuItem value="DISTRIBUTED">Distributed</MenuItem>
                                    </Select>
                                    {errors.insuranceType && <FormHelperText>{errors.insuranceType}</FormHelperText>}
                                </FormControl>
                            </FormSection>

                            <FormSection title="Amounts" last>
                                <TextField
                                    label="Min Amount"
                                    type="text"
                                    inputMode="decimal"
                                    fullWidth
                                    size="small"
                                    value={amountDisplayValue("minAmount")}
                                    onChange={(e) => handleAmountChange("minAmount", e.target.value)}
                                    onFocus={() => handleAmountFocus("minAmount")}
                                    onBlur={() => handleAmountBlur("minAmount")}
                                    error={!!errors.minAmount}
                                    helperText={errors.minAmount}
                                />
                                <TextField
                                    label="Max Amount"
                                    type="text"
                                    inputMode="decimal"
                                    fullWidth
                                    size="small"
                                    value={amountDisplayValue("maxAmount")}
                                    onChange={(e) => handleAmountChange("maxAmount", e.target.value)}
                                    onFocus={() => handleAmountFocus("maxAmount")}
                                    onBlur={() => handleAmountBlur("maxAmount")}
                                    error={!!errors.maxAmount}
                                    helperText={errors.maxAmount}
                                />
                                {/* Other Charges - a flat TZS amount (not a percentage like Interest/
                                    Processing/Insurance above), so it's grouped here with the other
                                    flat-amount fields instead. ess2-internal only - not part of the
                                    PRODUCT_DETAIL message sent to Utumishi. */}
                                <TextField
                                    label="Other Charges (TZS)"
                                    type="text"
                                    inputMode="decimal"
                                    fullWidth
                                    size="small"
                                    sx={{ gridColumn: "1 / -1" }}
                                    value={amountDisplayValue("otherCharges")}
                                    onChange={(e) => handleAmountChange("otherCharges", e.target.value)}
                                    onFocus={() => handleAmountFocus("otherCharges")}
                                    onBlur={() => handleAmountBlur("otherCharges")}
                                    error={!!errors.otherCharges}
                                    helperText={errors.otherCharges}
                                />
                            </FormSection>

                            {/* Not shown in the design's Edit Product mock (its sample content is
                                illustrative only), but real required functionality - kept, grouped
                                the same way as everything else instead of removed. */}
                            <FormSection title="Terms & Conditions" grid={false}>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <h6>Terms & Conditions</h6>
                                        {form?.termsCondition?.length === 0 &&
                                            <button className="custom-button" onClick={handleAddTerm}>+ Add Term</button>
                                        }
                                    </Stack>

                                    <TermsBulkImport
                                        existingCount={form.termsCondition.length}
                                        onImport={(importedTerms) => {
                                            setForm((prev) => ({ ...prev, termsCondition: importedTerms }));
                                            // Clear any stale "At least one term is required" (and per-term)
                                            // error left over from an earlier failed Save - the import just
                                            // replaced the array these errors were about, so they no longer
                                            // describe the current state.
                                            setErrors((prev) => {
                                                const { termsCondition, ...rest } = prev;
                                                return rest;
                                            });
                                            toast.success(`Imported ${importedTerms.length} term(s)`);
                                        }}
                                    />

                                    {form.termsCondition.map((term, index) => (
                                        <>
                                            <Stack direction="row" spacing={2}>
                                                <TextField
                                                    label="Term Number"
                                                    fullWidth
                                                    size="small"
                                                    value={term.termNumber}
                                                    error={!!errors?.termsCondition?.[index]?.termNumber}
                                                    helperText={errors?.termsCondition?.[index]?.termNumber}
                                                    onChange={(e) => handleTermChange(index, "termNumber", e.target.value)}
                                                />
                                                <TextField
                                                    label="Effective Date"
                                                    type="date"
                                                    fullWidth
                                                    size="small"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={term.effectiveDate}
                                                    error={!!errors?.termsCondition?.[index]?.effectiveDate}
                                                    helperText={errors?.termsCondition?.[index]?.effectiveDate}
                                                    onChange={(e) => handleTermChange(index, "effectiveDate", e.target.value)}
                                                />
                                            </Stack>

                                            <TextField
                                                label="Description"
                                                fullWidth
                                                multiline
                                                rows={2}
                                                size="small"
                                                sx={{ mt: 1 }}
                                                error={!!errors?.termsCondition?.[index]?.description}
                                                helperText={errors?.termsCondition?.[index]?.description}
                                                value={term.description}
                                                onChange={(e) => handleTermChange(index, "description", e.target.value)}
                                            />

                                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                                                <DeleteOutline className="icon" sx={{ fontSize: 20 }} onClick={() => handleRemoveTerm(index)} />
                                                {form?.termsCondition.length === index + 1 && (
                                                    <button className="custom-button" onClick={handleAddTerm}>+ Add Term</button>
                                                )}
                                            </Stack>
                                        </>
                                    ))}
                                    {/* Derived live from form.termsCondition rather than the stored `errors`
                                        string - the array is the single source of truth (updated by both
                                        "+ Add Term" and CSV import), so this can never go stale relative to it. */}
                                    {form.termsCondition.length === 0 && (
                                        <FormHelperText error>At least one term is required</FormHelperText>
                                    )}
                                </Stack>
                            </FormSection>

                            <FormSection title="Eligibility" last>
                                <Stack direction="row" spacing={2} sx={{ gridColumn: "1 / -1" }}>
                                    <FormControlLabel
                                        control={<Checkbox checked={form.forExecutive} onChange={(e) => handleFormChange("forExecutive", e.target.checked)} />}
                                        label="For Executive"
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={form.shariaFacility} onChange={(e) => handleFormChange("shariaFacility", e.target.checked)} />}
                                        label="Sharia Facility"
                                    />
                                </Stack>
                            </FormSection>
                        </Stack>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid', borderColor: 'designBorder.subtle', p: '16px 24px' }}>
                    <button className="custom-button-text" onClick={handleClose}>Cancel</button>
                    <button className="custom-button-outline" disabled={savingDraft} onClick={handleSaveDraft}>
                        {savingDraft ? "Saving..." : "Save Draft"}
                    </button>
                    <button className="custom-button" onClick={handleSaveProduct}>{editMode ? "Save" : "Create"}</button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Product</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Delete "{deleteTarget?.name}"? This deactivates the product; it will no longer appear as active.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <button className="custom-button" onClick={() => setDeleteDialogOpen(false)}>Cancel</button>
                    <button className="custom-button" disabled={deleting} onClick={handleDeleteProduct}>
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </DialogActions>
            </Dialog>

            <Dialog open={discardDialogOpen} onClose={() => setDiscardDialogOpen(false)}>
                <DialogTitle>Discard Draft</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Discard this draft? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <button className="custom-button" onClick={() => setDiscardDialogOpen(false)}>Cancel</button>
                    <button className="custom-button" disabled={discarding} onClick={handleConfirmDiscard}>
                        {discarding ? "Discarding..." : "Discard"}
                    </button>
                </DialogActions>
            </Dialog>
            <Dialog open={decommissionDialogOpen} onClose={() => setDecommissionDialogOpen(false)}>
                <DialogTitle>Decommission Products</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Decommission {selectedProductCodes.length} selected product(s)? This deactivates them
                        and sends a PRODUCT_DECOMMISSION notification to ESS/Utumishi for each.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <button className="custom-button" onClick={() => setDecommissionDialogOpen(false)}>Cancel</button>
                    <button className="custom-button" disabled={decommissioning} onClick={handleDecommissionProducts}>
                        {decommissioning ? "Decommissioning..." : "Decommission"}
                    </button>
                </DialogActions>
            </Dialog>

            <ReviewProductModal
                open={reviewOpen}
                product={reviewProduct}
                onClose={() => { setReviewOpen(false); setReviewProduct(null); }}
                onEdit={handleEditFromReview}
                onRequestSubmit={handleRequestSubmit}
            />
            <ProductSubmitConfirmModal
                open={submitConfirmOpen}
                productName={reviewProduct?.productName || reviewProduct?.productCode}
                isRetry={reviewProduct?.utumishiSyncStatus === "SYNC_FAILED"}
                submitting={submitting}
                onCancel={() => setSubmitConfirmOpen(false)}
                onConfirm={handleConfirmedSubmit}
            />
        </div>
    );
};

export default Product;
