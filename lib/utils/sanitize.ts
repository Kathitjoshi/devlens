/**
 * Sanitize search query input
 * Removes HTML tags, trims whitespace, limits length, removes special chars
 */
export function sanitizeQuery(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit to 200 chars
  sanitized = sanitized.substring(0, 200);
  
  // Remove special characters except spaces, hyphens, dots
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-\.]/g, '');
  
  return sanitized;
}

/**
 * Sanitize topic name
 * Trim, lowercase, limit length, only alphanumeric and hyphens
 */
export function sanitizeTopicName(input: string): string {
  if (!input) return '';
  
  let sanitized = input.trim().toLowerCase();
  sanitized = sanitized.substring(0, 50);
  sanitized = sanitized.replace(/[^a-z0-9\-]/g, '');
  
  return sanitized;
}
