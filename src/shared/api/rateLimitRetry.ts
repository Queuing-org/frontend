const RATE_LIMIT_BACKOFF_BASE_MS = 500;

export function parseRetryAfterMs(
  value: unknown,
  nowMs = Date.now(),
): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return undefined;
  }

  const seconds = Number(normalized);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1000);
  }

  const retryAtMs = Date.parse(normalized);
  if (!Number.isFinite(retryAtMs)) {
    return undefined;
  }

  return Math.max(0, retryAtMs - nowMs);
}

export function getRateLimitRetryDelayMs(
  retryAfterMs: number | undefined,
  retryCount: number,
) {
  const exponentialBackoffMs =
    RATE_LIMIT_BACKOFF_BASE_MS * 2 ** Math.max(0, retryCount);

  return Math.max(retryAfterMs ?? 0, exponentialBackoffMs);
}
