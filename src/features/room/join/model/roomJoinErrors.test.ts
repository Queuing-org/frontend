import { describe, expect, it } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import {
  getAlreadyParticipatingRoom,
  isRoomAccessDeniedError,
  shouldKeepPasswordFormAfterSubmit,
} from "./roomJoinErrors";
import { RoomJoinError } from "@/src/features/room/api/joinRoom";

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

it("already-participating 전용 오류의 유효한 기존 방 정보만 반환한다", () => {
  expect(
    getAlreadyParticipatingRoom(
      new RoomJoinError({
        status: 409,
        code: "room.already-participating",
        message: "이미 참여 중입니다.",
        data: { slug: " current-room ", title: " 현재 방 " },
      }),
    ),
  ).toEqual({ slug: "current-room", title: "현재 방" });
  expect(
    getAlreadyParticipatingRoom(
      new RoomJoinError({
        status: 409,
        code: "room.already-participating",
        message: "잘못된 응답",
        data: { slug: "current-room" },
      }),
    ),
  ).toBeNull();
  expect(
    getAlreadyParticipatingRoom(
      new ApiError({
        status: 409,
        code: "room.already-participating",
        message: "타입 없는 오류",
      }),
    ),
  ).toBeNull();
});
