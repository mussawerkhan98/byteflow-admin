/**
 * A fixed-window request counter kept in memory. The admin runs as one
 * process on the server, so one counter per process is the whole count; a
 * restart simply starts the windows again.
 */
export type RateLimiter = {
  /** Counts one request for this key; ok is false once the window's limit is used up. */
  hit(key: string, now?: number): { ok: boolean; retryAfter: number };
};

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    hit(key, now = Date.now()) {
      let window = windows.get(key);
      if (!window || now - window.start >= windowMs) {
        window = { start: now, count: 0 };
        windows.set(key, window);
        // Forget windows that have ended, so the map can't grow without limit.
        if (windows.size > 5000) for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
      }
      window.count += 1;
      const retryAfter = Math.max(1, Math.ceil((window.start + windowMs - now) / 1000));
      return { ok: window.count <= limit, retryAfter };
    },
  };
}
