import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import HighlightOffOutlined from '@mui/icons-material/HighlightOffOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import PercentOutlined from '@mui/icons-material/PercentOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import MarkEmailReadOutlined from '@mui/icons-material/MarkEmailReadOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
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
import { formatCurrency, formatNumber } from '../../utils/formatAmount';
import { toast } from 'react-toastify';
import theme from '../../theme/theme';
import DateRangeControl from '../../components/DateRangeControl';
import { computeRange, loadStoredRangeSelection } from '../../utils/dashboardDateRange';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ESS_SUMMARY_ICONS = {
  pendingEmployerApproval: <AccessTimeOutlined className="text-warning" sx={{ fontSize: 28 }} />,
  pendingFspApproval: <AccessTimeOutlined sx={{ fontSize: 28, color: 'warning.main' }} />,
  activeLoans: <CheckCircleOutline sx={{ fontSize: 28, color: 'success.main' }} />,
  cancelled: <BlockOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />,
  rejected: <HighlightOffOutlined sx={{ fontSize: 28, color: 'error.main' }} />,
  closedFullyRepaid: <DescriptionOutlined sx={{ fontSize: 28, color: 'primary.main' }} />,
};

const CARD_SHADOW = 'rgba(17, 17, 26, 0.05) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 0px 8px';

