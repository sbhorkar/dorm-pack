/**
 * Validates that a URL uses a safe protocol (http or https only).
 * Prevents XSS attacks via javascript:, data:, or other malicious URL schemes.
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Returns the URL if it's safe, otherwise returns null.
 * Use this when rendering links to ensure only safe URLs are used.
 */
export function getSafeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return isSafeUrl(url) ? url : null;
}
