import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
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
} from "@mui/material";
import { getRequest, postRequest, putRequest, deleteRequest } from "../../ApiFunction";
import API from "../../Api";
import { toast } from "react-toastify";
import { getESSErrorMessage, isESSSuccess } from "../../utils/essErrorHandler";
import { useActiveTenant } from "../../hooks/useActiveTenant";
import TermsBulkImport from "./components/TermsBulkImport";
import ReviewProductModal from "./components/ReviewProductModal";
import ProductSubmitConfirmModal from "./components/ProductSubmitConfirmModal";

// Combined status shown in the products list: `status` (draft/active - form completeness)
// and `utumishiSyncStatus` (whether Utumishi has the current data) together decide the chip.
const rowStatusChip = (row) => {
    if (row.status === "draft") return { label: "Draft", color: "default", variant: "outlined" };
    if (row.utumishiSyncStatus === "SYNC_FAILED") return { label: "Sync failed", color: "error" };
    if (row.utumishiSyncStatus === "SUBMITTED") return { label: "Submitted", color: "success" };
    if (row.utumishiSyncStatus === "EDITED_SINCE_SUBMIT") return { label: "Edited since submit", color: "warning" };
    return { label: "Not submitted", color: "default" };
};

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
    const [errors, setErrors] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
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

    const handleDiscardDraft = async (productId) => {
        try {
            const result = await deleteRequest(API.product(productId));
            const { success, message } = result.data;
            if (!success) {
                toast.error(message || "Failed to discard draft");
                return;
            }
            toast.success("Draft discarded");
            fetchDrafts();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
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
        }
    };

    const openDeleteDialog = (productId, productName) => {
        setDeleteTarget({ id: productId, name: productName });
        setDeleteDialogOpen(true);
    };

    const openReviewDialog = async (productId) => {
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
                repaymentType: p.repaymentType,
                insuranceType: p.insuranceType,
                forExecutive: p.forExecutive ? "Yes" : "No",
                mifosProductId: p.mifosProductId ?? '—',
                utumishiSyncStatus: p.utumishiSyncStatus || "NOT_SUBMITTED",
                status: p.status || "active",
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

    const columns = [
        { field: "productCode", headerName: "Product Code", width: 120 },
        { field: "mifosProductId", headerName: "MIFOS ID", width: 100 },
        { field: "name", headerName: "Product Name", width: 200 },
        { field: "deductionCode", headerName: "Deduction Code", width: 130 },
        { field: "minTenure", headerName: "Min Tenure", width: 110 },
        { field: "maxTenure", headerName: "Max Tenure", width: 110 },
        { field: "minAmount", headerName: "Min Amount", width: 130 },
        { field: "maxAmount", headerName: "Max Amount", width: 130 },
        { field: "interestRate", headerName: "Interest Rate (%)", width: 140 },
        { field: "processingFee", headerName: "Processing Fee (%)", width: 150 },
        { field: "insurance", headerName: "Insurance (%)", width: 120 },
        { field: "repaymentType", headerName: "Repayment Type", width: 140 },
        { field: "insuranceType", headerName: "Insurance Type", width: 140 },
        { field: "forExecutive", headerName: "For Executive", width: 120 },
        { field: "shariaFacility", headerName: "Sharia Facility", width: 130 },
        {
            field: "status",
            headerName: "Status",
            width: 170,
            sortable: false,
            renderCell: (params) => {
                const chip = rowStatusChip(params.row);
                return <Chip size="small" label={chip.label} color={chip.color} variant={chip.variant} />;
            },
        },
        {
            field: "action",
            headerName: "Action",
            width: 180,
            sortable: false,
            renderCell: (params) => (
                params.row.status === "draft" ? (
                    <div className="d-flex justify-content-center gap-2 align-items-center">
                        <VisibilityOutlined
                            sx={{ fontSize: 20, cursor: "pointer", color: "gray" }}
                            onClick={() => openReviewDialog(params.row.id)}
                        />
                        <button className="custom-button" onClick={() => handleResumeDraft(params.row.id)}>Resume</button>
                        <button className="custom-button" onClick={() => handleDiscardDraft(params.row.id)}>Discard</button>
                    </div>
                ) : (
                    <div className="d-flex justify-content-center gap-2 align-items-center">
                        <LockOpenOutlined
                            sx={{ fontSize: 20, cursor: "pointer", color: "green" }}
                            onClick={() => console.log("Unlock product:", params.row.id)}
                        />
                        <VisibilityOutlined
                            sx={{ fontSize: 20, cursor: "pointer", color: "gray" }}
                            onClick={() => openReviewDialog(params.row.id)}
                        />
                        <EditOutlined
                            sx={{ fontSize: 20, cursor: "pointer", color: "blue" }}
                            onClick={() => openEditDialog(params.row.id)}
                        />
                        <DeleteOutline
                            sx={{ fontSize: 20, cursor: "pointer", color: "red" }}
                            onClick={() => openDeleteDialog(params.row.id, params.row.name)}
                        />
                    </div>
                )
            ),
        },
    ];



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
                            <h5 className="mb-1">Product Management</h5>
                            <p className="text-muted mb-4">
                                Manage product catalog, update product details, and control availability.
                            </p>
                        </div>
                        <Stack direction="row" spacing={2}>
                            {selectedProductCodes.length > 0 && (
                                <button className="custom-button" onClick={() => setDecommissionDialogOpen(true)}>
                                    Decommission Selected ({selectedProductCodes.length})
                                </button>
                            )}
                            <button className="custom-button" onClick={handleClickOpen('paper')}>Add Product</button>
                        </Stack>
                    </div>
                    <Paper className="custom-paper">
                        <DataGrid
                            rows={loanProducts}
                            columns={columns}
                            initialState={{ pagination: { paginationModel } }}
                            pageSizeOptions={[5, 10]}
                            checkboxSelection
                            isRowSelectable={(params) => params.row.status !== "draft"}
                            onRowSelectionModelChange={(model) => setSelectedProductCodes(model)}
                            rowSelectionModel={selectedProductCodes}
                            sx={{ border: 0 }}
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
                <DialogTitle id="scroll-dialog-title">{editMode ? "Edit Product" : "Add Product"}</DialogTitle>
                <DialogContent dividers={scroll === 'paper'}>
                    <DialogContentText
                        id="scroll-dialog-description"
                        ref={descriptionElementRef}
                        tabIndex={-1}
                    >
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={2}>
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
                            </Stack>
                            {/* Product Code */}
                            <TextField
                                label="Product Code"
                                fullWidth
                                size="small"
                                value={form.productCode}
                                onChange={(e) => handleFormChange("productCode", e.target.value)}
                                error={!!errors.productCode}
                                helperText={errors.productCode}
                            />
                            {/* Product Name */}
                            <TextField
                                label="Product Name"
                                fullWidth
                                size="small"
                                value={form.productName}
                                onChange={(e) => handleFormChange("productName", e.target.value)}
                                error={!!errors.productName}
                                helperText={errors.productName}
                            />
                            {/* Deduction Code */}
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
                                label="MIFOS Product ID"
                                type="number"
                                fullWidth
                                size="small"
                                value={form.mifosProductId}
                                onChange={(e) => handleFormChange("mifosProductId", e.target.value)}
                                helperText="Fineract loan product ID (e.g. 17)"
                            />
                            {/* Product Description */}
                            <TextField
                                label="Product Description"
                                fullWidth
                                multiline
                                rows={3}
                                size="small"
                                value={form.productDescription}
                                onChange={(e) => handleFormChange("productDescription", e.target.value)}
                            />
                            {/* Tenure */}
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
                            {/* Interest, Processing, Insurance */}
                            <Stack direction="row" spacing={2}>
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
                            </Stack>
                            {/* Min/Max Amount */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Min Amount"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={form.minAmount}
                                    onChange={(e) => handleFormChange("minAmount", e.target.value)}
                                    error={!!errors.minAmount}
                                    helperText={errors.minAmount}
                                />
                                <TextField
                                    label="Max Amount"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={form.maxAmount}
                                    onChange={(e) => handleFormChange("maxAmount", e.target.value)}
                                    error={!!errors.maxAmount}
                                    helperText={errors.maxAmount}
                                />
                            </Stack>
                            {/* Repayment Type */}
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
                            {/* Insurance Type */}
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
                            {/* Terms & Conditions */}
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
                            {/* Checkboxes */}
                            <Stack direction="row" spacing={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={form.forExecutive} onChange={(e) => handleFormChange("forExecutive", e.target.checked)} />}
                                    label="For Executive"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={form.shariaFacility} onChange={(e) => handleFormChange("shariaFacility", e.target.checked)} />}
                                    label="Sharia Facility"
                                />
                            </Stack>
                        </Stack>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <button className="custom-button" onClick={handleClose}>Cancel</button>
                    <button className="custom-button" disabled={savingDraft} onClick={handleSaveDraft}>
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
