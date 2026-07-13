// Tiny classname joiner — no dependency needed for this prototype.
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
