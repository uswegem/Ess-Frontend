import React from 'react';
import { render, screen } from '@testing-library/react';
import CompanyInfo from '../../components/OnboardingWizard/CompanyInfo';

describe('Onboarding wizard', () => {
  it('renders organization step fields', () => {
    const form = {
      tenantName: 'Test FSP',
      fspCode: 'TST01',
      contactEmail: 'a@test.com',
      contactPerson: 'Admin',
      contactPhone: '+255700000000',
      address: { line1: '', city: '', region: '', country: 'TZ' },
    };
    render(
      <CompanyInfo
        form={form}
        setForm={jest.fn()}
        updateAddress={jest.fn()}
        fspAvailable={null}
        onCheckAvailability={jest.fn()}
      />
    );
    expect(screen.getByLabelText(/FSP Name/i)).toHaveValue('Test FSP');
    expect(screen.getByLabelText(/FSP Code/i)).toHaveValue('TST01');
  });
});
