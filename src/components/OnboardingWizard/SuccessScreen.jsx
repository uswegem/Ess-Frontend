import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

export default function SuccessScreen({ tenantId, onContinue }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Alert severity="success" sx={{ mb: 3 }}>
        FSP onboarding submitted successfully.
      </Alert>
      <Typography variant="h6" sx={{ mb: 1 }}>Tenant: {tenantId}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        A platform admin can review and activate this FSP from the Tenants page.
      </Typography>
      <Button variant="contained" onClick={onContinue}>Go to FSP Tenants</Button>
    </Box>
  );
}
