import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

// Page-local search bar for visual parity with the retired MiraAdmin layout. It has no
// search logic of its own - Loan Lookup below already filters loans live via Autocomplete.
// Typing here / pressing Cmd+K just focuses that input instead of duplicating the filter.
const PageSearchBar = ({ loanInputRef }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (!isCmdK) return;
      e.preventDefault();
      loanInputRef?.current?.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loanInputRef]);

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        placeholder="Search loans, applications..."
        onFocus={() => loanInputRef?.current?.focus()}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: 'text.muted' }} />
            </InputAdornment>
          ),
          sx: { borderRadius: '10px', pr: '108px' },
        }}
      />
      {/* Decorative - same underlying action as focusing the field above (Loan Lookup's
          Autocomplete does the actual filtering), just completing the design's visual
          "Search" button. No new search logic. */}
      <Box
        component="button"
        type="button"
        onClick={() => loanInputRef?.current?.focus()}
        sx={{
          position: 'absolute',
          right: 6,
          top: 6,
          bottom: 6,
          px: 2,
          borderRadius: '8px',
          border: 'none',
          bgcolor: 'primary.main',
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        Search
      </Box>
    </Box>
  );
};

export default PageSearchBar;
