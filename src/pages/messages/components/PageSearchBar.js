import React, { useEffect } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
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
    <TextField
      fullWidth
      placeholder="Search loans, applications..."
      onFocus={() => loanInputRef?.current?.focus()}
      InputProps={{
        readOnly: true,
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <Chip label="⌘K" size="small" variant="outlined" />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default PageSearchBar;
