import React, { useCallback, useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { Tooltip } from "@mui/material";
import {
  Trash2,
  PlusCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { getRequest } from "../../ApiFunction";
import API, { BASE_URL } from "../../Api";
import { toast } from "react-toastify";

const LoanListing = () => {
  const columns = [
    { field: "id", headerName: "Loan ID", width: 120 },
    { field: "accountNo", headerName: "Account No", width: 150 },
    { field: "loanProductName", headerName: "Product", width: 180 },
    { field: "clientName", headerName: "Client", width: 200 },
    { field: "principal", headerName: "Amount", width: 150 },
    {
      field: "tenure",
      headerName: "Tenure",
      width: 160,
      valueGetter: (params) =>
        `${params.row.termFrequency} ${params.row.termPeriodFrequencyType?.value || "Months"}`
    },
    { field: "numberOfRepayments", headerName: "Repayments", width: 150 },
    { field: "annualInterestRate", headerName: "Interest (%)", width: 160 },
    {
      field: "status",
      headerName: "Status",
      width: 220,
      valueGetter: (params) => params.row.status?.value,
      renderCell: (params) => {
        const statusColors = {
          "Submitted and pending approval": "orange",
          Active: "green",
          Closed: "gray",
          Rejected: "red",
        };
        return (
          <span
            style={{
              color: statusColors[params.value] || "black",
              fontWeight: 600,
            }}
          >
            {params.value}
          </span>
        );
      },
    },
    {
      field: "submittedOnDate",
      headerName: "Submitted On",
      width: 180,
      valueGetter: (params) =>
        params.row.timeline?.submittedOnDate?.join("-") || "N/A"
    },
    {
      field: "expectedMaturityDate",
      headerName: "Maturity Date",
      width: 180,
      valueGetter: (params) =>
        params.row.timeline?.expectedMaturityDate?.join("-") || "N/A"
    },
    {
      field: "action",
      headerName: "Actions",
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex gap-2">
          <Tooltip title="View Loan">
            <Eye
              size={20}
              style={{ cursor: "pointer", color: "black" }}
              onClick={() => console.log("View Loan:", params.row.id)}
            />
          </Tooltip>
          <Tooltip title="Top-Up">
            <PlusCircle
              size={20}
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => console.log("Top-Up Loan:", params.row.id)}
            />
          </Tooltip>
          <Tooltip title="Takeover">
            <RefreshCw
              size={20}
              style={{ cursor: "pointer", color: "purple" }}
              onClick={() => console.log("Takeover Loan:", params.row.id)}
            />
          </Tooltip>
          <Tooltip title="Cancel">
            <Trash2
              size={20}
              style={{ cursor: "pointer", color: "red" }}
              onClick={() => console.log("Cancel Loan:", params.row.id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // const rows = [
  //   {
  //     id: "LN001",
  //     product: "Personal Loan",
  //     amount: "₹50,000",
  //     tenure: 12,
  //     emi: "₹4,500",
  //     status: "Pending Employer Approval",
  //   },
  //   {
  //     id: "LN002",
  //     product: "Car Loan",
  //     amount: "₹75,000",
  //     tenure: 24,
  //     emi: "₹3,800",
  //     status: "Pending FSP Approval",
  //   },
  //   {
  //     id: "LN003",
  //     product: "Home Loan",
  //     amount: "₹2,00,000",
  //     tenure: 60,
  //     emi: "₹5,200",
  //     status: "Active",
  //   },
  //   {
  //     id: "LN004",
  //     product: "Education Loan",
  //     amount: "₹30,000",
  //     tenure: 18,
  //     emi: "₹2,100",
  //     status: "Cancelled",
  //   },
  //   {
  //     id: "LN005",
  //     product: "Business Loan",
  //     amount: "₹1,50,000",
  //     tenure: 36,
  //     emi: "₹4,800",
  //     status: "Rejected",
  //   },
  //   {
  //     id: "LN006",
  //     product: "Mortgage Loan",
  //     amount: "₹5,00,000",
  //     tenure: 120,
  //     emi: "₹7,200",
  //     status: "Closed (fully repaid)",
  //   },
  // ];

  const [rows, setRows] = useState([])

  const fetchLoans = useCallback(async (event) => {
    try {
      const result = await getRequest(`${BASE_URL + API.ALL_EMPLOYEES_LOAN}`);
      const { status, data, message } = result.data;

      if (!status) {
        toast.error(message);
        return;
      }
      const newData = data?.pageItems?.map((p) => ({
        id: p.id,
        accountNo: p.accountNo,
        clientName: p.clientName,
        loanProductName: p.loanProductName,
        currency: p.currency?.code,
        principal: p.principal,
        approvedPrincipal: p.approvedPrincipal,
        annualInterestRate: p.annualInterestRate,
        repaymentFrequency: `${p.repaymentEvery} ${p.repaymentFrequencyType?.value || ""}`,
        numberOfRepayments: p.numberOfRepayments,
        tenure: `${p.termFrequency} ${p.termPeriodFrequencyType?.value || ""}`,
        amortization: p.amortizationType?.value,
        interestType: p.interestType?.value,
        status: p.status?.value,
        submittedOnDate: p.timeline?.submittedOnDate
          ? new Date(
            p.timeline.submittedOnDate[0],
            p.timeline.submittedOnDate[1] - 1,
            p.timeline.submittedOnDate[2]
          ).toISOString()
          : null,
        expectedDisbursementDate: p.timeline?.expectedDisbursementDate
          ? new Date(
            p.timeline.expectedDisbursementDate[0],
            p.timeline.expectedDisbursementDate[1] - 1,
            p.timeline.expectedDisbursementDate[2]
          ).toISOString()
          : null,
        expectedMaturityDate: p.timeline?.expectedMaturityDate
          ? new Date(
            p.timeline.expectedMaturityDate[0],
            p.timeline.expectedMaturityDate[1] - 1,
            p.timeline.expectedMaturityDate[2]
          ).toISOString()
          : null,
      }));

      setRows(newData || [])
    } catch (err) {
      toast.error(err.message);
      console.error(err.message);
    }
  }, []);


  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  return (
    <div className="container">
      <h5 className="mb-1">Loan Management</h5>
      <p className="text-muted mb-4">
        Review all employee loans, their current status, and available actions.
      </p>
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[5, 10]}
          autoHeight
          sx={{ border: 0 }}
        />
      </Paper>
    </div>
  );
};

export default LoanListing;
