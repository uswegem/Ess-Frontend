import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

// Small section-grouping heading for a step's sub-sections (e.g. "Address" within
// Organization, "Certificates" within API Keys) - a subheading plus a divider, so related
// fields read as a distinct group rather than just another label floating above inputs.
const SectionHeading = ({ children, sx }) => (
  <Box sx={{ mt: 1, mb: 0.5, ...sx }}>
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
      {children}
    </Typography>
    <Divider />
  </Box>
);

export default SectionHeading;
