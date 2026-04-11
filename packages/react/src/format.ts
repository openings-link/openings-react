/**
 * Display formatting utilities for booking UI.
 * Zero dependencies — pure string formatting functions.
 */

/** Convert 24h time (e.g. "14:30") to 12h ("2:30 pm"). */
export function formatTime(
  time24: string,
  options?: { use24Hour?: boolean },
): string {
  if (options?.use24Hour) return time24;
  const [hh, mm] = time24.split(":");
  const h = parseInt(hh, 10);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mm} ${suffix}`;
}

/** Format a price for display. Defaults to USD / en-US. */
export function formatPrice(
  amount: number,
  options?: { currency?: string; locale?: string },
): string {
  const currency = options?.currency ?? "USD";
  const locale = options?.locale ?? "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits,
    }).format(amount);
  } catch {
    const fraction = Math.round(amount * 100) % 100;
    return `${currency} ${amount.toFixed(fraction === 0 ? 0 : 2)}`;
  }
}

/** Format duration in minutes. e.g. 90 → "1h 30m", 45 → "45 mins" */
export function formatDuration(minutes: number): string {
  if (!minutes) return "0 mins";
  if (minutes < 60) return `${minutes} mins`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
