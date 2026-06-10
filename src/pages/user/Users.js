import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { LockOpenIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { getRequest } from "../../ApiFunction";
import API, { BASE_URL } from "../../Api";
import { toast } from "react-toastify";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "username", headerName: "Username", width: 150 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "role", headerName: "Role", width: 120 },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      valueGetter: (params) =>
        new Date(params.row.createdAt).toLocaleString(),
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 180,
      valueGetter: (params) =>
        new Date(params.row.updatedAt).toLocaleString(),
    },
    {
      field: "action",
      headerName: "Action",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex justify-content-center gap-2 align-items-center">
          <LockOpenIcon
            className="icon"
            size={22}
            style={{ cursor: "pointer", color: "green" }}
            onClick={() => console.log("Unlock user:", params.row.id)}
          />
        </div>
      ),
    },
  ];

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getRequest(`${BASE_URL + API.GET_ALL_USERS}`);

      const { status, data, message } = result.data;

      if (!status) {
        toast.error(message || "Failed to fetch users");
        return;
      }

      // Map the API response to match the DataGrid format
      const formattedUsers = data?.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })) || [];

      setUsers(formattedUsers);
    } catch (err) {
      toast.error("Error fetching users: " + err.message);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const rows = users;
  const paginationModel = { page: 0, pageSize: 5 };

  return (
    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          <h5 className="mb-1">User Management</h5>
          <p className="text-muted mb-4">
            List of all users, their roles, status, and available actions.
          </p>
          <Paper className="custom-paper">
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[5, 10]}
              loading={loading}
              sx={{ border: 0 }}
            />
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default Users;
