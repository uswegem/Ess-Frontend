import { debounce, getCached, setCached, clearCache } from '../../utils/performance';

describe('performance utilities', () => {
  beforeEach(() => clearCache());

  it('debounces function calls', (done) => {
    const fn = jest.fn();
    const debounced = debounce(fn, 50);
    debounced();
    debounced();
    setTimeout(() => {
      expect(fn).toHaveBeenCalledTimes(1);
      done();
    }, 80);
  });

  it('caches values with TTL', () => {
    setCached('k', { ok: true }, 1000);
    expect(getCached('k')).toEqual({ ok: true });
    clearCache('k');
    expect(getCached('k')).toBeNull();
  });
});
