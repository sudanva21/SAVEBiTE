// ==============================================
// SaveByte — Utility Functions
// ==============================================

/**
 * Merge CSS class names, filtering out falsy values.
 * Lightweight alternative to `clsx` — no dependencies needed.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a number with compact notation (e.g., 1.2K, 3.5M).
 */
export function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Delay execution for a given number of milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a placeholder avatar URL from initials.
 */
export function getInitialsAvatar(name: string): string {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${initials}&background=10b981&color=fff&bold=true`;
}
