// Example payloads for manual message triggers

export const MESSAGE_PAYLOAD_EXAMPLES = {
  LOAN_DISBURSEMENT_NOTIFICATION: {
    loanId: "LOAN123",
    amount: 5000,
    accountDetails: {
      accountNumber: "1234567890",
      bankCode: "001"
    },
    disbursementDate: new Date().toISOString()
  },

  LOAN_RESTRUCTURE_REQUEST: {
    loanId: "LOAN123",
    restructureDetails: {
      newTenure: 12,
      newAmount: 4500,
      reason: "FINANCIAL_HARDSHIP"
    }
  },

  LOAN_REPAYMENT_NOTIFICATION: {
    loanId: "LOAN123",
    amount: 1000,
    type: "PARTIAL", // or "FULL"
    paymentDate: new Date().toISOString()
  },

  ACCOUNT_VALIDATION_REQUEST: {
    accountId: "ACC123",
    validationType: "KYC"
  },

  PRODUCT_DECOMMISSION: {
    productId: "PROD123",
    reason: "OBSOLETE",
    effectiveDate: new Date().toISOString()
  },

  FSP_BRANCHES_REQUEST: {
    fspId: "FSP123",
    region: "EAST"
  },

  DEFAULTER_DETAILS_REQUEST: {
    employeeId: "EMP123",
    loanId: "LOAN123",
    defaultAmount: 2000,
    daysOverdue: 30
  }
};