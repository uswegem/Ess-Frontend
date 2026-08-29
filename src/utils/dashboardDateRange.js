// Date-range presets for the Dashboard's shared MiraCore Summary / ESS Summary date control
// (see Dashboard.js). One shared range is applied to both sections (not independent
// per-section controls), per the earlier design decision.
//
// Range boundaries are sent to the backend as plain "yyyy-MM-dd" strings, matching the
// convention dashboardController.js expects (parsed via `new Date(str)`, which is UTC-midnight
// per the ISO 8601 date-only spec - see that file's parseRangeFromQuery comment for why this
// matters on a server running ahead of UTC). Built directly from the browser's local calendar
// fields (getFullYear/getMonth/getDate), never through toISOString() on a local Date, for the
// same reason formatDate() in fineractIncomeSummary.js avoids it server-side.

export const PRESETS = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Custom'];

const STORAGE_KEY = 'dashboard-date-range';

function toDateOnlyString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeek(d) {
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // ISO week: Monday start
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  return start;
}

/**
 * @param {string} preset - one of PRESETS
 * @param {{from: string, to: string}|null} custom - required, already-validated when preset === 'Custom'
 * @returns {{from: string, to: string}} plain yyyy-MM-dd strings
 */
export function computeRange(preset, custom = null) {
  const now = new Date();
  const today = toDateOnlyString(now);

  switch (preset) {
    case 'Today':
      return { from: today, to: today };
    case 'This Week':
      return { from: toDateOnlyString(startOfWeek(now)), to: today };
    case 'This Quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return { from: toDateOnlyString(new Date(now.getFullYear(), quarterStartMonth, 1)), to: today };
    }
    case 'This Year':
      return { from: toDateOnlyString(new Date(now.getFullYear(), 0, 1)), to: today };
    case 'Custom':
      return custom && custom.from && custom.to ? custom : { from: today, to: today };
    case 'This Month':
    default:
      return { from: toDateOnlyString(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }
}

/**
 * Reads the last-selected preset/custom range for this browser session, defaulting to
 * "This Month" when nothing is stored (first load, or a fresh session - sessionStorage, not
 * localStorage, deliberately: persists across reloads within the tab session without a
 * days-old selection silently carrying into a brand new session and looking stale).
 */
export function loadStoredRangeSelection() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { preset: 'This Month', custom: null };
    const parsed = JSON.parse(raw);
    if (!PRESETS.includes(parsed.preset)) return { preset: 'This Month', custom: null };
    return parsed;
  } catch {
    return { preset: 'This Month', custom: null };
  }
}

export function storeRangeSelection(preset, custom) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ preset, custom }));
  } catch {
    // sessionStorage unavailable (private browsing, etc.) - selection just won't persist, non-fatal
  }
}
