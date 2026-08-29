import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Paper, Typography, TextField, MenuItem, Chip } from '@mui/material';
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

  const loadLogs = useCallback(async (filters = {}) => {
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
  }, [tenantId, actionFilter, statusFilter]);

  const debouncedLoad = useMemo(() => debounce((filters) => loadLogs(filters), 400), [loadLogs]);

  useEffect(() => {
    debouncedLoad();
  }, [tenantId, actionFilter, statusFilter, debouncedLoad]);

  const columns = [
    { field: 'action', headerName: 'Action', width: 160, renderCell: (p) => <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#475467' }}>{p.value}</span> },
    { field: 'description', headerName: 'Description', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      sortable: false,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value}
          sx={p.value === 'success'
            ? { bgcolor: 'statusPill.green.bg', color: 'statusPill.green.text' }
            : { bgcolor: 'statusPill.red.bg', color: 'statusPill.red.text' }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Time',
      width: 190,
      valueGetter: (p) => new Date(p.row.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="p-3">
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.2px', mb: 2.5 }}>Audit Logs</Typography>
      <Paper sx={{ p: '16px 20px', mb: 2, display: 'flex', gap: 1.75, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Filter by action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          aria-label="Filter audit logs by action"
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="success">Success</MenuItem>
          <MenuItem value="failure">Failure</MenuItem>
        </TextField>
      </Paper>
      <Paper sx={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50]}
          getRowClassName={(p) => (p.indexRelativeToCurrentPage % 2 === 0 ? 'auditRowEven' : 'auditRowOdd')}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAFBFC' },
            '& .auditRowOdd': { bgcolor: '#FAFBFC' },
          }}
        />
      </Paper>
    </div>
  );
}
