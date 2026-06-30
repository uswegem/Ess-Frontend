import { isApiKeyActive } from '../../utils/apiKeyUtils';

describe('API key settings', () => {
  it('shows actions only for active keys', () => {
    expect(isApiKeyActive('active')).toBe(true);
    expect(isApiKeyActive('revoked')).toBe(false);
    expect(isApiKeyActive('expired')).toBe(false);
  });
});
