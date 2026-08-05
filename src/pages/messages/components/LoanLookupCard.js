import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';

function loanLabel(loan) {
  const client = loan.clientData;
  const name = client
    ? [client.firstName, client.middleName, client.lastName].filter(Boolean).join(' ')
    : null;
  return [loan.essApplicationNumber, name || loan.essCheckNumber || client?.checkNumber]
    .filter(Boolean)
    .join(' — ');
}

// Search by application number, check number or borrower name - not just what's shown
// in the label - so typing a check number finds a loan even when the label shows the name.
const loanFilterOptions = createFilterOptions({
  stringify: (loan) => [
    loan.essApplicationNumber,
    loan.essCheckNumber,
    loan.clientData?.checkNumber,
    loan.clientData?.firstName,
    loan.clientData?.middleName,
    loan.clientData?.lastName,
  ]
    .filter(Boolean)
    .join(' '),
});

const LoanLookupCard = ({
  loanOptions,
  loanLoading,
  selectedLoan,
  onLoanChange,
  onOpen,
  inputRef,
  loanStatus,
  suggestionsLoading,
  suggestedCount,
}) => {
  return (
    <Paper className="p-3 mb-3">
      <Typography variant="subtitle1" className="mb-2" sx={{ fontWeight: 600 }}>
        Loan Lookup
      </Typography>

      <Autocomplete
        options={loanOptions}
        loading={loanLoading}
        getOptionLabel={loanLabel}
        filterOptions={loanFilterOptions}
        value={selectedLoan}
        onOpen={onOpen}
        onChange={onLoanChange}
        isOptionEqualToValue={(a, b) => a._id === b._id}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            placeholder="Search by application number, name or check number"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loanLoading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      <Button
        fullWidth
        variant="contained"
        startIcon={<SearchIcon />}
        className="mt-2"
        onClick={() => inputRef?.current?.focus()}
      >
        Search
      </Button>

      {selectedLoan && (
        <div className="d-flex align-items-center gap-2 mt-3">
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Loan status:</span>
          <Chip label={loanStatus || 'Unknown'} size="small" />
          {!suggestionsLoading && suggestedCount === 0 && (
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              (no suggestions defined for this status)
            </span>
          )}
        </div>
      )}
    </Paper>
  );
};

export default LoanLookupCard;
