// Manual message trigger types for the "Trigger Message" page.
//
// Payload shapes ported from MiraAdmin's messagePayloadTemplates.js (the ESS/Utumishi
// message catalog), but with Sender/Receiver/FSPCode stripped out entirely - the
// backend (outgoingMessagesController.js / loanStatusController.js) derives those from
// the authenticated tenant now, they are never accepted from the client.
//
// Keep SENSITIVE_MESSAGE_TYPES in sync with SENSITIVE_MANUAL_TRIGGER_MESSAGE_TYPES in
// backend/src/utils/loanConstants.js.

const generateRandomId = () => Math.floor(Math.random() * 100000);
// ESS expects a dateTime with no trailing "Z"
const nowForEss = () => new Date().toISOString().replace('Z', '');

// Message types that require the elevated 'messages:trigger_sensitive' permission
// (money movement / loan finality) rather than the base 'messages:trigger'.
export const SENSITIVE_MESSAGE_TYPES = [
  'LOAN_DISBURSEMENT_NOTIFICATION',
  'LOAN_DISBURSEMENT_FAILURE_NOTIFICATION',
  'TAKEOVER_DISBURSEMENT_NOTIFICATION',
  'LOAN_LIQUIDATION_NOTIFICATION',
  'FULL_LOAN_REPAYMENT_NOTIFICATION',
  'PARTIAL_LOAN_REPAYMENT_NOTIFICATION',
  'PAYMENT_ACKNOWLEDGMENT_NOTIFICATION',
];

// Special case: triggered via POST /loan-status-request with a plain
// { ApplicationNumber } body, not the generic { MessageType, MessageDetails } shape.
export const LOAN_STATUS_REQUEST_TYPE = 'LOAN_STATUS_REQUEST';

