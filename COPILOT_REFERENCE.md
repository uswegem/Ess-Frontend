# MiraCoreAdmin - Development Reference Guide

## System Architecture Overview

The MiraCoreAdmin system consists of multiple interconnected components:

1. React Web Applications:
   - Admin Portal (MiraCoreAdmin)
   - Employer/FSP Portal
   - Employee Mobile App (React Native)

2. API Integration Architecture:
   - RESTful API communication
   - Node.js backend integration
   - Secure data transmission
   - Role-based access control

## Supported API Message Types

### Outgoing Messages (Sender = ZE)

All outgoing messages must be implemented in the frontend with both manual and automatic triggering capabilities:

```typescript
type OutgoingMessageType =
  | 'RESPONSE'
  | 'ACCOUNT_VALIDATION_RESPONSE'
  | 'DEFAULTER_DETAILS_TO_EMPLOYER'
  | 'FSP_BRANCHES'
  | 'FULL_LOAN_REPAYMENT_NOTIFICATION'
  | 'FULL_LOAN_REPAYMENT_REQUEST'
  | 'LOAN_CHARGES_RESPONSE'
  | 'LOAN_DISBURSEMENT_FAILURE_NOTIFICATION'
  | 'LOAN_DISBURSEMENT_NOTIFICATION'
  | 'LOAN_INITIAL_APPROVAL_NOTIFICATION'
  | 'LOAN_LIQUIDATION_NOTIFICATION'
  | 'LOAN_RESTRUCTURE_AFFORDABILITY_RESPONSE'
  | 'LOAN_RESTRUCTURE_BALANCE_REQUEST'
  | 'LOAN_RESTRUCTURE_BALANCE_RESPONSE'
  | 'LOAN_RESTRUCTURE_REQUEST_FSP'
  | 'LOAN_STATUS_REQUEST'
  | 'LOAN_TAKEOVER_BALANCE_RESPONSE'
  | 'LOAN_TOP_UP_BALANCE_RESPONSE'
  | 'PARTIAL_LOAN_REPAYMENT_NOTIFICATION'
  | 'PARTIAL_REPAYMENT_OFF_BALANCE_RESPONSE'
  | 'PAYMENT_ACKNOWLEDGMENT_NOTIFICATION'
  | 'PRODUCT_DECOMMISSION'
  | 'PRODUCT_DETAIL'
  | 'TAKEOVER_DISBURSEMENT_NOTIFICATION';
```

## Frontend Architecture

### React Web Applications

1. Admin Portal (MiraCoreAdmin):
   - System administration interface
   - User management
   - Role and permission configuration
   - System monitoring and reporting
   - Multi-tenant management

2. Employer/FSP Portal:
   - Loan management interface
   - Employee data management
   - Financial transaction tracking
   - Reports and analytics
   - Document management

3. React Native Mobile App:
   - Employee self-service
   - Loan application and tracking
   - Profile management
   - Document upload
   - Notifications

### Core Features

1. Security:
   ```typescript
   interface SecurityFeatures {
     authentication: 'JWT' | 'OAuth2';
     authorization: 'RBAC';
     encryption: 'AES-256';
     dataProtection: 'TLS/SSL';
   }
   ```

2. Role-Based Access Control:
   ```typescript
   interface RolePermissions {
     roles: {
       ADMIN: string[];
       EMPLOYER: string[];
       FSP: string[];
       EMPLOYEE: string[];
     };
     permissions: {
       CREATE: string[];
       READ: string[];
       UPDATE: string[];
       DELETE: string[];
     };
   }
   ```

3. Multi-tenant Support:
   ```typescript
   interface TenantConfiguration {
     id: string;
     name: string;
     domain: string;
     settings: {
       theme: ThemeConfig;
       features: FeatureFlags;
       integration: IntegrationConfig;
     };
   }
   ```

### Development Guidelines

1. Code Structure:
   - Use modular architecture
   - Implement component-based development
   - Follow clean code principles
   - Maintain consistent naming conventions

2. State Management:
   - Use Redux for global state
   - Implement context for component-level state
   - Handle side effects with middleware

3. API Integration:
   ```typescript
   interface ApiConfig {
     baseUrl: string;
     version: string;
     endpoints: {
       [key in OutgoingMessageType]: string;
     };
     headers: {
       Authorization: string;
       'Content-Type': string;
     };
   }
   ```

4. Error Handling:
   ```typescript
   interface ErrorResponse {
     status: number;
     message: string;
     code: string;
     details?: unknown;
     timestamp: string;
   }
   ```

5. Logging and Monitoring:
   - Implement comprehensive logging
   - Track user actions
   - Monitor system performance
   - Maintain audit trails

## Best Practices

1. Component Development:
   - Use functional components
   - Implement proper prop typing
   - Handle loading and error states
   - Implement proper cleanup

2. Data Management:
   - Implement proper caching
   - Handle data pagination
   - Implement data validation
   - Use proper error boundaries

3. Performance:
   - Implement code splitting
   - Use lazy loading
   - Optimize bundle size
   - Implement proper memoization

4. Testing:
   - Write unit tests
   - Implement integration tests
   - Perform end-to-end testing
   - Maintain good test coverage

## API Integration Example

```typescript
const apiHandler = async (messageType: OutgoingMessageType, payload: unknown) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${messageType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in ${messageType}:`, error);
    throw error;
  }
};
```

## Contribution Guidelines

1. Code Review Process:
   - Follow PR template
   - Implement proper testing
   - Maintain code quality
   - Document changes

2. Documentation:
   - Keep documentation updated
   - Document API changes
   - Maintain change logs
   - Update README files

3. Version Control:
   - Follow Git flow
   - Use meaningful commit messages
   - Maintain clean history
   - Tag releases properly