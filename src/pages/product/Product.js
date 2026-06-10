import React, { useCallback, useEffect, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { Delete, Edit, LockOpen, Trash2 } from "lucide-react";
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
} from "@mui/material";
import { getRequest, postRequest } from "../../ApiFunction";
import API, { BASE_URL } from "../../Api";
import { toast } from "react-toastify";
import { getESSErrorMessage, isESSSuccess } from "../../utils/essErrorHandler";

const Product = () => {
    const [open, setOpen] = React.useState(false);
    const [scroll, setScroll] = React.useState('paper');
    const [form, setForm] = useState({
        fspCode: "",
        fspName: "",
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
    });
    const [loanProducts, setLoanProducts] = useState([])
    const [errors, setErrors] = useState({});



    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        // Inline validation
        let error = "";
        switch (field) {
            case "fspCode":
                if (!value) error = "FSP Code is required";
                else if (value.length > 10) error = "Max 10 characters";
                break;
            case "fspName":
                if (!value) error = "FSP Name is required";
                else if (value.length > 100) error = "Max 100 characters";
                break;
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

 
    const createProduct = async (formData) => {
        const toastId = toast.loading("Creating product...");

        try {
            const result = await postRequest(`${BASE_URL + API.CREATE_PRODUCT}`, formData);
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
        // Check all required fields
        const requiredFields = [
            "fspCode",
            "fspName",
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
            createProduct(form)
        }
    };


    const fetchProducts = useCallback(async (event) => {
        try {
            const result = await getRequest(`${BASE_URL + API.ALL_PRODUCTS}`);

            const { status, data, message } = result.data;

            if (!status) {
                toast.error(message);
                return;
            }
            const newData = data.map((p) => ({
                id: p.id,
                name: p.name,
                shortName: p.shortName,
                currency: p.currency.code,
                principal: p.principal,
                minPrincipal: p.minPrincipal,
                maxPrincipal: p.maxPrincipal,
                interestRate: p.annualInterestRate,
                repayments: p.numberOfRepayments,
                repaymentFrequency: `${p.repaymentEvery} ${p.repaymentFrequencyType.value}`,
                amortization: p.amortizationType.value,
                interestType: p.interestType.value,
                startDate: new Date(p.startDate[0], p.startDate[1] - 1, p.startDate[2]).toISOString(),
                status: p.status,
            }));
            setLoanProducts(newData || [])
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

    const columns = [
        { field: "id", headerName: "ID", width: 70 },
        { field: "name", headerName: "Product Name", width: 200 },
        { field: "shortName", headerName: "Short Name", width: 120 },
        { field: "currency", headerName: "Currency", width: 100 },
        { field: "principal", headerName: "Principal", width: 140 },
        { field: "minPrincipal", headerName: "Min Principal", width: 140 },
        { field: "maxPrincipal", headerName: "Max Principal", width: 160 },
        { field: "interestRate", headerName: "Interest Rate (%)", width: 160 },
        { field: "repayments", headerName: "No. of Repayments", width: 180 },
        { field: "repaymentFrequency", headerName: "Repayment Frequency", width: 200 },
        { field: "amortization", headerName: "Amortization", width: 180 },
        { field: "interestType", headerName: "Interest Type", width: 180 },
        {
            field: "startDate",
            headerName: "Start Date",
            width: 160,
            valueGetter: (params) => new Date(params.row.startDate).toLocaleDateString(),
        },
        { field: "status", headerName: "Status", width: 180 },
        {
            field: "action",
            headerName: "Action",
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <div className="d-flex justify-content-center gap-2 align-items-center">
                    <LockOpen
                        size={20}
                        style={{ cursor: "pointer", color: "green" }}
                        onClick={() => console.log("Unlock product:", params.row.id)}
                    />
                    <Edit
                        size={20}
                        style={{ cursor: "pointer", color: "blue" }}
                        onClick={() => console.log("Edit product:", params.row.id)}
                    />
                    <Delete
                        size={20}
                        style={{ cursor: "pointer", color: "red" }}
                        onClick={() => console.log("Delete product:", params.row.id)}
                    />
                </div>
            ),
        },
    ];



    const paginationModel = { page: 0, pageSize: 5 };

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])




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
                        <button className="custom-button" onClick={handleClickOpen('paper')}>Add Product</button>
                    </div>
                    <Paper className="custom-paper">
                        <DataGrid
                            rows={loanProducts}
                            columns={columns}
                            initialState={{ pagination: { paginationModel } }}
                            pageSizeOptions={[5, 10]}
                            // checkboxSelection
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
                <DialogTitle id="scroll-dialog-title">Add Product</DialogTitle>
                <DialogContent dividers={scroll === 'paper'}>
                    <DialogContentText
                        id="scroll-dialog-description"
                        ref={descriptionElementRef}
                        tabIndex={-1}
                    >
                        <Stack spacing={2}>
                            {/* FSP Code */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="FSP Code"
                                    fullWidth
                                    size="small"
                                    value={form.fspCode}
                                    onChange={(e) => handleFormChange("fspCode", e.target.value)}
                                    error={!!errors.fspCode}
                                    helperText={errors.fspCode}
                                />
                                {/* FSP Name */}
                                <TextField
                                    label="FSP Name"
                                    fullWidth
                                    size="small"
                                    value={form.fspName}
                                    onChange={(e) => handleFormChange("fspName", e.target.value)}
                                    error={!!errors.fspName}
                                    helperText={errors.fspName}
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
                                            <Trash2 className="icon" size={20} onClick={() => handleRemoveTerm(index)} />
                                            {form?.termsCondition.length === index + 1 && (
                                                <button className="custom-button" onClick={handleAddTerm}>+ Add Term</button>
                                            )}
                                        </Stack>
                                    </>
                                ))}
                                {errors.termsCondition && (
                                    <FormHelperText error>{errors.termsCondition}</FormHelperText>
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
                    <button className="custom-button" onClick={handleSaveProduct}>Create</button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Product;
