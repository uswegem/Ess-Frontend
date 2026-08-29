import React, { useEffect, useState } from 'react';
import { Paper, Button, Box, Typography, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getRequest, putRequest } from '../../ApiFunction';
import API from '../../Api';
import { toast } from 'react-toastify';

export default function NotificationManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await getRequest(API.NOTIFICATIONS);
      const list = (data.data?.notifications || data.data || []).map((n, i) => ({
        id: n._id || i,
        message: n.message || n.title || n.body,
        status: n.read ? 'read' : 'unread',
        createdAt: n.createdAt,
        raw: n,
      }));
      setRows(list);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await putRequest(API.notificationRead(id), {});
      toast.success('Marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const columns = [
    { field: 'message', headerName: 'Message', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      sortable: false,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value}
          sx={p.value === 'read'
            ? { bgcolor: 'statusPill.gray.bg', color: 'statusPill.gray.text' }
            : { bgcolor: 'statusPill.indigo.bg', color: 'statusPill.indigo.text' }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueGetter: (p) => (p.row.createdAt ? new Date(p.row.createdAt).toLocaleString() : ''),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 140,
      sortable: false,
      renderCell: (p) => p.row.status === 'unread' && (
        <Button size="small" onClick={() => markRead(p.row.id)} sx={{ textTransform: 'none', fontWeight: 600 }}>Mark read</Button>
      ),
    },
  ];

  return (
    <div className="p-3">
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.2px', mb: 2.5 }}>Notifications</Typography>
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25]}
          components={{
            NoRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Box sx={{ fontSize: 24, mb: 1 }}>🔔</Box>
                <Typography sx={{ fontSize: 14, color: 'text.muted' }}>No rows</Typography>
              </Box>
            ),
          }}
          sx={{
            border: 0,
            width: '100%',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAFBFC' },
          }}
        />
      </Paper>
    </div>
  );
}
