import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export default function ReviewStep({ tenantId, form, health }) {
  return (
    <Box>
      <Typography>Tenant ID: {tenantId}</Typography>
      <Typography>FSP: {form.tenantName} ({form.fspCode})</Typography>
      <Typography>MIFOS mode: {form.mifosMode}</Typography>
      {(form.geo.line1 || form.geo.region) && (
        <Typography sx={{ mt: 1 }}>
          Address: {[form.geo.line1, form.geo.ward, form.geo.district, form.geo.region].filter(Boolean).join(', ')}
          {form.geo.postCode ? ` ${form.geo.postCode}` : ''}
          {form.geo.country ? ` (${form.geo.country})` : ''}
        </Typography>
      )}
      {health?.mifos && (
        <Alert severity={health.mifos.valid ? 'success' : 'warning'} sx={{ mt: 2 }}>
          MIFOS: {health.mifos.valid ? 'Valid' : health.mifos.message || 'Not validated'}
        </Alert>
      )}
    </Box>
  );
}
