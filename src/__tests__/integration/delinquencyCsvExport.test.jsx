import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import DashboardDetail from '../../pages/dashboard/DashboardDetail';
import { getDashboardDetail } from '../../services/dashboardService';
import { exportRowsAsCsv } from '../../utils/exportCsv';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ metric: 'delinquency-current' }),
  useNavigate: () => jest.fn(),
}), { virtual: true });
jest.mock('../../hooks/useActiveTenant', () => ({ useActiveTenant: () => ({ activeTenant: null }) }));
jest.mock('@mui/x-data-grid', () => ({ DataGrid: () => null }));
jest.mock('../../services/dashboardService', () => ({ getDashboardDetail: jest.fn(), getDashboardDetailPdf: jest.fn() }));
jest.mock('../../utils/exportCsv', () => ({ exportRowsAsCsv: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

const rows = (n) => Array.from({ length: n }, (_, i) => ({ loanAccountNo: `A${i}` }));
const reply = (count, total) => ({ data: { rows: rows(count), pagination: { total } } });

const exportAfterLoad = async () => {
  render(<DashboardDetail />);
  const button = screen.getByRole('button', { name: /export csv/i });
  await waitFor(() => expect(button.disabled).toBe(false));
  fireEvent.click(button);
};

describe('delinquency CSV export', () => {
  test('asks for the whole bucket and exports every row', async () => {
    getDashboardDetail.mockImplementation(async (metric, params) => (params.all ? reply(450, 450) : reply(25, 450)));
    await exportAfterLoad();
    await waitFor(() => expect(exportRowsAsCsv).toHaveBeenCalled());
    expect(exportRowsAsCsv.mock.calls[0][1]).toHaveLength(450);
  });

  test('refuses to export a partial result', async () => {
    getDashboardDetail.mockImplementation(async (metric, params) => (params.all ? reply(200, 450) : reply(25, 450)));
    await exportAfterLoad();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Export stopped: only 200 of 450 records were returned'));
    expect(exportRowsAsCsv).not.toHaveBeenCalled();
  });
});
