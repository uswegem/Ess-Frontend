import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getAuditLogs } from '../../services/dashboardService';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { toast } from 'react-toastify';

export default function AuditLogs() {
  const { tenantId } = useActiveTenant();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = { limit: 50 };
        if (tenantId) params.tenantId = tenantId;
        const result = await getAuditLogs(params);
        const logs = (result.data?.logs || []).map((l) => ({
          id: l._id,
          action: l.action,
          description: l.description,
          status: l.status,
          createdAt: l.createdAt,
        }));
        setRows(logs);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  const columns = [
    { field: 'action', headerName: 'Action', width: 160 },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'createdAt',
      headerName: 'Time',
      width: 180,
      valueGetter: (p) => new Date(p.row.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="p-3">
      <Typography variant="h5" sx={{ mb: 2 }}>Audit Logs</Typography>
      <Paper sx={{ height: 520 }}>
        <DataGrid rows={rows} columns={columns} loading={loading} pageSizeOptions={[25, 50]} />
      </Paper>
    </div>
  );
}
