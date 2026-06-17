import { ApiError } from "./api-error";
import type { ApiResponse } from "./types";

export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  return response.result;
}

export function assertApiBooleanResult(
  result: boolean,
  message: string,
): boolean {
  if (!result) {
    throw new ApiError({
      message,
      status: 500,
    });
  }

  return result;
}
