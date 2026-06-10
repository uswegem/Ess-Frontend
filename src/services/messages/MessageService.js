import { getRequest, postRequest } from '../../ApiFunction';
import { API, BASE_URL } from '../../Api';
import { createMessage, MessageStatus } from './types';

class MessageService {
  // Send any message type to the backend
  async sendMessage(type, payload) {
    try {
      const message = createMessage(type, payload);
      const response = await postRequest(`${BASE_URL}/api/messages`, message);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error sending message type ${type}:`, error);
      throw error;
    }
  }

  // Get message status
  async getMessageStatus(messageId) {
    try {
      const response = await getRequest(`${BASE_URL}/api/messages/${messageId}/status`);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error getting message status:`, error);
      throw error;
    }
  }

  // Handle API response
  handleResponse(response) {
    const { status, data, message } = response.data;
    
    if (!status) {
      throw new Error(message || 'Operation failed');
    }
    
    return data;
  }

  // Message Type Specific Methods

  // Account Validation
  async sendAccountValidation(accountId) {
    return this.sendMessage('ACCOUNT_VALIDATION_RESPONSE', { accountId });
  }

  // Loan Disbursement
  async sendLoanDisbursementNotification(loanId, amount, accountDetails) {
    return this.sendMessage('LOAN_DISBURSEMENT_NOTIFICATION', {
      loanId,
      amount,
      disbursementDate: new Date().toISOString(),
      accountDetails
    });
  }

  // Loan Repayment
  async sendFullLoanRepaymentNotification(loanId, repaymentAmount) {
    return this.sendMessage('FULL_LOAN_REPAYMENT_NOTIFICATION', {
      loanId,
      repaymentAmount,
      repaymentDate: new Date().toISOString(),
      status: MessageStatus.SUCCESS
    });
  }

  // Defaulter Details
  async sendDefaulterDetailsToEmployer(employeeId, loanId, defaultAmount, daysOverdue) {
    return this.sendMessage('DEFAULTER_DETAILS_TO_EMPLOYER', {
      employeeId,
      loanId,
      defaultAmount,
      daysOverdue,
      actionRequired: 'PAYMENT_REQUIRED'
    });
  }

  // FSP Branches
  async getFSPBranches() {
    return this.sendMessage('FSP_BRANCHES', {});
  }

  // Product Details
  async getProductDetails(productId) {
    return this.sendMessage('PRODUCT_DETAIL', { productId });
  }

  // Loan Restructure
  async sendLoanRestructureRequest(loanId, restructureDetails) {
    return this.sendMessage('LOAN_RESTRUCTURE_REQUEST_FSP', {
      loanId,
      restructureDetails
    });
  }

  // Payment Acknowledgment
  async sendPaymentAcknowledgment(paymentId, status) {
    return this.sendMessage('PAYMENT_ACKNOWLEDGMENT_NOTIFICATION', {
      paymentId,
      status,
      timestamp: new Date().toISOString()
    });
  }
}