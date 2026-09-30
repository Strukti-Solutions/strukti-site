const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

type Bucket = {
  count: number;
  windowStart: number;
};

/**
 * Limite de taxa simples em memória, por processo. Suficiente para conter
 * abuso básico num MVP; não é distribuído entre instâncias.
 */
const buckets = new Map<string, Bucket>();

export function isRateLimited(identifier: string, now: number = Date.now()): boolean {
  const bucket = buckets.get(identifier);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(identifier, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}
