// lib/dates.js — safe date formatting helpers

/**
 * Format a date string safely, returning a fallback on invalid input.
 * @param {string|Date|null|undefined} value
 * @param {Intl.DateTimeFormatOptions} opts
 * @param {string} fallback
 */
export function formatDateSafe(value, opts = {}, fallback = '—') {
  if (!value) return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return fallback;
    // For date-only strings (YYYY-MM-DD), parse as local to avoid UTC-offset shift
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, day] = value.split('-').map(Number);
      const local = new Date(y, m - 1, day);
      return local.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', ...opts });
    }
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', ...opts });
  } catch {
    return fallback;
  }
}

export function formatTimeSafe(value, opts = {}, fallback = '—') {
  if (!value) return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', ...opts });
  } catch {
    return fallback;
  }
}
