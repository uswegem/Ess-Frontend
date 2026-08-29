import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import { formatNumber } from '../../../utils/formatAmount';

function clientDisplayName(loan) {
  const c = loan?.clientData;
  if (!c) return null;
  return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ') || null;
}

function DetailRow({ label, value, valueSx }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
      <Typography sx={{ fontSize: 12, color: 'text.muted' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500, ...valueSx }}>{value}</Typography>
    </Box>
  );
}

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
  // Same `suggested` array and `onTypeChange` callback ManualMessageTrigger.js already
  // computes/passes to MessageComposerCard - Quick Actions below reuses them directly
  // (identical code path as the Composer's own suggestion chips), not a new suggestion
  // source or a duplicate click handler.
  suggested,
  onTypeChange,
}) => {
  const selectSuggestedType = (type) => {
    onTypeChange({ target: { value: type } });
  };
  return (
    <Paper sx={{ p: '20px', mb: 2.5 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary', mb: 1.75 }}>
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
        startIcon={<SearchIcon fontSize="small" />}
        sx={{ mt: 1.75, height: 42 }}
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

      {selectedLoan && (
        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'designBorder.subtle' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.muted', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.25 }}>
            Loan Details
          </Typography>
          <DetailRow label="App#:" value={selectedLoan.essApplicationNumber || selectedLoan._id} valueSx={{ fontFamily: 'monospace' }} />
          <DetailRow
            label="Loan#:"
            value={selectedLoan.essLoanNumberAlias || 'Not assigned'}
            valueSx={{
              fontFamily: 'monospace',
              color: selectedLoan.essLoanNumberAlias ? 'statusPill.green.text' : 'text.muted',
              fontStyle: selectedLoan.essLoanNumberAlias ? 'normal' : 'italic',
            }}
          />
          {clientDisplayName(selectedLoan) && (
            <DetailRow label="Client:" value={clientDisplayName(selectedLoan)} />
          )}
          {selectedLoan.requestedAmount != null && (
            <DetailRow label="Amount:" value={formatNumber(selectedLoan.requestedAmount)} valueSx={{ color: 'statusPill.green.text', fontWeight: 700 }} />
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.4 }}>
            <Typography sx={{ fontSize: 12, color: 'text.muted' }}>Status:</Typography>
            <Chip
              size="small"
              label={loanStatus || 'Unknown'}
              sx={{ bgcolor: 'statusPill.green.bg', color: 'statusPill.green.text', fontWeight: 600 }}
            />
          </Box>

          {/* Quick Actions - top 3 of the same `suggested` list MessageComposerCard already
              renders in full below; onTypeChange is the identical handler the Composer's own
              suggestion chips call, so clicking here has exactly the same effect. */}
          {suggested?.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'designBorder.subtle' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#B54708', mb: 1.25 }}>
                QUICK ACTIONS
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {suggested.slice(0, 3).map(({ type, displayName }) => (
                  <Button
                    key={type}
                    size="small"
                    variant="outlined"
                    fullWidth
                    startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                    onClick={() => selectSuggestedType(type)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontSize: 13,
                      borderColor: 'designBorder.input',
                      color: 'text.primary',
                    }}
                  >
                    {displayName}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default LoanLookupCard;
