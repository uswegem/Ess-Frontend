// Builds a read-only preview of the full Document envelope a manual-trigger send will
// produce - Header fields + the operator's current MessageDetails fragment + a placeholder
// Signature. Not used for anything sent to the backend - display only.
//
// Sender/Receiver/FSPCode are safe to construct here because they're deterministic and
// already available client-side (activeTenant.fspName/fspCode, from the same tenant
// context outgoingMessageService.js/loanStatusController.js derive Sender/FSPCode from
// server-side) - this can't drift from what's actually sent.
//
// MsgId and Signature are deliberately NOT constructed here - messageIdGenerator.js
// includes a fresh random component on every call, generated only at the moment of actual
// send, so any client-side value would be fabricated, not a preview. Shown as placeholders
// instead of a guessed value.
export function buildEnvelopePreview(messageType, messageDetailsFragment, activeTenant) {
  const sender = activeTenant?.fspName || 'ZE DONE';
  const fspCode = activeTenant?.fspCode || '';

  return `<Document>
  <Data>
    <Header>
      <Sender>${sender}</Sender>
      <Receiver>ESS_UTUMISHI</Receiver>
      <FSPCode>${fspCode}</FSPCode>
      <MsgId>[generated on send]</MsgId>
      <MessageType>${messageType || ''}</MessageType>
    </Header>
    <MessageDetails>
      ${messageDetailsFragment || ''}
    </MessageDetails>
  </Data>
  <Signature>[will be generated on send]</Signature>
</Document>`;
}
