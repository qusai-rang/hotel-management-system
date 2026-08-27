import { randomUUID } from 'node:crypto';

/**
 * Safe correlation-id charset. Rejects anything that could smuggle control
 * characters into response headers or log lines; oversized or malformed
 * client-supplied ids fall back to a generated UUID.
 */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

/** Uses the incoming X-Request-Id value when present and safe, else a UUID. */
export function resolveRequestId(incoming: unknown): string {
  const raw = Array.isArray(incoming) ? incoming[0] : incoming;
  if (typeof raw === 'string') {
    const candidate = raw.trim();
    if (REQUEST_ID_PATTERN.test(candidate)) {
      return candidate;
    }
  }
  return randomUUID();
}
