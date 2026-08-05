import React, { useEffect, useState } from 'react';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import HighlightOffOutlined from '@mui/icons-material/HighlightOffOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Chip, Box,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardOverview, getDashboardActivity, getDashboardMessages } from '../../services/dashboardService';
import { getIntegrationHealth, getMifosPlatformHealth } from '../../services/integrationService';
import { listApiKeys } from '../../services/apiKeyService';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { usePermissions } from '../../hooks/usePermissions';
import { getCached, setCached, DASHBOARD_CACHE_TTL_MS } from '../../utils/performance';
import { toast } from 'react-toastify';
import theme from '../../theme/theme';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ESS_SUMMARY_ICONS = {
  pendingEmployerApproval: <AccessTimeOutlined className="text-warning" sx={{ fontSize: 28 }} />,
  pendingFspApproval: <AccessTimeOutlined sx={{ fontSize: 28, color: 'warning.main' }} />,
  activeLoans: <CheckCircleOutline sx={{ fontSize: 28, color: 'success.main' }} />,
  cancelled: <BlockOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />,
  rejected: <HighlightOffOutlined sx={{ fontSize: 28, color: 'error.main' }} />,
  closedFullyRepaid: <DescriptionOutlined sx={{ fontSize: 28, color: 'primary.main' }} />,
};

export default function Dashboard() {
  const { tenantId } = useActiveTenant();
  const { isPlatformAdmin } = usePermissions();
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [pendingMessages, setPendingMessages] = useState(0);
  const [integrationHealth, setIntegrationHealth] = useState(null);
  const [apiKeyStats, setApiKeyStats] = useState({ total: 0, totalUsage: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = tenantId ? { tenantId } : {};
        const cacheKey = `dashboard-overview-${tenantId || 'platform'}`;
        let ov = getCached(cacheKey);

        const coreResults = await Promise.all([
          ov ? Promise.resolve(ov) : getDashboardOverview(params).then((r) => {
            setCached(cacheKey, r, DASHBOARD_CACHE_TTL_MS);
            return r;
          }),
          getDashboardActivity({ ...params, limit: 8 }),
          getDashboardMessages(params),
        ]);

        const [ovRes, act, msg] = coreResults;
        setOverview(ovRes.data);
        setActivity(act.data?.logs || []);
        setPendingMessages(msg.data?.pendingCount || 0);

        if (tenantId) {
          const [healthResult, keysResult] = await Promise.allSettled([
            getIntegrationHealth(tenantId),
            listApiKeys(tenantId),
          ]);
          if (healthResult.status === 'fulfilled' && healthResult.value) {
            setIntegrationHealth(healthResult.value.data);
          }
          if (keysResult.status === 'fulfilled' && keysResult.value) {
            const keys = keysResult.value.data?.apiKeys || keysResult.value.data?.keys || [];
            setApiKeyStats({
              total: keys.length,
              active: keys.filter((k) => k.status === 'active').length,
              totalUsage: keys.reduce((sum, k) => sum + (k.usageCount || 0), 0),
            });
          }
        } else if (isPlatformAdmin) {
          const healthResult = await Promise.allSettled([getMifosPlatformHealth()]);
          const platform = healthResult[0];
          if (platform.status === 'fulfilled' && platform.value?.data) {
            setIntegrationHealth({
              mifos: { valid: platform.value.data?.data?.healthy, message: 'Platform MIFOS' },
            });
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId, isPlatformAdmin]);

  if (loading) return <Typography sx={{ p: 3 }}>Loading dashboard...</Typography>;

  const kpis = overview?.overview || {};
  const byStatus = overview?.loanStatistics?.byStatus || [];
  const daily = overview?.loanStatistics?.dailyApplications || [];
  const essSummary = overview?.loanStatistics?.essSummary || [];
  const mifosValid = integrationHealth?.mifos?.valid;

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h5" sx={{ mb: 2 }}>Dashboard</Typography>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Loan pipeline (ESS view)</Typography>
      <div className="row">
        {essSummary.map((item) => (
          <div className="col-md-6 col-lg-4 mt-2" key={item.key}>
            <Card sx={{ boxShadow: 'rgba(17, 17, 26, 0.05) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 0px 8px' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">{item.label}</Typography>
                  <Typography variant="h4">{item.count}</Typography>
                </Box>
                {ESS_SUMMARY_ICONS[item.key]}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Operations summary</Typography>
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
        {integrationHealth && (
          <div className="col-lg-4 mt-2">
            <Paper sx={{ p: 2, height: 140 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>MIFOS / Integration Health</Typography>
              <Chip
                label={mifosValid ? 'Connected' : 'Check required'}
                color={mifosValid ? 'success' : 'warning'}
                size="small"
              />
              {integrationHealth.mifos?.baseUrl && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {integrationHealth.mifos.baseUrl}
                </Typography>
              )}
            </Paper>
          </div>
        )}
        {tenantId && (
          <div className="col-lg-4 mt-2">
            <Paper sx={{ p: 2, height: 140 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>API Key Usage</Typography>
              <Typography variant="body2">Active keys: {apiKeyStats.active} / {apiKeyStats.total}</Typography>
              <Typography variant="body2">Total API calls: {apiKeyStats.totalUsage}</Typography>
            </Paper>
          </div>
        )}
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
                <Bar dataKey="applications" fill={theme.palette.primary.main} />
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
