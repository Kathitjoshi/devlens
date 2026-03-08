/**
 * Validate external URL
 * Only allows http and https protocols
 */
export function isValidExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Get safe domain name from URL
 */
export function getSafeDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'external site';
  }
}

/**
 * Open external link safely
 * Always use this for external URLs - never use raw <a href>
 */
export function openExternalLink(url: string): void {
  if (!isValidExternalUrl(url)) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
