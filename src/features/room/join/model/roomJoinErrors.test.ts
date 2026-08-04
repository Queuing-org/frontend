import { describe, expect, it } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import {
  isRoomAccessDeniedError,
  shouldKeepPasswordFormAfterSubmit,
} from "./roomJoinErrors";

describe("roomJoinErrors", () => {
  it("room.access-denied만 비공개 방 접근 오류로 취급한다", () => {
    const accessDenied = new ApiError({
      status: 400,
      code: "room.access-denied",
      message: "방에 접근할 수 없어요. 방 주소 또는 비밀번호를 확인해 주세요.",
    });
    expect(isRoomAccessDeniedError(accessDenied)).toBe(true);
    expect(shouldKeepPasswordFormAfterSubmit(accessDenied)).toBe(true);
    expect(
      isRoomAccessDeniedError(
        new ApiError({
          status: 400,
          code: "room.password-required",
          message: "비밀번호가 필요합니다.",
        }),
      ),
    ).toBe(false);
  });
});
