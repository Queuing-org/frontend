import { ApiError } from "@/src/shared/api/api-error";

export function isPasswordRequiredError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === "room.password-required" ||
      error.code === "room.invalid-password" ||
      error.code === "room.password-invalid" ||
      error.message.includes("비밀번호"))
  );
}

export function shouldKeepPasswordFormAfterSubmit(error: ApiError) {
  return (
    isPasswordRequiredError(error) ||
    error.status === 400 ||
    error.status === 403
  );
}
