import React from 'react';
import { Box, TextField, Button, Typography, MenuItem, Alert } from '@mui/material';

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField label="FSP Name" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} />
      <TextField label="FSP Code" value={form.fspCode} onChange={(e) => setForm({ ...form, fspCode: e.target.value.toUpperCase() })} />
      <Button size="small" onClick={onCheckAvailability}>Check availability</Button>
      {fspAvailable === false && <Alert severity="error">FSP code taken</Alert>}
      {fspAvailable === true && <Alert severity="success">FSP code available</Alert>}
      <TextField label="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
      <TextField label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
      <TextField label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
      <Typography variant="subtitle2" sx={{ mt: 1 }}>Address</Typography>
      <TextField label="Address line 1" value={form.address.line1} onChange={(e) => updateAddress('line1', e.target.value)} />
      <TextField label="City" value={form.address.city} onChange={(e) => updateAddress('city', e.target.value)} />
      <TextField label="Region" value={form.address.region} onChange={(e) => updateAddress('region', e.target.value)} />
      <TextField select label="Country" value={form.address.country} onChange={(e) => updateAddress('country', e.target.value)}>
        {COUNTRY_OPTIONS.map(({ code, name }) => (
          <MenuItem key={code} value={code}>{name}</MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
