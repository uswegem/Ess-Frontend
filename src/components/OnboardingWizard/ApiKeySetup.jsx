import React from 'react';
import { Box, TextField, Typography, Button, Alert } from '@mui/material';

export default function ApiKeySetup({
  form,
  setForm,
  certFiles,
  setCertFiles,
  certsUploaded,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2">Create first API key (optional — leave name empty to skip)</Typography>
      <TextField label="Key name" value={form.apiKeyName} onChange={(e) => setForm({ ...form, apiKeyName: e.target.value })} />

      <Typography variant="subtitle2" sx={{ mt: 2 }}>ESS signing certificates (optional)</Typography>
      <Typography variant="caption" color="text.secondary">
        Upload PEM files now or later from FSP Settings.
      </Typography>
      <Button variant="outlined" component="label">
        Public certificate (.pem)
        <input type="file" hidden accept=".pem,.crt" onChange={(e) => setCertFiles({ ...certFiles, publicCert: e.target.files?.[0] || null })} />
      </Button>
      {certFiles.publicCert && <Typography variant="caption">{certFiles.publicCert.name}</Typography>}
      <Button variant="outlined" component="label">
        Private key (.pem)
        <input type="file" hidden accept=".pem,.key" onChange={(e) => setCertFiles({ ...certFiles, privateKey: e.target.files?.[0] || null })} />
      </Button>
      {certFiles.privateKey && <Typography variant="caption">{certFiles.privateKey.name}</Typography>}
      {certsUploaded && <Alert severity="success">Certificates uploaded</Alert>}
    </Box>
  );
}
