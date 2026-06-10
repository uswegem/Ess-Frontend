# API Documentation

## Base URL
```
${BASE_URL}
```

## Authentication
All API endpoints require authentication using JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Common Response Format
```typescript
interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}
```

## API Endpoints

### 1. User Management

#### GET /api/users
Get all users list.

**Request:**
```
GET ${BASE_URL}/api/users
```

**Response:**
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

type Response = ApiResponse<User[]>;
```

### 2. Message Types

#### Outgoing Messages (ZE as Sender)

##### RESPONSE
General purpose response message.
```typescript
interface ResponseMessage {
  messageId: string;
  status: 'SUCCESS' | 'FAILED';
  data: unknown;
}
```

##### ACCOUNT_VALIDATION_RESPONSE
Response for account validation requests.
```typescript
interface AccountValidationResponse {
  accountId: string;
  isValid: boolean;
  details?: {
    accountName: string;
    accountStatus: string;
  };
}
```

##### DEFAULTER_DETAILS_TO_EMPLOYER
Send defaulter details to employer.
```typescript
interface DefaulterDetails {
  employeeId: string;
  loanId: string;
  defaultAmount: number;
  daysOverdue: number;
  actionRequired: string;
}
```

##### FSP_BRANCHES
List of FSP branches.
```typescript
interface FSPBranch {
  branchId: string;
  name: string;
  location: string;
  contact: string;
}

type FSPBranchesResponse = ApiResponse<FSPBranch[]>;
```

##### FULL_LOAN_REPAYMENT_NOTIFICATION
Notification for full loan repayment.
```typescript
interface LoanRepaymentNotification {
  loanId: string;
  repaymentAmount: number;
  repaymentDate: string;
  status: 'COMPLETED';
}
```

##### LOAN_DISBURSEMENT_NOTIFICATION
Notification for loan disbursement.
```typescript
interface LoanDisbursementNotification {
  loanId: string;
  amount: number;
  disbursementDate: string;
  accountDetails: {
    accountNumber: string;
    bankCode: string;
  };
}
```

... (other message types follow similar pattern)

### 3. Integration Points

#### Error Handling
```typescript
interface ApiError {
  status: boolean;
  message: string;
  errorCode: string;
  details?: unknown;
}
```

#### Rate Limiting
- Rate limit: 100 requests per minute
- Rate limit header: `X-RateLimit-Limit`
- Remaining requests: `X-RateLimit-Remaining`
- Reset time: `X-RateLimit-Reset`

#### Pagination
```typescript
interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

### 4. Security

#### Data Encryption
- All sensitive data must be encrypted using AES-256
- SSL/TLS required for all API calls
- API keys must be stored securely

#### Input Validation
- All inputs must be validated and sanitized
- Use appropriate content-type headers
- Maximum request size: 10MB

### 5. Testing

#### Test Environment
```
BASE_URL=https://api-test.miracoreadmin.com
```

#### Sample Test Data
Sample data available in `/docs/api/test-data`