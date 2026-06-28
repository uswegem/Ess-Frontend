import React, { useEffect, useState } from 'react';
import { Paper, Button } from '@mui/material';
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
    { field: 'status', headerName: 'Status', width: 120 },
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
      renderCell: (p) => p.row.status === 'unread' && (
        <Button size="small" onClick={() => markRead(p.row.id)}>Mark read</Button>
      ),
    },
  ];

  return (
    <div className="p-3">
      <h5 className="mb-3">Notifications</h5>
      <Paper sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} loading={loading} pageSizeOptions={[10, 25]} />
      </Paper>
    </div>
  );
}
