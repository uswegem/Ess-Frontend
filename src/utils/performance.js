/** Debounce function calls (search/filter inputs). */
export function debounce(fn, delayMs = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

const cacheStore = new Map();

/** Simple in-memory API response cache with TTL. */
export function getCached(key, ttlMs = 60000) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs = 60000) {
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearCache(key) {
  if (key) cacheStore.delete(key);
  else cacheStore.clear();
}

export const DEFAULT_PAGE_SIZE = 25;
export const DASHBOARD_CACHE_TTL_MS = 60000;
