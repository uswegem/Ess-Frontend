// Message queue statuses
export const QUEUE_STATUS = {
  PENDING_RESPONSE: 'PENDING_RESPONSE',
  RESPONSE_FAILED: 'RESPONSE_FAILED',
  RESPONSE_SENT: 'RESPONSE_SENT',
  MANUAL_INTERVENTION_REQUIRED: 'MANUAL_INTERVENTION_REQUIRED'
};

// Response types mapping
export const RESPONSE_TYPES = {
  ACCOUNT_VALIDATION_RESPONSE: {
    requestType: 'ACCOUNT_VALIDATION_REQUEST',
    fields: ['accountId', 'validationDetails']
  },
  LOAN_CHARGES_RESPONSE: {
    requestType: 'LOAN_CHARGES_REQUEST',
    fields: ['loanId', 'chargeDetails']
  },
  LOAN_RESTRUCTURE_AFFORDABILITY_RESPONSE: {
    requestType: 'LOAN_RESTRUCTURE_REQUEST',
    fields: ['loanId', 'affordabilityDetails']
  },
  LOAN_RESTRUCTURE_BALANCE_RESPONSE: {
    requestType: 'LOAN_RESTRUCTURE_BALANCE_REQUEST',
    fields: ['loanId', 'balanceDetails']
  },
  LOAN_TAKEOVER_BALANCE_RESPONSE: {
    requestType: 'LOAN_TAKEOVER_REQUEST',
    fields: ['loanId', 'takeoverDetails']
  },
  LOAN_TOP_UP_BALANCE_RESPONSE: {
    requestType: 'LOAN_TOP_UP_REQUEST',
    fields: ['loanId', 'topUpDetails']
  },
  PARTIAL_REPAYMENT_OFF_BALANCE_RESPONSE: {
    requestType: 'PARTIAL_REPAYMENT_REQUEST',
    fields: ['loanId', 'repaymentDetails']
  }
};

// Get pending/failed responses that need manual intervention
export const fetchPendingResponses = async () => {
  try {
    const result = await getRequest(`${BASE_URL}/api/messages/pending-responses`);
    return result.data;
  } catch (error) {
    console.error('Error fetching pending responses:', error);
    throw error;
  }
};

// Get original request details by ID
export const fetchRequestDetails = async (requestId) => {
  try {
    const result = await getRequest(`${BASE_URL}/api/messages/request/${requestId}`);
    return result.data;
  } catch (error) {
    console.error('Error fetching request details:', error);
    throw error;
  }
};

// Send manual response
export const sendManualResponse = async (responseType, requestId, responseData) => {
  try {
    const endpoint = `/api/messages/manual-response/${responseType}`;
    const payload = {
      requestId,
      responseData,
      manuallyTriggered: true
    };
    
    const result = await postRequest(endpoint, payload);
    return result.data;
  } catch (error) {
    console.error('Error sending manual response:', error);
    throw error;
  }
};