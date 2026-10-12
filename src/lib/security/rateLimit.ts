/**
 * High-performance, memory-bounded sliding-window rate limiter for public API endpoints.
 * Protects clinical AI inference endpoints from quota exhaustion and denial-of-service spikes.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_CACHE_ENTRIES = 5000;

// Periodic cleanup of expired rate limit entries every 2 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    });
  }, 120_000).unref?.();
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and increments request count for a given identifier within a time window.
 *
 * @param identifier Client IP, session ID, or user identifier
 * @param limit Maximum requests allowed within the window (default 45 requests)
 * @param windowMs Time window in milliseconds (default 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit = 45,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const key = identifier || "anonymous_client";

  // Prevent memory exhaustion under DDoS
  if (rateLimitMap.size >= MAX_CACHE_ENTRIES && !rateLimitMap.has(key)) {
    let evicted = 0;
    rateLimitMap.forEach((_, k) => {
      if (evicted++ < 500) {
        rateLimitMap.delete(k);
      }
    });
  }

  const record = rateLimitMap.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}
