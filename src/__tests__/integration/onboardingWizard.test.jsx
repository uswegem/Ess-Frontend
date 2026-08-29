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
      geo: { country: 'TZ', region: '', district: '', ward: '', postCode: '', line1: '' },
    };
    render(
      <CompanyInfo
        form={form}
        setForm={jest.fn()}
        updateGeoCountry={jest.fn()}
        updateGeoRegion={jest.fn()}
        updateGeoDistrict={jest.fn()}
        updateGeoWard={jest.fn()}
        updateGeoLine1={jest.fn()}
        fspAvailable={null}
        onCheckAvailability={jest.fn()}
      />
    );
    expect(screen.getByLabelText(/FSP Name/i)).toHaveValue('Test FSP');
    expect(screen.getByLabelText(/FSP Code/i)).toHaveValue('TST01');
  });
});
