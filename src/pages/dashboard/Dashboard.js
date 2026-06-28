import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardOverview, getDashboardActivity, getDashboardMessages } from '../../services/dashboardService';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { toast } from 'react-toastify';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const { tenantId } = useActiveTenant();
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [pendingMessages, setPendingMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = tenantId ? { tenantId } : {};
        const [ov, act, msg] = await Promise.all([
          getDashboardOverview(params),
          getDashboardActivity({ ...params, limit: 8 }),
          getDashboardMessages(),
        ]);
        setOverview(ov.data);
        setActivity(act.data?.logs || []);
        setPendingMessages(msg.data?.pendingCount || 0);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  if (loading) return <Typography sx={{ p: 3 }}>Loading dashboard...</Typography>;

  const kpis = overview?.overview || {};
  const byStatus = overview?.loanStatistics?.byStatus || [];
  const daily = overview?.loanStatistics?.dailyApplications || [];

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h5" sx={{ mb: 2 }}>Dashboard</Typography>
      <div className="row">
        {[
          { title: 'Total Loans', value: kpis.totalLoans ?? 0 },
          { title: 'Tenant Users', value: kpis.totalUsers ?? 0 },
          { title: 'Success Rate %', value: kpis.successRate ?? 0 },
          { title: 'Pending Messages', value: pendingMessages },
        ].map((item) => (
          <div className="col-md-6 col-lg-3 mt-2" key={item.title}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{item.title}</Typography>
                <Typography variant="h4">{item.value}</Typography>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="row mt-3">
        <div className="col-lg-6">
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Loans by Status</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                  {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </div>
        <div className="col-lg-6">
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Applications (7 days)</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={daily}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </div>
      </div>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Recent Activity</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activity.map((log) => (
              <TableRow key={log._id}>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.description}</TableCell>
                <TableCell>{log.status}</TableCell>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!activity.length && (
              <TableRow><TableCell colSpan={4}>No recent activity</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}