// messageDetails is the raw MessageDetails XML fragment. Supports placeholders:
//   {{RANDOM}}            - a random numeric id
//   {{NOW}} / {{DATE}}    - current ESS-formatted dateTime
//   ESS{{RANDOM}}         - replaced with the selected loan's essApplicationNumber, if any
//   LOAN{{RANDOM}}        - replaced with the selected loan's essLoanNumberAlias/essApplicationNumber, if any
export const MESSAGE_TYPES = {
  LOAN_DISBURSEMENT_NOTIFICATION: {
    displayName: 'Loan Disbursement',
    description: 'Notify successful loan disbursement',
    category: 'Disbursement & Approval',
    messageDetails: '<ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><Reason>Disbursement successful</Reason><FSPReferenceNumber>FSP{{RANDOM}}</FSPReferenceNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><TotalAmountToPay>5000.00</TotalAmountToPay><DisbursementDate>{{NOW}}</DisbursementDate>',
  },
  LOAN_DISBURSEMENT_FAILURE_NOTIFICATION: {
    displayName: 'Disbursement Failure',
    description: 'Notify loan disbursement failure',
    category: 'Disbursement & Approval',
    messageDetails: '<ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><Reason>Insufficient funds in account</Reason>',
  },
  LOAN_INITIAL_APPROVAL_NOTIFICATION: {
    displayName: 'Loan Approval',
    description: 'Notify initial loan approval from FSP',
    category: 'Disbursement & Approval',
    messageDetails: '<ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><Reason>Loan approved by FSP</Reason><FSPReferenceNumber>FSP{{RANDOM}}</FSPReferenceNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><TotalAmountToPay>5000.00</TotalAmountToPay><OtherCharges>100.00</OtherCharges><Approval>APPROVED</Approval>',
  },
  LOAN_LIQUIDATION_NOTIFICATION: {
    displayName: 'Loan Liquidation',
    description: 'Notify loan liquidation/full closure',
    category: 'Disbursement & Approval',
    messageDetails: '<ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><Remarks>Loan fully repaid and closed</Remarks>',
  },
  [LOAN_STATUS_REQUEST_TYPE]: {
    displayName: 'Loan Status Request',
    description: 'Request current loan status from ESS',
    category: 'Disbursement & Approval',
    // No messageDetails - this type is submitted as { ApplicationNumber } to a
    // different endpoint. See LOAN_STATUS_REQUEST_TYPE handling in the page.
  },

  FULL_LOAN_REPAYMENT_NOTIFICATION: {
    displayName: 'Full Repayment',
    description: 'Notify complete loan repayment',
    category: 'Repayment',
    messageDetails: '<CheckNumber>{{CHECKNUMBER}}</CheckNumber><ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><PaymentReference>PAY{{RANDOM}}</PaymentReference><DeductionCode>DC001</DeductionCode><PaymentDescription>Full loan repayment</PaymentDescription><PaymentDate>{{NOW}}</PaymentDate><PaymentAmount>5000.00</PaymentAmount><LoanBalance>0.00</LoanBalance>',
  },
  PARTIAL_LOAN_REPAYMENT_NOTIFICATION: {
    displayName: 'Partial Repayment',
    description: 'Notify partial loan repayment',
    category: 'Repayment',
    messageDetails: '<CheckNumber>{{CHECKNUMBER}}</CheckNumber><ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><PaymentReference>PAY{{RANDOM}}</PaymentReference><DeductionCode>DC001</DeductionCode><PaymentDescription>Partial payment installment</PaymentDescription><PaymentDate>{{NOW}}</PaymentDate><MaturityDate>{{DATE}}</MaturityDate><PaymentAmount>1000.00</PaymentAmount><LoanBalance>4000.00</LoanBalance>',
  },
  PAYMENT_ACKNOWLEDGMENT_NOTIFICATION: {
    displayName: 'Payment Acknowledgment',
    description: 'Acknowledge payment receipt from ESS',
    category: 'Repayment',
    messageDetails: '<ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><Remarks>Payment received and processed</Remarks><FSPReferenceNumber>FSP{{RANDOM}}</FSPReferenceNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><PaymentStatus>CONFIRMED</PaymentStatus>',
  },
  FULL_LOAN_REPAYMENT_REQUEST: {
    displayName: 'Full Repayment Request',
    description: 'Request full loan repayment details',
    category: 'Repayment',
    messageDetails: '<LoanNumber>LOAN{{RANDOM}}</LoanNumber><CheckNumber>{{CHECKNUMBER}}</CheckNumber><ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber>',
  },

  LOAN_RESTRUCTURE_REQUEST_FSP: {
    displayName: 'Restructure Request (FSP)',
    description: 'FSP-initiated loan restructure request',
    category: 'Restructuring & Takeover',
    messageDetails: '<ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><InstallmentAmount>450.00</InstallmentAmount><OutstandingBalance>4500.00</OutstandingBalance><PrincipalBalance>4000.00</PrincipalBalance><ValidityDate>{{DATE}}</ValidityDate><LastRepaymentDate>{{DATE}}</LastRepaymentDate><MaturityDate>{{DATE}}</MaturityDate><Reason>FINANCIAL_HARDSHIP</Reason><NewInstallmentAmount>350.00</NewInstallmentAmount><NewInsuranceAmount>50.00</NewInsuranceAmount><NewProcessingFee>100.00</NewProcessingFee><NewInterestAmount>500.00</NewInterestAmount><NewPrincipalAmount>4000.00</NewPrincipalAmount><NewTotalAmountPayable>4650.00</NewTotalAmountPayable><OtherCharges>0.00</OtherCharges><NewTenure>15</NewTenure><ProductCode>LN001</ProductCode><DeductionCode>DC001</DeductionCode><FSPReferenceNumber>FSP{{RANDOM}}</FSPReferenceNumber>',
  },
  TAKEOVER_DISBURSEMENT_NOTIFICATION: {
    displayName: 'Takeover Disbursement',
    description: 'Notify takeover disbursement completion',
    category: 'Restructuring & Takeover',
    messageDetails: '<ApplicationNumber>ESS{{RANDOM}}</ApplicationNumber><Reason>Takeover disbursement successful</Reason><FSPReferenceNumber>FSP{{RANDOM}}</FSPReferenceNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><TotalAmountToPay>6000.00</TotalAmountToPay><DisbursementDate>{{NOW}}</DisbursementDate><PaymentAdvice>Funds transferred to previous FSP</PaymentAdvice><PaymentAdviceAttachment>payment_proof.pdf</PaymentAdviceAttachment>',
  },

  DEFAULTER_DETAILS_TO_EMPLOYER: {
    displayName: 'Defaulter Details',
    description: 'Send defaulter information to employer',
    category: 'Account & Employer',
    messageDetails: '<VoteCode>V001</VoteCode><VoteName>Ministry of Finance</VoteName><CheckNumber>{{CHECKNUMBER}}</CheckNumber><LoanNumber>LOAN{{RANDOM}}</LoanNumber><FirstName>John</FirstName><MiddleName>Michael</MiddleName><LastName>Doe</LastName><InstallmentAmount>450.00</InstallmentAmount><DeductionName>Loan Repayment</DeductionName><DeductionCode>DC001</DeductionCode><OutstandingBalance>2000.00</OutstandingBalance><LastPayDate>{{DATE}}</LastPayDate>',
  },

  PRODUCT_DETAIL: {
    displayName: 'Product Details',
    description: 'Provide complete product information and terms',
    category: 'Product & FSP',
    messageDetails: '<DeductionCode>DC001</DeductionCode><ProductCode>LN001</ProductCode><ProductName>Personal Loan</ProductName><ProductDescription>Standard personal loan for employees</ProductDescription><ForExecutive>N</ForExecutive><MinimumTenure>6</MinimumTenure><MaximumTenure>24</MaximumTenure><InterestRate>15.5</InterestRate><ProcessFee>2.0</ProcessFee><Insurance>1.0</Insurance><MaxAmount>50000.00</MaxAmount><MinAmount>1000.00</MinAmount><RepaymentType>MONTHLY</RepaymentType><Currency>TZS</Currency><InsuranceType>LIFE</InsuranceType><ShariaFacility>N</ShariaFacility>',
  },
  PRODUCT_DECOMMISSION: {
    displayName: 'Product Decommission',
    description: 'Notify product retirement/discontinuation',
    category: 'Product & FSP',
    messageDetails: '<ProductCode>LN001</ProductCode>',
  },
  FSP_BRANCHES: {
    displayName: 'FSP Branches',
    description: 'Provide FSP branch information by district',
    category: 'Product & FSP',
    messageDetails: '<BranchDetail><DistrictCode>D001</DistrictCode><Branch><BranchCode>BR001</BranchCode><BranchName>Main Branch - Dar es Salaam</BranchName></Branch></BranchDetail>',
  },

  RESPONSE: {
    displayName: 'General Response',
    description: 'Generic response message for various requests',
    category: 'General',
    messageDetails: '<ResponseCode>8000</ResponseCode><Description>Request processed successfully</Description>',
  },
};

