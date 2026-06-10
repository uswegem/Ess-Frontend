// Message types that can be manually triggered
export const MANUAL_MESSAGE_TYPES = {
  // Loan Related
  LOAN_DISBURSEMENT_NOTIFICATION: '/messages/loan-disbursement',
  LOAN_RESTRUCTURE_REQUEST: '/messages/loan-restructure',
  LOAN_REPAYMENT_NOTIFICATION: '/messages/loan-repayment',
  
  // Account Related
  ACCOUNT_VALIDATION_REQUEST: '/messages/account-validation',
  
  // Product Related
  PRODUCT_DECOMMISSION: '/messages/product-decommission',
  
  // FSP Related
  FSP_BRANCHES_REQUEST: '/messages/fsp-branches',
  
  // Employer Related
  DEFAULTER_DETAILS_REQUEST: '/messages/defaulter-details'
};

// Message status types
export const MESSAGE_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING'
};

// Simple function to trigger manual messages
export const triggerManualMessage = async (type, payload) => {
  if (!MANUAL_MESSAGE_TYPES[type]) {
    throw new Error(`Invalid message type: ${type}`);
  }
  
  try {
    const endpoint = MANUAL_MESSAGE_TYPES[type];
    const response = await postRequest(endpoint, payload);
    return response.data;
  } catch (error) {
    console.error(`Error triggering ${type}:`, error);
    throw error;
  }
};