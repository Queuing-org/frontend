import { ApiError } from "./api-error";

const MAX_TRANSIENT_QUERY_RETRIES = 3;

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= MAX_TRANSIENT_QUERY_RETRIES) {
    return false;
  }

  if (
    error instanceof ApiError &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false;
  }

  return true;
}
