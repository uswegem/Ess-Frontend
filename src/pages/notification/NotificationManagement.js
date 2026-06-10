import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { CheckCircle, RefreshCw } from "lucide-react";

const NotificationManagement = () => {
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "employeeName", headerName: "Employee", width: 180 },
    { field: "loanId", headerName: "Loan ID", width: 120 },
    { field: "message", headerName: "Message", width: 250 },
    {
      field: "status",
      headerName: "Status",
      width: 160,
      renderCell: (params) => (
        <span
          style={{
            color: params.row.status === "success" ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {params.row.status}
        </span>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      valueGetter: (params) =>
        new Date(params.row.createdAt).toLocaleString(),
    },
    {
      field: "action",
      headerName: "Action",
      width: 150,
      sortable: false,
      renderCell: (params) =>
        params.row.status === "failure" ? (
          <RefreshCw
            size={22}
            style={{ cursor: "pointer", color: "orange" }}
            onClick={() => console.log("Resend notification:", params.row.id)}
          />
        ) : (
          <CheckCircle size={22} style={{ color: "green" }} />
        ),
    },
  ];

  const rows = [
    {
      id: 1,
      employeeName: "John Doe",
      loanId: "LN001",
      message: "Loan request submitted successfully.",
      status: "success",
      createdAt: "2025-09-10T12:30:00Z",
    },
    {
      id: 2,
      employeeName: "Jane Smith",
      loanId: "LN002",
      message: "Failed to send loan approval notification.",
      status: "failure",
      createdAt: "2025-09-11T09:15:00Z",
    },
    {
      id: 3,
      employeeName: "Mike Johnson",
      loanId: "LN003",
      message: "Loan closed successfully.",
      status: "success",
      createdAt: "2025-09-12T14:45:00Z",
    },
  ];

  const paginationModel = { page: 0, pageSize: 5 };

  return (
    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          <h5 className="mb-1">Notification Management</h5>
          <p className="text-muted mb-4">
            List of all loan notifications, their status, and available actions.
          </p>
          <Paper className="custom-paper">
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[5, 10]}
              sx={{ border: 0 }}
            />
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
