import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export default function ReviewStep({ tenantId, form, health }) {
  return (
    <Box>
      <Typography>Tenant ID: {tenantId}</Typography>
      <Typography>FSP: {form.tenantName} ({form.fspCode})</Typography>
      <Typography>MIFOS mode: {form.mifosMode}</Typography>
      {form.address.line1 && (
        <Typography sx={{ mt: 1 }}>
          Address: {[form.address.line1, form.address.city, form.address.region].filter(Boolean).join(', ')}
          {form.address.country ? ` (${form.address.country})` : ''}
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
