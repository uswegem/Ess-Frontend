import React from 'react';
import { Box, TextField, Button, MenuItem, Alert, Typography } from '@mui/material';
import SectionHeading from './SectionHeading';
import { listRegions, listDistricts, listWards } from '../../utils/tanzaniaGeo';

// Only Tanzania has real cascade data bundled (see tanzaniaGeo.js) - other countries fall
// back to plain text entry for Region/District/Ward instead of a populated dropdown with
// nothing in it. Kept as a real, small option list (not the design's illustrative single-
// country sample) since ess2 does need to support FSPs outside Tanzania in principle.
const COUNTRY_OPTIONS = [
  { code: 'TZ', name: 'Tanzania' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
];

// Design-handoff grouped-field grid, same pattern as the Product screens' FormSection/
// FieldGroup - a responsive repeat(auto-fit, minmax(220px, 1fr)) grid, no section label
// needed here since SectionHeading already provides one above.
function FieldGrid({ children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 2 }}>
      {children}
    </Box>
  );
}

export default function CompanyInfo({
  form,
  setForm,
  updateGeoCountry,
  updateGeoRegion,
  updateGeoDistrict,
  updateGeoWard,
  updateGeoLine1,
  fspAvailable,
  onCheckAvailability,
}) {
  const { geo } = form;
  const isTanzania = geo.country === 'TZ';
  const regionOptions = isTanzania ? listRegions() : [];
  const districtOptions = isTanzania && geo.region ? listDistricts(geo.region) : [];
  const wardOptions = isTanzania && geo.district ? listWards(geo.region, geo.district) : [];

  return (
    <Box>
      <FieldGrid>
        <TextField fullWidth label="FSP Name" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} />
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
          <TextField fullWidth label="FSP Code" value={form.fspCode} onChange={(e) => setForm({ ...form, fspCode: e.target.value.toUpperCase() })} />
          <Button variant="outlined" onClick={onCheckAvailability} sx={{ whiteSpace: 'nowrap' }}>
            Check availability
          </Button>
        </Box>
      </FieldGrid>

      {fspAvailable === false && <Alert severity="error" sx={{ mb: 2 }}>FSP code taken</Alert>}
      {fspAvailable === true && <Alert severity="success" sx={{ mb: 2 }}>FSP code available</Alert>}

      <FieldGrid>
        <TextField fullWidth label="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        <TextField fullWidth label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
        <TextField fullWidth label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
      </FieldGrid>

      <SectionHeading>Address</SectionHeading>

      {/* Approved layout/behavior change: Country -> Region/City -> District -> Ward ->
          Post Code (auto-filled, read-only) -> Address Line 1, each cascading from its
          parent. Real data (see tanzaniaGeo.js) for Tanzania; other countries fall back to
          free-text Region/District/Ward since no data source exists for them. */}
      <FieldGrid>
        <TextField
          select
          fullWidth
          label="Country"
          value={geo.country}
          onChange={(e) => updateGeoCountry(e.target.value)}
        >
          {COUNTRY_OPTIONS.map(({ code, name }) => (
            <MenuItem key={code} value={code}>{name}</MenuItem>
          ))}
        </TextField>

        {isTanzania ? (
          <TextField
            select
            fullWidth
            label="Region/City"
            value={geo.region}
            onChange={(e) => updateGeoRegion(e.target.value)}
          >
            {regionOptions.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField fullWidth label="Region/City" value={geo.region} onChange={(e) => updateGeoRegion(e.target.value)} />
        )}

        {isTanzania ? (
          <TextField
            select
            fullWidth
            label="District"
            value={geo.district}
            onChange={(e) => updateGeoDistrict(e.target.value)}
            disabled={!geo.region}
            helperText={!geo.region ? 'Select a Region first' : undefined}
          >
            {districtOptions.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField fullWidth label="District" value={geo.district} onChange={(e) => updateGeoDistrict(e.target.value)} />
        )}

        {isTanzania ? (
          <TextField
            select
            fullWidth
            label="Ward"
            value={geo.ward}
            onChange={(e) => updateGeoWard(e.target.value)}
            disabled={!geo.district}
            helperText={
              !geo.district
                ? 'Select a District first'
                : wardOptions.length === 0
                  ? 'No ward data available for this district'
                  : undefined
            }
          >
            {wardOptions.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField fullWidth label="Ward" value={geo.ward} onChange={(e) => updateGeoWard(e.target.value)} />
        )}

        <TextField
          fullWidth
          label="Post Code"
          value={geo.postCode}
          disabled
          helperText={isTanzania ? 'Auto-filled from Ward' : 'Not available for this country'}
        />

        <TextField
          fullWidth
          label="Address Line 1"
          sx={{ gridColumn: '1 / -1' }}
          value={geo.line1}
          onChange={(e) => updateGeoLine1(e.target.value)}
        />
      </FieldGrid>

      {isTanzania && geo.district && wardOptions.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          Ward data isn't available for every Tanzanian district yet - leave Ward/Post Code
          blank and continue if yours isn't listed.
        </Typography>
      )}
    </Box>
  );
}
