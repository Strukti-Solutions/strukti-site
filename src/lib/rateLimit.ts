const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

type Bucket = {
  count: number;
  windowStart: number;
};

/**
 * Limite de taxa simples em memória, por instância/processo. Suficiente
 * para conter abuso básico num MVP; num ambiente serverless com várias
 * instâncias, o limite vale por instância, não no total — ver README.
 */
const buckets = new Map<string, Bucket>();

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

export function isRateLimited(identifier: string, now: number = Date.now()): boolean {
  const bucket = buckets.get(identifier);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(identifier, { count: 1, windowStart: now });
    pruneExpiredBuckets(now);
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}