// A single KPI card, shared by both the MiraCore Summary and ESS Summary sections so the
// two visually match - only the icon/color/value formatting differs per metric.
//
// pointInTime: cards for metrics that reflect current state (Total Outstanding Portfolio,
// PAR30, Active Borrowers, Delinquency Buckets) rather than activity over the selected date
// range. These don't change when the date-range control is switched - not a bug, just not a
// time-scoped figure (e.g. "PAR30 for This Week" isn't a meaningful question the way "loans
// disbursed This Week" is). Flagged with a small "As of today" label so this reads as
// intentional rather than the card appearing unresponsive to the range control.
function SummaryCard({ label, value, icon, caption, pointInTime, onClick }) {
  return (
    <div className="col-md-6 col-lg-4 mt-2">
      <Card
        sx={{
          boxShadow: CARD_SHADOW,
          height: '100%',
          ...(onClick ? { cursor: 'pointer', '&:hover': { boxShadow: 'rgba(17, 17, 26, 0.1) 0px 2px 4px, rgba(17, 17, 26, 0.15) 0px 0px 10px' } } : {})
        }}
        onClick={onClick}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography color="text.secondary" variant="body2">{label}</Typography>
              {pointInTime && (
                <Typography color="text.muted" variant="caption" sx={{ fontStyle: 'italic' }}>
                  (as of today)
                </Typography>
              )}
            </Box>
            <Typography variant="h4">{value}</Typography>
            {caption && (
              <Typography color="text.muted" variant="caption" display="block" sx={{ mt: 0.5 }}>
                {caption}
              </Typography>
            )}
          </Box>
          {icon}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const goToDetail = (metric) => () => navigate(`/dashboard/detail/${metric}`);
  const { tenantId } = useActiveTenant();
  const { isPlatformAdmin } = usePermissions();
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [pendingMessages, setPendingMessages] = useState(0);
  const [integrationHealth, setIntegrationHealth] = useState(null);
  const [apiKeyStats, setApiKeyStats] = useState({ total: 0, totalUsage: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  // Shared range for both MiraCore Summary and ESS Summary (see DateRangeControl). Initialized
  // synchronously from the stored selection so the first fetch already uses the right range,
  // rather than fetching once with a default and re-fetching immediately after mount.
  const initialSelection = loadStoredRangeSelection();
  const [range, setRange] = useState(() => computeRange(initialSelection.preset, initialSelection.custom));
  const [rangePreset, setRangePreset] = useState(initialSelection.preset);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { ...(tenantId ? { tenantId } : {}), from: range.from, to: range.to };
        const cacheKey = `dashboard-overview-${tenantId || 'platform'}-${range.from}-${range.to}`;
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
  }, [tenantId, isPlatformAdmin, range.from, range.to]);

  if (loading) return <Typography sx={{ p: 3 }}>Loading dashboard...</Typography>;

  const kpis = overview?.overview || {};
  const byStatus = overview?.loanStatistics?.byStatus || [];
  const daily = overview?.loanStatistics?.dailyApplications || [];
  const essSummary = overview?.loanStatistics?.essSummary || [];
  const miraCore = overview?.miraCoreSummary || {};
  const essPipeline = overview?.essPipelineSummary || {};
  const mifosValid = integrationHealth?.mifos?.valid;

  // Fixed display order, independent of the backend object's key order.
  const DELINQUENCY_BUCKET_ORDER = ['current', 'days_1_30', 'days_31_60', 'days_61_90', 'days_90_plus'];
  const delinquencyBucketRows = DELINQUENCY_BUCKET_ORDER
    .map((key) => miraCore.delinquencyBuckets?.[key] && { key, ...miraCore.delinquencyBuckets[key] })
    .filter(Boolean);

  const delinquencyTotals = delinquencyBucketRows.reduce((acc, b) => ({
    count: acc.count + b.count,
    principalDisbursed: acc.principalDisbursed + b.principalDisbursed,
    principalOutstanding: acc.principalOutstanding + b.principalOutstanding,
    interestOutstanding: acc.interestOutstanding + b.interestOutstanding,
    totalOutstanding: acc.totalOutstanding + b.totalOutstanding,
    totalCollected: acc.totalCollected + b.totalCollected,
  }), { count: 0, principalDisbursed: 0, principalOutstanding: 0, interestOutstanding: 0, totalOutstanding: 0, totalCollected: 0 });

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h5" sx={{ mb: 2 }}>Dashboard</Typography>

      {/* Shared date range - applies to both MiraCore Summary and ESS Summary below (not the
          point-in-time cards, which are flagged with their own "(as of today)" label). */}
      <Box sx={{ mb: 2 }}>
        <DateRangeControl
          onChange={(nextRange, nextPreset) => {
            setRange(nextRange);
            setRangePreset(nextPreset);
          }}
        />
      </Box>

      {/* MiraCore Summary - Fineract-sourced loan-book health */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AccountBalanceOutlined sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography variant="subtitle1">MiraCore Summary</Typography>
      </Box>
      <div className="row">
        <SummaryCard
          label="Total Outstanding Portfolio"
          value={formatCurrency(miraCore.totalOutstandingPortfolio)}
          icon={<AccountBalanceOutlined sx={{ fontSize: 28, color: 'primary.main' }} />}
          pointInTime
          onClick={goToDetail('portfolio')}
        />
        <SummaryCard
          label="NPL"
          value={`${miraCore.nplPercent ?? 0}%`}
          caption={formatCurrency(miraCore.nplAmount)}
          icon={<WarningAmberOutlined sx={{ fontSize: 28, color: (miraCore.nplPercent ?? 0) >= 10 ? 'error.main' : 'warning.main' }} />}
          pointInTime
          onClick={goToDetail('delinquency-days_90_plus')}
        />
        <SummaryCard
          label={`Loans Disbursed (${rangePreset})`}
          value={formatNumber(miraCore.loansDisbursedThisMonthCount)}
          caption={formatCurrency(miraCore.loansDisbursedThisMonthAmount)}
          icon={<PaymentsOutlined sx={{ fontSize: 28, color: 'success.main' }} />}
          onClick={goToDetail('disbursed')}
        />
        <SummaryCard
          label="Principal Paid"
          value={formatCurrency(miraCore.principalPaidTotal)}
          icon={<PaymentsOutlined sx={{ fontSize: 28, color: 'success.main' }} />}
          pointInTime
        />
        <SummaryCard
          label={`Interest Income (${rangePreset})`}
          value={formatCurrency(miraCore.interestIncomeThisMonth)}
          caption="Booked/accrued - what's owed, not what's been paid"
          icon={<TrendingUpOutlined sx={{ fontSize: 28, color: 'success.main' }} />}
          onClick={goToDetail('interest-income')}
        />
        <SummaryCard
          label="Interest Paid"
          value={formatCurrency(miraCore.interestPaidTotal)}
          caption="Actually collected - distinct from Interest Income above"
          icon={<TrendingUpOutlined sx={{ fontSize: 28, color: 'primary.main' }} />}
          pointInTime
        />
        <SummaryCard
          label={`Fee Income (${rangePreset})`}
          value={formatCurrency(miraCore.feeIncomeThisMonth)}
          caption={!miraCore.feeIncomeThisMonth ? 'Not yet booked in MiraCore' : undefined}
          icon={<ReceiptLongOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />}
          onClick={goToDetail('fee-income')}
        />
        <SummaryCard
          label="Active Borrowers"
          value={formatNumber(miraCore.activeBorrowers)}
          icon={<GroupsOutlined sx={{ fontSize: 28, color: 'info.main' }} />}
          pointInTime
          onClick={goToDetail('borrowers')}
        />
        <SummaryCard
          label="Collection Rate"
          value={`${miraCore.collectionRatePercent ?? 0}%`}
          caption="Lifetime - not affected by date range (see backend note)"
          icon={<PercentOutlined sx={{ fontSize: 28, color: 'primary.main' }} />}
          onClick={goToDetail('collection-rate')}
        />
      </div>

      <Paper sx={{ p: 2, mt: 2, boxShadow: CARD_SHADOW }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <Typography variant="subtitle1">Delinquency Buckets</Typography>
          <Typography color="text.muted" variant="caption" sx={{ fontStyle: 'italic' }}>(as of today)</Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Bucket</TableCell>
              <TableCell align="right">No. Loans</TableCell>
              <TableCell align="right">Principal Disbursed</TableCell>
              <TableCell align="right">Principal Outstanding</TableCell>
              <TableCell align="right">Interest Outstanding</TableCell>
              <TableCell align="right">Total Outstanding</TableCell>
              <TableCell align="right">Total Collected</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {delinquencyBucketRows.map((b) => (
              <TableRow key={b.key} hover onClick={goToDetail(`delinquency-${b.key}`)} sx={{ cursor: 'pointer' }}>
                <TableCell>{b.label}</TableCell>
                <TableCell align="right">{formatNumber(b.count)}</TableCell>
                <TableCell align="right">{formatCurrency(b.principalDisbursed)}</TableCell>
                <TableCell align="right">{formatCurrency(b.principalOutstanding)}</TableCell>
                <TableCell align="right">{formatCurrency(b.interestOutstanding)}</TableCell>
                <TableCell align="right">{formatCurrency(b.totalOutstanding)}</TableCell>
                <TableCell align="right">{formatCurrency(b.totalCollected)}</TableCell>
              </TableRow>
            ))}
            {!!delinquencyBucketRows.length && (
              <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderTopColor: 'divider' } }}>
                <TableCell>Total</TableCell>
                <TableCell align="right">{formatNumber(delinquencyTotals.count)}</TableCell>
                <TableCell align="right">{formatCurrency(delinquencyTotals.principalDisbursed)}</TableCell>
                <TableCell align="right">{formatCurrency(delinquencyTotals.principalOutstanding)}</TableCell>
                <TableCell align="right">{formatCurrency(delinquencyTotals.interestOutstanding)}</TableCell>
                <TableCell align="right">{formatCurrency(delinquencyTotals.totalOutstanding)}</TableCell>
                <TableCell align="right">{formatCurrency(delinquencyTotals.totalCollected)}</TableCell>
              </TableRow>
            )}
            {!delinquencyBucketRows.length && (
              <TableRow><TableCell colSpan={7}>No data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* ESS Summary - MongoDB-sourced, ESS/Utumishi message-driven pipeline state */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 1 }}>
        <ForumOutlined sx={{ fontSize: 20, color: 'secondary.main' }} />
        <Typography variant="subtitle1">ESS Summary</Typography>
      </Box>
      <div className="row">
        {essSummary.map((item) => (
          <div className="col-md-6 col-lg-4 mt-2" key={item.key}>
            <Card sx={{ boxShadow: CARD_SHADOW, height: '100%' }}>
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
        <SummaryCard
          label={`Applications (${rangePreset})`}
          value={formatNumber(essPipeline.applicationsThisMonth)}
          icon={<AssignmentOutlined sx={{ fontSize: 28, color: 'secondary.main' }} />}
        />
        <SummaryCard
          label={`Message Success Rate (${rangePreset})`}
          value={`${essPipeline.messageSuccessRatePercent ?? 0}%`}
          icon={<MarkEmailReadOutlined sx={{ fontSize: 28, color: 'success.main' }} />}
        />
        <SummaryCard
          label={`Message Volume (${rangePreset})`}
          value={formatNumber(essPipeline.messageVolumeThisMonth)}
          icon={<ForumOutlined sx={{ fontSize: 28, color: 'secondary.main' }} />}
        />
        <SummaryCard
          label={`Avg. Offer→Disbursement Turnaround (${rangePreset})`}
          value={essPipeline.avgTurnaroundDays != null ? `${essPipeline.avgTurnaroundDays}d` : '—'}
          icon={<TimerOutlined sx={{ fontSize: 28, color: 'warning.main' }} />}
        />
      </div>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Operations summary</Typography>
      <div className="row">
        {[
          { title: 'Tenant Users', value: kpis.totalUsers ?? 0 },
          // Distinct from ESS Summary's "Message Success Rate" (message-delivery reliability
          // this month): this is share of all-time tenant loan applications (Mongo
          // LoanMapping, status DISBURSED/OFFER_SUBMITTED) against Fineract's all-time loan
          // count for the tenant - an application-pipeline outcome metric, not a message
          // metric. Relabeled to avoid the two being mistaken for the same figure at a glance.
          { title: 'Application Pipeline Success Rate %', value: kpis.successRate ?? 0 },
          { title: 'Pending Messages', value: pendingMessages },
        ].map((item) => (
          <div className="col-md-6 col-lg-4 mt-2" key={item.title}>
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
