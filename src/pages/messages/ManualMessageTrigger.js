import React, { useEffect, useMemo, useRef, useState } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { toast } from 'react-toastify';
import { getRequest, postRequest } from '../../ApiFunction';
import API from '../../Api';
import { usePermissions } from '../../hooks/usePermissions';
import {
  MESSAGE_TYPES,
  SENSITIVE_MESSAGE_TYPES,
  LOAN_STATUS_REQUEST_TYPE,
  buildMessageDetails,
} from '../../services/messages/messageTypes';
import { getMessageLogs } from '../../services/messages/messageLogService';
import { getSuggestedMessages } from '../../services/messages/suggestionService';
import PageSearchBar from './components/PageSearchBar';
import LoanLookupCard from './components/LoanLookupCard';
import MessageHistoryCard from './components/MessageHistoryCard';
import MessageComposerCard from './components/MessageComposerCard';
import LiquidationConfirmModal from './components/LiquidationConfirmModal';

// This message type closes the loan permanently - the confirmation-modal guard applies
// whenever it's selected, regardless of whether the backend suggested it for this loan's
// current status (an operator can still pick it manually from "Other message types").
const REQUIRES_HEAVY_CONFIRMATION_TYPES = ['LOAN_LIQUIDATION_NOTIFICATION'];

