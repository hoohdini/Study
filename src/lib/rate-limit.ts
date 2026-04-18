const requests = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = requests.get(key);

  if (!current || current.expiresAt < now) {
    requests.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfterMs: current.expiresAt - now };
  }

  current.count += 1;
  requests.set(key, current);
  return { allowed: true, retryAfterMs: 0 };
}
