import API from '../../Api';
import { getRequest } from '../../ApiFunction';

// Backend is the single source of truth for suggestions (LoanMappingService.getSuggestedMessages) -
// this just fetches { loanStatus, suggested: [{messageType, reason, requiresConfirmation?}], allMessageTypes }.
export const getSuggestedMessages = (loanId) =>
  getRequest(API.suggestedMessages(loanId)).then((r) => r.data);
