// Explicit India offset keeps the event consistent on every visitor's device.
export const CHHATH_COUNTDOWN_TARGET = Date.parse("2026-11-15T15:30:00+05:30");

export function getCountdown(now: number) {
  const remaining = Math.max(0, Math.ceil((CHHATH_COUNTDOWN_TARGET - now) / 1000));
  return {
    days: Math.floor(remaining / 86400),
    hours: Math.floor((remaining % 86400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
    complete: remaining === 0,
  };
}
