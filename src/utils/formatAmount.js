// Shared money/number display formatting - display only, never use on values still being
// typed into an input (that's a separate cursor-position/parse-back problem, out of scope
// here). Two conventions, both built on Intl.NumberFormat:
//   - formatNumber: plain comma-separated digits, for dense table/list columns where a
//     repeated currency symbol in every cell is just noise (e.g. "10,000,000").
//   - formatCurrency: currency-prefixed, for standalone amounts with no column header for
//     context (e.g. "TZS 10,000,000").
// Both preserve decimals when present (rounded to 2dp, standard currency precision) without
// padding ".00" onto clean integers, and fall back to `emptyValue` for null/undefined/NaN
// instead of rendering "NaN" or "undefined".

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function toFiniteNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
}

export function formatNumber(value, { emptyValue = '—' } = {}) {
    const num = toFiniteNumber(value);
    if (num === null) return emptyValue;
    return NUMBER_FORMATTER.format(num);
}

export function formatCurrency(value, currency = 'TZS', { emptyValue = '—' } = {}) {
    const num = toFiniteNumber(value);
    if (num === null) return emptyValue;
    return `${currency} ${NUMBER_FORMATTER.format(num)}`;
}
