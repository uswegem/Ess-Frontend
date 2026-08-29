import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

// Small section-grouping heading for a step's sub-sections (e.g. "Address" within
// Organization, "Certificates" within API Keys) - a subheading plus a divider, so related
// fields read as a distinct group rather than just another label floating above inputs.
const SectionHeading = ({ children, sx }) => (
  <Box sx={{ mt: 1, mb: 1.25, ...sx }}>
    <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.muted', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.75 }}>
      {children}
    </Typography>
    <Divider sx={{ borderColor: 'designBorder.subtle' }} />
  </Box>
);

export default SectionHeading;