// Categories in display order, for grouping the dropdown/menu.
export const MESSAGE_CATEGORIES = [
  'Disbursement & Approval',
  'Repayment',
  'Restructuring & Takeover',
  'Account & Employer',
  'Product & FSP',
  'General',
];

// Substitutes {{RANDOM}}/{{NOW}}/{{DATE}}/{{CHECKNUMBER}}/ESS{{RANDOM}}/LOAN{{RANDOM}}
// placeholders in a message's messageDetails template, using the selected loan's data
// where available. Returns the finished MessageDetails XML string.
export function buildMessageDetails(messageDetails, loan) {
  let details = messageDetails || '';

  if (loan?.essApplicationNumber) {
    details = details.replace(/ESS\{\{RANDOM\}\}/g, loan.essApplicationNumber);
  }
  if (loan?.essLoanNumberAlias) {
    details = details.replace(/LOAN\{\{RANDOM\}\}/g, loan.essLoanNumberAlias);
  } else if (loan?.essApplicationNumber) {
    details = details.replace(/LOAN\{\{RANDOM\}\}/g, loan.essApplicationNumber);
  }
  if (loan?.essCheckNumber || loan?.clientData?.checkNumber) {
    details = details.replace(/\{\{CHECKNUMBER\}\}/g, loan.essCheckNumber || loan.clientData.checkNumber);
  }

  details = details
    .replace(/\{\{RANDOM\}\}/g, () => generateRandomId())
    .replace(/\{\{NOW\}\}/g, () => nowForEss())
    .replace(/\{\{DATE\}\}/g, () => nowForEss());

  return details;
}