const ManualMessageTrigger = () => {
  const { can } = usePermissions();
  const canTrigger = can('messages:trigger');
  const canTriggerSensitive = can('messages:trigger_sensitive');

  const loanInputRef = useRef(null);

  const [loanOptions, setLoanOptions] = useState([]);
  const [loanLoading, setLoanLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const [messageType, setMessageType] = useState('');
  const [messageDetails, setMessageDetails] = useState('');
  const [applicationNumber, setApplicationNumber] = useState('');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [pendingSend, setPendingSend] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const isSensitiveType = (type) => SENSITIVE_MESSAGE_TYPES.includes(type);
  const hasPermissionForType = (type) => canTrigger && (!isSensitiveType(type) || canTriggerSensitive);
  const requiresHeavyConfirmation = (type) => REQUIRES_HEAVY_CONFIRMATION_TYPES.includes(type);

  const fetchLoans = async () => {
    if (loanOptions.length > 0 || loanLoading) return;
    setLoanLoading(true);
    try {
      // CHARGES_CALCULATED loans have no LOAN_OFFER_REQUEST yet - excluded here (message-
      // trigger lookup only) since no outgoing message is meaningful to trigger for them.
      // The general /loan page's fetch of this same endpoint doesn't send this param, so its
      // results are unaffected.
      const res = await getRequest(API.ALL_EMPLOYEES_LOAN, { params: { excludeStatuses: 'CHARGES_CALCULATED' } });
      const { success, data, message } = res.data;
      if (!success) {
        toast.error(message || 'Failed to load loans');
        return;
      }
      setLoanOptions(data?.loans || []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoanLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedLoan?.essApplicationNumber) {
      setHistoryRows([]);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    getMessageLogs({ applicationNumber: selectedLoan.essApplicationNumber, direction: 'outgoing', limit: 20 })
      .then((res) => {
        if (cancelled) return;
        setHistoryRows(res?.data?.messages || []);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.message || err.message);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLoan?.essApplicationNumber]);

  useEffect(() => {
    if (!selectedLoan?.essApplicationNumber) {
      setSuggestions(null);
      return;
    }
    let cancelled = false;
    setSuggestionsLoading(true);
    getSuggestedMessages(selectedLoan.essApplicationNumber)
      .then((res) => {
        if (cancelled) return;
        setSuggestions(res?.data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.message || err.message);
        setSuggestions(null);
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLoan?.essApplicationNumber]);

  const handleLoanChange = (_e, loan) => {
    setSelectedLoan(loan);
    if (loan?.essApplicationNumber) {
      setApplicationNumber(loan.essApplicationNumber);
    }
    if (messageType && messageType !== LOAN_STATUS_REQUEST_TYPE) {
      const template = MESSAGE_TYPES[messageType];
      setMessageDetails(buildMessageDetails(template.messageDetails, loan));
    }
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setMessageType(type);
    setResult(null);
    if (type === LOAN_STATUS_REQUEST_TYPE) {
      setMessageDetails('');
      return;
    }
    const template = MESSAGE_TYPES[type];
    setMessageDetails(buildMessageDetails(template.messageDetails, selectedLoan));
  };

  const handleReset = () => {
    if (!messageType || messageType === LOAN_STATUS_REQUEST_TYPE) return;
    const template = MESSAGE_TYPES[messageType];
    setMessageDetails(buildMessageDetails(template.messageDetails, selectedLoan));
  };

  const handleSend = async () => {
    if (!messageType) {
      toast.error('Select a message type');
      return;
    }
    if (!hasPermissionForType(messageType)) {
      toast.error(
        isSensitiveType(messageType)
          ? 'You do not have permission to trigger this message type (requires elevated access)'
          : 'You do not have permission to trigger messages'
      );
      return;
    }

    if (requiresHeavyConfirmation(messageType)) {
      setPendingSend({ messageType });
      setConfirmModalOpen(true);
      return;
    }

    await sendMessage();
  };

  const handleConfirmedSend = async () => {
    setConfirmModalOpen(false);
    setPendingSend(null);
    await sendMessage();
  };

  const handleCancelConfirm = () => {
    setConfirmModalOpen(false);
    setPendingSend(null);
  };

  const handleValidate = () => {
    if (!messageType || messageType === LOAN_STATUS_REQUEST_TYPE) return;
    if (!messageDetails || !messageDetails.trim()) {
      toast.error('Message details are empty');
      return;
    }
    try {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`<root>${messageDetails}</root>`, 'application/xml');
      const parseError = doc.getElementsByTagName('parsererror')[0];
      if (parseError) {
        toast.error('Message details are not well-formed XML');
        return;
      }
      toast.success('Message details look well-formed');
    } catch (err) {
      toast.error('Could not parse message details as XML');
    }
  };

  const sendMessage = async () => {
    setSending(true);
    setResult(null);
    const startedAt = Date.now();
    try {
      let response;
      if (messageType === LOAN_STATUS_REQUEST_TYPE) {
        if (!applicationNumber) {
          toast.error('Application number is required');
          setSending(false);
          return;
        }
        response = await postRequest(API.MANUAL_LOAN_STATUS_REQUEST, {
          ApplicationNumber: applicationNumber,
        });
      } else {
        response = await postRequest(API.MANUAL_OUTGOING_MESSAGE, {
          MessageType: messageType,
          MessageDetails: messageDetails,
        });
      }
      const responseTimeMs = Date.now() - startedAt;

      const { success, sent, essResponse, responseCode, statusDesc, error } = response.data;
      if (!success) {
        toast.error(error || 'Failed to send message');
        setResult({ success: false, error, responseTimeMs });
        return;
      }
      toast.success('Message sent successfully');
      setResult({ success: true, sent, essResponse, responseCode, statusDesc, responseTimeMs });

      if (selectedLoan?.essApplicationNumber) {
        getMessageLogs({ applicationNumber: selectedLoan.essApplicationNumber, direction: 'outgoing', limit: 20 })
          .then((res) => setHistoryRows(res?.data?.messages || []))
          .catch(() => {});
      }
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message;
      toast.error(message);
      setResult({ success: false, error: message });
    } finally {
      setSending(false);
    }
  };

  // loanStatus shown in the UI comes from the suggestions endpoint's response (the same
  // LoanMapping.status the backend keyed its rules off), falling back to the loan lookup's
  // own status field while suggestions are still loading.
  const loanStatus = suggestions?.loanStatus || selectedLoan?.status;

  // "Suggested for this loan" / "Other message types" are derived entirely from the backend
  // (LoanMappingService.getSuggestedMessages) - suggested and allMessageTypes respectively.
  // This is a soft grouping only; every type stays fully selectable either way.
  const { suggested, other } = useMemo(() => {
    // LOAN_STATUS_REQUEST_TYPE is rendered separately below (dedicated ApplicationNumber
    // field instead of the XML editor) - exclude it here to avoid listing it twice.
    const composableTypes = new Set(
      Object.keys(MESSAGE_TYPES).filter((type) => type !== LOAN_STATUS_REQUEST_TYPE)
    );

    if (!selectedLoan || !suggestions) {
      return {
        suggested: [],
        other: [...composableTypes].map((type) => ({ type, ...MESSAGE_TYPES[type] })),
      };
    }

    const suggestedEntries = suggestions.suggested.filter(
      (s) => s.messageType !== LOAN_STATUS_REQUEST_TYPE && composableTypes.has(s.messageType)
    );
    const suggestedTypes = new Set(suggestedEntries.map((s) => s.messageType));

    const suggested = suggestedEntries.map((s) => ({
      type: s.messageType,
      ...MESSAGE_TYPES[s.messageType],
      reason: s.reason,
      requiresConfirmation: Boolean(s.requiresConfirmation),
    }));

    const other = (suggestions.allMessageTypes || [])
      .filter(
        (type) =>
          type !== LOAN_STATUS_REQUEST_TYPE && composableTypes.has(type) && !suggestedTypes.has(type)
      )
      .map((type) => ({ type, ...MESSAGE_TYPES[type] }));

    return { suggested, other };
  }, [selectedLoan, suggestions]);

  if (!canTrigger) {
    return (
      <div className="container">
        <Paper className="p-4 text-center">
          <h5 className="mb-2">Access restricted</h5>
          <p className="text-muted mb-0">
            Your account does not have permission to trigger manual messages. Contact your
            tenant admin to request the "messages:trigger" permission.
          </p>
        </Paper>
      </div>
    );
  }

  return (
    <div className="container">
      <h5 className="mb-1">Trigger Message</h5>
      <p className="text-muted mb-3">
        Manually send an outgoing message to ESS Utumishi for a specific loan.
      </p>

      <div className="mb-3">
        <PageSearchBar loanInputRef={loanInputRef} />
      </div>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <LoanLookupCard
            loanOptions={loanOptions}
            loanLoading={loanLoading}
            selectedLoan={selectedLoan}
            onLoanChange={handleLoanChange}
            onOpen={fetchLoans}
            inputRef={loanInputRef}
            loanStatus={loanStatus}
            suggestionsLoading={suggestionsLoading}
            suggestedCount={suggested.length}
          />
          <MessageHistoryCard
            rows={historyRows}
            loading={historyLoading}
            hasLoan={Boolean(selectedLoan)}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <MessageComposerCard
            messageType={messageType}
            onTypeChange={handleTypeChange}
            suggested={suggested}
            other={other}
            selectedLoan={selectedLoan}
            loanStatus={loanStatus}
            hasPermissionForType={hasPermissionForType}
            isSensitiveType={isSensitiveType}
            canTriggerSensitive={canTriggerSensitive}
            applicationNumber={applicationNumber}
            setApplicationNumber={setApplicationNumber}
            messageDetails={messageDetails}
            setMessageDetails={setMessageDetails}
            sending={sending}
            result={result}
            onSend={handleSend}
            onReset={handleReset}
            onValidate={handleValidate}
          />
        </Grid>
      </Grid>

      <LiquidationConfirmModal
        open={confirmModalOpen && pendingSend?.messageType === 'LOAN_LIQUIDATION_NOTIFICATION'}
        applicationNumber={selectedLoan?.essApplicationNumber}
        onCancel={handleCancelConfirm}
        onConfirm={handleConfirmedSend}
      />
    </div>
  );
};

export default ManualMessageTrigger;
