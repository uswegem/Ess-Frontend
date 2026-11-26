import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import LoanDetail from '../../pages/loan/LoanDetail';
import ManualMessageTrigger from '../../pages/messages/ManualMessageTrigger';
import { getRequest, postRequest } from '../../ApiFunction';
import { getSuggestedMessages } from '../../services/messages/suggestionService';
import { getMessageLogs } from '../../services/messages/messageLogService';

const mockNavigate = jest.fn();
let mockSearch = '';
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(mockSearch)],
}), { virtual: true });
jest.mock('../../ApiFunction', () => ({ getRequest: jest.fn(), postRequest: jest.fn() }));
jest.mock('../../services/messages/suggestionService', () => ({ getSuggestedMessages: jest.fn() }));
jest.mock('../../services/messages/messageLogService', () => ({ getMessageLogs: jest.fn() }));
jest.mock('../../hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
jest.mock('../../hooks/useActiveTenant', () => ({ useActiveTenant: () => ({ activeTenant: null }) }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const loan = { _id: '1', essApplicationNumber: 'ESS1', essLoanNumberAlias: 'LOAN1', status: 'DISBURSED' };

// react-scripts resets mock implementations before each test
beforeEach(() => {
  getSuggestedMessages.mockResolvedValue({ data: { loanStatus: 'DISBURSED', suggested: [], allMessageTypes: [] } });
  getMessageLogs.mockResolvedValue({ data: { messages: [] } });
});

describe('loan pages link to Trigger Message', () => {
  test('Loan Detail opens the page for its loan and sends nothing', async () => {
    getRequest.mockResolvedValue({ data: { success: true, data: { loan } } });
    render(<LoanDetail />);
    fireEvent.click(await screen.findByRole('button', { name: /trigger message/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/messages/trigger?application=ESS1');
    expect(screen.queryByText(/send disbursement/i)).toBeNull();
    expect(postRequest).not.toHaveBeenCalled();
  });

  test('Trigger Message selects the linked loan without sending', async () => {
    mockSearch = 'application=ESS1';
    getRequest.mockResolvedValue({ data: { success: true, data: { loans: [{ ...loan, _id: '2', essApplicationNumber: 'ESS2' }, loan] } } });
    render(<ManualMessageTrigger />);
    await waitFor(() => expect(getSuggestedMessages).toHaveBeenCalledWith('ESS1'));
    expect(screen.getByText('LOAN1')).toBeTruthy();
    expect(postRequest).not.toHaveBeenCalled();
  });

  test('an unknown linked loan is reported', async () => {
    mockSearch = 'application=NOPE';
    getRequest.mockResolvedValue({ data: { success: true, data: { loans: [loan] } } });
    render(<ManualMessageTrigger />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Loan NOPE is not available for messaging'));
    expect(getSuggestedMessages).not.toHaveBeenCalled();
  });
});
