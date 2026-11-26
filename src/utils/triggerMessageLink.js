// Opens the Trigger Message page with this loan already selected. Notifications are sent
// only from there, where the values can be checked, edited and confirmed.
export const triggerMessageLink = (loan) =>
  `/messages/trigger?application=${encodeURIComponent(loan.essApplicationNumber || '')}`;
