import React from 'react';
import { Grid, TextField, MenuItem } from '@mui/material';

export default function MifosConfig({ form, setForm }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          fullWidth
          label="MIFOS Mode"
          value={form.mifosMode}
          onChange={(e) => setForm({ ...form, mifosMode: e.target.value })}
        >
          <MenuItem value="inherit_default">Inherit platform default</MenuItem>
          <MenuItem value="override">Override (own Fineract)</MenuItem>
        </TextField>
      </Grid>
      {form.mifosMode === 'override' && (
        <>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Base URL"
              helperText="e.g. https://host/fineract-provider/api (no /v1 suffix)"
              value={form.mifosBaseUrl}
              onChange={(e) => setForm({ ...form, mifosBaseUrl: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Fineract Tenant ID" value={form.mifosTenantId} onChange={(e) => setForm({ ...form, mifosTenantId: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Maker username" value={form.mifosUsername} onChange={(e) => setForm({ ...form, mifosUsername: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="password" label="Password" value={form.mifosPassword} onChange={(e) => setForm({ ...form, mifosPassword: e.target.value })} />
          </Grid>
        </>
      )}
    </Grid>
  );
}
