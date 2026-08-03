import { ApiError } from "@/src/shared/api/api-error";

export function isRoomAccessDeniedError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.code === "room.access-denied"
  );
}

export function shouldKeepPasswordFormAfterSubmit(error: ApiError) {
  return (
    isRoomAccessDeniedError(error)
  );
}
