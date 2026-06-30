import React, { useCallback, useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { IconButton, Tooltip } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { getRequest } from '../../ApiFunction';
import API from '../../Api';
import { toast } from 'react-toastify';

const STATUS_COLORS = {
  DISBURSED: 'green',
  OFFER_SUBMITTED: 'orange',
  LOAN_CREATED: 'blue',
  FAILED: 'red',
  CANCELLED: 'gray',
};

function clientDisplayName(loan) {
  const c = loan.clientData;
  if (!c) return '—';
  return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ') || c.checkNumber || '—';
}

const LoanListing = () => {
  const columns = [
    { field: 'essApplicationNumber', headerName: 'Application #', width: 160 },
    { field: 'mifosLoanAccountNumber', headerName: 'MIFOS Account', width: 140 },
    { field: 'productCode', headerName: 'Product', width: 100 },
    {
      field: 'clientName',
      headerName: 'Client',
      width: 200,
      valueGetter: (params) => params.row.clientName,
    },
    {
      field: 'requestedAmount',
      headerName: 'Amount',
      width: 120,
      valueGetter: (params) =>
        params.row.requestedAmount != null
          ? Number(params.row.requestedAmount).toLocaleString()
          : '—',
    },
    { field: 'tenure', headerName: 'Tenure (mo)', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: (params) => (
        <span style={{ color: STATUS_COLORS[params.value] || 'black', fontWeight: 600 }}>
          {params.value || 'Unknown'}
        </span>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 170,
      valueGetter: (params) =>
        params.row.createdAt ? new Date(params.row.createdAt).toLocaleString() : '—',
    },
    {
      field: 'mifosLoanId',
      headerName: 'MIFOS Loan ID',
      width: 120,
    },
  ];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRequest(API.ALL_EMPLOYEES_LOAN);
      const { success, data, message } = result.data;

      if (!success) {
        toast.error(message || 'Failed to load loans');
        return;
      }

      const newData = (data?.loans || []).map((loan) => ({
        id: loan._id,
        essApplicationNumber: loan.essApplicationNumber,
        mifosLoanAccountNumber: loan.mifosLoanAccountNumber || '—',
        mifosLoanId: loan.mifosLoanId || '—',
        productCode: loan.productCode,
        clientName: clientDisplayName(loan),
        requestedAmount: loan.requestedAmount,
        tenure: loan.tenure,
        status: loan.status,
        createdAt: loan.createdAt,
      }));

      setRows(newData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">Loan Management</h5>
          <p className="text-muted mb-0">
            Tenant-scoped loan mappings linked to ESS applications and MIFOS.
          </p>
        </div>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchLoans} aria-label="Refresh loans">
            <RefreshCw size={20} />
          </IconButton>
        </Tooltip>
      </div>
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          autoHeight
          sx={{ border: 0 }}
        />
      </Paper>
    </div>
  );
};

export default LoanListing;
