import React, { useEffect, useState, useMemo } from 'react';
import { Paper, Typography, TextField, MenuItem } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getAuditLogs } from '../../services/auditLogService';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { debounce } from '../../utils/performance';
import { toast } from 'react-toastify';

export default function AuditLogs() {
  const { tenantId } = useActiveTenant();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadLogs = async (filters = {}) => {
    try {
      setLoading(true);
      const params = { limit: 50, ...filters };
      if (tenantId) params.tenantId = tenantId;
      if (actionFilter) params.action = actionFilter;
      if (statusFilter) params.status = statusFilter;
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

  const debouncedLoad = useMemo(() => debounce((filters) => loadLogs(filters), 400), [tenantId, actionFilter, statusFilter]);

  useEffect(() => {
    debouncedLoad();
  }, [tenantId, actionFilter, statusFilter, debouncedLoad]);

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
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Filter by action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          aria-label="Filter audit logs by action"
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="success">Success</MenuItem>
          <MenuItem value="failure">Failure</MenuItem>
        </TextField>
      </Paper>
      <Paper sx={{ height: 520 }}>
        <DataGrid rows={rows} columns={columns} loading={loading} pageSizeOptions={[25, 50]} />
      </Paper>
    </div>
  );
}
