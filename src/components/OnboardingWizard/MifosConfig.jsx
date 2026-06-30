import React from 'react';
import { Box, TextField, MenuItem } from '@mui/material';

export default function MifosConfig({ form, setForm }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField select label="MIFOS Mode" value={form.mifosMode} onChange={(e) => setForm({ ...form, mifosMode: e.target.value })}>
        <MenuItem value="inherit_default">Inherit platform default</MenuItem>
        <MenuItem value="override">Override (own Fineract)</MenuItem>
      </TextField>
      {form.mifosMode === 'override' && (
        <>
          <TextField
            label="Base URL"
            helperText="e.g. https://host/fineract-provider/api (no /v1 suffix)"
            value={form.mifosBaseUrl}
            onChange={(e) => setForm({ ...form, mifosBaseUrl: e.target.value })}
          />
          <TextField label="Fineract Tenant ID" value={form.mifosTenantId} onChange={(e) => setForm({ ...form, mifosTenantId: e.target.value })} />
          <TextField label="Maker username" value={form.mifosUsername} onChange={(e) => setForm({ ...form, mifosUsername: e.target.value })} />
          <TextField type="password" label="Password" value={form.mifosPassword} onChange={(e) => setForm({ ...form, mifosPassword: e.target.value })} />
        </>
      )}
    </Box>
  );
}
