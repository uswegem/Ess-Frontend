import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SensitiveSendConfirmModal from '../../pages/messages/components/SensitiveSendConfirmModal';

const details = '<ApplicationNumber>ESS1</ApplicationNumber><TotalAmountToPay>705330.5</TotalAmountToPay>';

const open = (props) => {
  const onConfirm = jest.fn();
  render(
    <SensitiveSendConfirmModal
      open
      messageType="LOAN_DISBURSEMENT_NOTIFICATION"
      messageDetails={details}
      applicationNumber="ESS1"
      onCancel={jest.fn()}
      onConfirm={onConfirm}
      {...props}
    />
  );
  return onConfirm;
};
const confirmButton = () => screen.getByRole('button', { name: /confirm and send/i });
const type = (value) => fireEvent.change(screen.getByLabelText(/application number/i), { target: { value } });
const acknowledge = () => fireEvent.click(screen.getByRole('checkbox'));

describe('SensitiveSendConfirmModal', () => {
  test('shows the values and needs both the number and the acknowledgement', () => {
    const onConfirm = open();
    expect(screen.getByText('Confirm disbursement notification')).toBeTruthy();
    expect(screen.getByText('705330.5')).toBeTruthy();
    expect(confirmButton().disabled).toBe(true);
    type('ESS1');
    expect(confirmButton().disabled).toBe(true);
    acknowledge();
    expect(confirmButton().disabled).toBe(false);
    fireEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('blocks a wrong number', () => {
    open();
    type('ESS2');
    acknowledge();
    expect(confirmButton().disabled).toBe(true);
  });

  test('blocks a message written for a different loan than the selected one', () => {
    open({ applicationNumber: 'ESS9' });
    type('ESS1');
    acknowledge();
    expect(confirmButton().disabled).toBe(true);
    expect(screen.getByText(/but the selected loan is ESS9/)).toBeTruthy();
  });

  test('keeps the liquidation wording for liquidation', () => {
    open({ messageType: 'LOAN_LIQUIDATION_NOTIFICATION' });
    expect(screen.getByText('Confirm loan liquidation')).toBeTruthy();
  });
});
