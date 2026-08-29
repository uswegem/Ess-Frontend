import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import { LOAN_STATUS_REQUEST_TYPE } from '../../../services/messages/messageTypes';
import { buildEnvelopePreview } from '../../../services/messages/envelopePreview';
import theme from '../../../theme/theme';

const MessageComposerCard = ({
  messageType,
  onTypeChange,
  suggested,
  other,
  selectedLoan,
  loanStatus,
  hasPermissionForType,
  isSensitiveType,
  canTriggerSensitive,
  applicationNumber,
  setApplicationNumber,
  messageDetails,
  setMessageDetails,
  sending,
  result,
  onSend,
  onReset,
  onValidate,
  onValidateApplicationNumber,
  validating,
  validationResult,
  activeTenant,
}) => {
  const selectSuggestedType = (type) => {
    onTypeChange({ target: { value: type } });
  };

  return (
    <Paper sx={{ p: '20px' }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary', mb: 1.75 }}>
        Message Composer
      </Typography>

      <TextField
        select
        fullWidth
        label="Select Message Type"
        value={messageType}
        onChange={onTypeChange}
      >
        {selectedLoan && suggested.length > 0 && [
          <MenuItem key="__suggested" disabled divider sx={{ opacity: 1, fontWeight: 600 }}>
            Suggested for this loan ({loanStatus})
          </MenuItem>,
          ...suggested.map(({ type, displayName, description }) => (
            <MenuItem key={type} value={type} disabled={!hasPermissionForType(type)}>
              <div>
                <div>
                  {displayName}
                  {isSensitiveType(type) && !canTriggerSensitive && ' 🔒'}
                </div>
                <div
                  className={isSensitiveType(type) && !canTriggerSensitive ? undefined : 'text-muted'}
                  style={{
                    fontSize: '0.75rem',
                    color: isSensitiveType(type) && !canTriggerSensitive ? theme.palette.sensitive.main : undefined,
                  }}
                >
                  {isSensitiveType(type) && !canTriggerSensitive
                    ? 'Requires elevated permission'
                    : description}
                </div>
              </div>
            </MenuItem>
          )),
        ]}

        <MenuItem key="__other" disabled divider sx={{ opacity: 1, fontWeight: 600 }}>
          {selectedLoan && suggested.length > 0 ? 'Other message types' : 'All message types'}
        </MenuItem>
        {other.map(({ type, displayName, description, category }) => (
          <MenuItem key={type} value={type} disabled={!hasPermissionForType(type)}>
            <div>
              <div>
                {displayName}
                {isSensitiveType(type) && !canTriggerSensitive && ' 🔒'}
                {selectedLoan && (
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}> · atypical for {loanStatus}</span>
                )}
              </div>
              <div
                className={isSensitiveType(type) && !canTriggerSensitive ? undefined : 'text-muted'}
                style={{
                  fontSize: '0.75rem',
                  color: isSensitiveType(type) && !canTriggerSensitive ? theme.palette.sensitive.main : undefined,
                }}
              >
                {isSensitiveType(type) && !canTriggerSensitive
                  ? 'Requires elevated permission'
                  : `${category} — ${description}`}
              </div>
            </div>
          </MenuItem>
        ))}

        <MenuItem value={LOAN_STATUS_REQUEST_TYPE}>
          Loan Status Request
        </MenuItem>
      </TextField>

      {!messageType && (
        <div className="text-center mt-3" style={{ border: '1px dashed #D6DAE3', borderRadius: 10, padding: '40px 24px' }}>
          <SendIcon sx={{ color: '#C0C5D0', fontSize: 20 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#475467', mt: 1.25, mb: 0.5 }}>
            Select a message type to begin
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.muted' }}>
            Choose from the dropdown above or click a suggested message
          </Typography>

          {suggested.length > 0 && (
            <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
              {suggested.map(({ type, displayName }) => (
                <Chip
                  key={type}
                  label={displayName}
                  clickable
                  color="primary"
                  variant="outlined"
                  disabled={!hasPermissionForType(type)}
                  onClick={() => hasPermissionForType(type) && selectSuggestedType(type)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {messageType === LOAN_STATUS_REQUEST_TYPE && (
        <TextField
          fullWidth
          label="Application Number"
          value={applicationNumber}
          onChange={(e) => setApplicationNumber(e.target.value)}
          className="mt-3"
        />
      )}

      {messageType && messageType !== LOAN_STATUS_REQUEST_TYPE && (
        <TextField
          fullWidth
          multiline
          rows={8}
          label="Message Details (XML)"
          value={messageDetails}
          onChange={(e) => setMessageDetails(e.target.value)}
          className="mt-3"
          sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
        />
      )}

      {/* Full envelope preview - Header (Sender/Receiver/FSPCode) is real, deterministic,
          client-available data (activeTenant), so it can't drift from what's actually sent.
          MsgId/Signature are shown as placeholders rather than fabricated values, since both
          are only computed at the moment of actual send (MsgId includes a fresh random
          component every call - see messageIdGenerator.js - so no client-side guess could
          ever be the real one). Shown for every message type, not just LOAN_STATUS_REQUEST. */}
      {messageType && (
        <>
          <TextField
            fullWidth
            multiline
            rows={12}
            label="Full Message Preview"
            value={buildEnvelopePreview(
              messageType,
              messageType === LOAN_STATUS_REQUEST_TYPE
                ? `<ApplicationNumber>${applicationNumber || ''}</ApplicationNumber>`
                : messageDetails,
              activeTenant
            )}
            InputProps={{ readOnly: true }}
            className="mt-3"
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
          />
          <Typography variant="caption" color="text.secondary" className="mt-1" sx={{ display: 'block' }}>
            MsgId and Signature are generated at send time - the actual values are shown in
            the response after sending.
          </Typography>
        </>
      )}

      {messageType && (
        <div className="d-flex gap-2 mt-3">
          <Button
            variant="outlined"
            onClick={messageType === LOAN_STATUS_REQUEST_TYPE ? onValidateApplicationNumber : onValidate}
            disabled={sending || validating || !messageType}
            startIcon={validating ? <CircularProgress size={16} /> : null}
            sx={{ height: 40 }}
          >
            {validating ? 'Validating...' : 'Validate'}
          </Button>
          <Button
            variant="outlined"
            onClick={onReset}
            disabled={!messageType || messageType === LOAN_STATUS_REQUEST_TYPE}
            sx={{ height: 40 }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onSend}
            disabled={sending || !messageType || !hasPermissionForType(messageType)}
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ height: 40 }}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      )}

      {validationResult && (
        <Alert
          severity={validationResult.valid ? 'success' : 'error'}
          className="mt-3"
        >
          {validationResult.valid ? (
            'Message details are valid.'
          ) : (
            <>
              <div>Validation failed:</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {(validationResult.errors || []).map((msg, i) => (
                  <li key={i} style={{ fontSize: '0.8rem' }}>{msg}</li>
                ))}
              </ul>
            </>
          )}
        </Alert>
      )}

      {messageType && !result && (
        <Box sx={{ mt: 3, p: 3, border: '1px dashed #D6DAE3', borderRadius: '10px', textAlign: 'center' }}>
          <Typography sx={{ fontSize: 13, color: 'text.muted' }}>
            Response will appear here after sending
          </Typography>
        </Box>
      )}

      {result && (
        <Paper variant="outlined" className="p-3 mt-3">
          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <Chip
              label={result.success ? 'Success' : 'Failed'}
              color={result.success ? 'success' : 'error'}
              size="small"
            />
            {result.responseCode && (
              <Chip label={`Response code: ${result.responseCode}`} size="small" variant="outlined" />
            )}
            {typeof result.responseTimeMs === 'number' && (
              <Chip label={`${result.responseTimeMs} ms`} size="small" variant="outlined" />
            )}
          </div>
          {result.statusDesc && (
            <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>{result.statusDesc}</p>
          )}
          {result.error && <p className="text-danger">{result.error}</p>}
          {result.success && result.sent && !result.essResponse && (
            <Alert severity="warning" className="mb-2">
              Message was sent but no response received from Utumishi yet.
            </Alert>
          )}
          {result.sent && (
            <>
              <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>SENT (XML)</div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                {result.sent}
              </pre>
            </>
          )}
          {result.essResponse && (
            <>
              <div className="text-muted mb-1 mt-3" style={{ fontSize: '0.75rem' }}>ESS RESPONSE</div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                {result.essResponse}
              </pre>
            </>
          )}
        </Paper>
      )}
    </Paper>
  );
};

export default MessageComposerCard;
