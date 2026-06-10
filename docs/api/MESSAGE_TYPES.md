# Message Types Documentation

## Outgoing Messages (Sender = ZE)

### Message Type Details

1. **RESPONSE**
   - Purpose: General-purpose response message
   - Usage: For generic API responses
   - Required Fields: messageId, status, data

2. **ACCOUNT_VALIDATION_RESPONSE**
   - Purpose: Validate account details
   - Usage: Responding to account validation requests
   - Required Fields: accountId, isValid, details

3. **DEFAULTER_DETAILS_TO_EMPLOYER**
   - Purpose: Notify employer about loan defaulters
   - Usage: When loan payment is overdue
   - Required Fields: employeeId, loanId, defaultAmount

4. **FSP_BRANCHES**
   - Purpose: Provide FSP branch information
   - Usage: Branch location and contact details
   - Required Fields: branchId, name, location

5. **FULL_LOAN_REPAYMENT_NOTIFICATION**
   - Purpose: Notify full loan repayment
   - Usage: When loan is fully repaid
   - Required Fields: loanId, repaymentAmount, status

6. **FULL_LOAN_REPAYMENT_REQUEST**
   - Purpose: Request full loan repayment
   - Usage: When initiating full repayment
   - Required Fields: loanId, repaymentAmount

7. **LOAN_CHARGES_RESPONSE**
   - Purpose: Provide loan charge details
   - Usage: Response to charge inquiry
   - Required Fields: loanId, charges, breakdown

8. **LOAN_DISBURSEMENT_FAILURE_NOTIFICATION**
   - Purpose: Notify disbursement failure
   - Usage: When loan disbursement fails
   - Required Fields: loanId, failureReason

9. **LOAN_DISBURSEMENT_NOTIFICATION**
   - Purpose: Notify successful disbursement
   - Usage: When loan is disbursed
   - Required Fields: loanId, amount, status

10. **LOAN_INITIAL_APPROVAL_NOTIFICATION**
    - Purpose: Notify loan approval
    - Usage: When loan is initially approved
    - Required Fields: loanId, approvalDetails

11. **LOAN_LIQUIDATION_NOTIFICATION**
    - Purpose: Notify loan liquidation
    - Usage: When loan is liquidated
    - Required Fields: loanId, liquidationDetails

12. **LOAN_RESTRUCTURE_AFFORDABILITY_RESPONSE**
    - Purpose: Response to restructure affordability check
    - Usage: When checking restructure feasibility
    - Required Fields: loanId, affordabilityDetails

13. **LOAN_RESTRUCTURE_BALANCE_REQUEST**
    - Purpose: Request loan restructure balance
    - Usage: When initiating restructure
    - Required Fields: loanId, restructureParams

14. **LOAN_RESTRUCTURE_BALANCE_RESPONSE**
    - Purpose: Provide restructure balance details
    - Usage: Response to balance request
    - Required Fields: loanId, balanceDetails

15. **LOAN_RESTRUCTURE_REQUEST_FSP**
    - Purpose: Request FSP for loan restructure
    - Usage: When sending restructure to FSP
    - Required Fields: loanId, restructureDetails

16. **LOAN_STATUS_REQUEST**
    - Purpose: Request loan status
    - Usage: When checking loan status
    - Required Fields: loanId

17. **LOAN_TAKEOVER_BALANCE_RESPONSE**
    - Purpose: Provide takeover balance
    - Usage: When responding to takeover inquiry
    - Required Fields: loanId, takeoverAmount

18. **LOAN_TOP_UP_BALANCE_RESPONSE**
    - Purpose: Provide top-up balance details
    - Usage: When checking top-up availability
    - Required Fields: loanId, topUpDetails

19. **PARTIAL_LOAN_REPAYMENT_NOTIFICATION**
    - Purpose: Notify partial repayment
    - Usage: When partial payment is made
    - Required Fields: loanId, paymentAmount

20. **PARTIAL_REPAYMENT_OFF_BALANCE_RESPONSE**
    - Purpose: Provide off-balance repayment details
    - Usage: For off-balance sheet transactions
    - Required Fields: loanId, offBalanceDetails

21. **PAYMENT_ACKNOWLEDGMENT_NOTIFICATION**
    - Purpose: Acknowledge payment receipt
    - Usage: When payment is received
    - Required Fields: paymentId, status

22. **PRODUCT_DECOMMISSION**
    - Purpose: Notify product decommissioning
    - Usage: When product is retired
    - Required Fields: productId, decommissionDetails

23. **PRODUCT_DETAIL**
    - Purpose: Provide product details
    - Usage: When requesting product information
    - Required Fields: productId, productDetails

24. **TAKEOVER_DISBURSEMENT_NOTIFICATION**
    - Purpose: Notify takeover disbursement
    - Usage: When takeover is disbursed
    - Required Fields: takeoverId, disbursementDetails

## Implementation Guidelines

### Message Format
```typescript
interface BaseMessage {
  messageType: string;
  messageId: string;
  timestamp: string;
  sender: 'ZE';
  recipient: string;
}

interface MessagePayload<T> extends BaseMessage {
  payload: T;
}
```

### Error Handling
```typescript
interface MessageError {
  errorCode: string;
  errorMessage: string;
  details?: unknown;
}
```

### Validation Rules
1. All messages must include required fields
2. Timestamps must be in ISO format
3. Amount fields must be positive numbers
4. IDs must follow specified format