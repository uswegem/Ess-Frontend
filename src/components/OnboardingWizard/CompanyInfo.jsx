import React from 'react';
import { Box, Grid, TextField, Button, MenuItem, Alert } from '@mui/material';
import SectionHeading from './SectionHeading';

const COUNTRY_OPTIONS = [
  { code: 'TZ', name: 'Tanzania' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
];

export default function CompanyInfo({
  form,
  setForm,
  updateAddress,
  fspAvailable,
  onCheckAvailability,
}) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="FSP Name" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
          <TextField fullWidth label="FSP Code" value={form.fspCode} onChange={(e) => setForm({ ...form, fspCode: e.target.value.toUpperCase() })} />
          <Button variant="outlined" onClick={onCheckAvailability} sx={{ whiteSpace: 'nowrap' }}>
            Check availability
          </Button>
        </Box>
      </Grid>

      {fspAvailable === false && (
        <Grid item xs={12} sx={{ mt: -1 }}>
          <Alert severity="error" sx={{ py: 0 }}>FSP code taken</Alert>
        </Grid>
      )}
      {fspAvailable === true && (
        <Grid item xs={12} sx={{ mt: -1 }}>
          <Alert severity="success" sx={{ py: 0 }}>FSP code available</Alert>
        </Grid>
      )}

      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
      </Grid>

      <Grid item xs={12}>
        <SectionHeading>Address</SectionHeading>
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Address line 1" value={form.address.line1} onChange={(e) => updateAddress('line1', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="City" value={form.address.city} onChange={(e) => updateAddress('city', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Region" value={form.address.region} onChange={(e) => updateAddress('region', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          select
          fullWidth
          label="Country"
          value={form.address.country}
          onChange={(e) => updateAddress('country', e.target.value)}
        >
          {COUNTRY_OPTIONS.map(({ code, name }) => (
            <MenuItem key={code} value={code}>{name}</MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  );
}
