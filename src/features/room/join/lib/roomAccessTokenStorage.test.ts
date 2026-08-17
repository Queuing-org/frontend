import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredRoomAccessToken,
  readStoredRoomAccessToken,
  writeStoredRoomAccessToken,
} from "./roomAccessTokenStorage";

describe("room access token storage", () => {
  beforeEach(() => sessionStorage.clear());

  it("방별 sessionStorage key로 토큰을 저장하고 기존 비밀번호를 제거한다", () => {
    sessionStorage.setItem("room-password:room", "old-password");

    writeStoredRoomAccessToken(" room ", " access-token ");

    expect(readStoredRoomAccessToken("room")).toBe("access-token");
    expect(sessionStorage.getItem("room-password:room")).toBeNull();
    expect(sessionStorage.getItem("room-access-token:room")).toBe(
      "access-token",
    );
  });

  it("명시적 정리는 토큰과 legacy 비밀번호를 함께 제거한다", () => {
    sessionStorage.setItem("room-access-token:room", "access-token");
    sessionStorage.setItem("room-password:room", "old-password");

    clearStoredRoomAccessToken("room");

    expect(readStoredRoomAccessToken("room")).toBeNull();
    expect(sessionStorage.getItem("room-password:room")).toBeNull();
  });

  it("기존 탭의 평문 비밀번호는 토큰 조회 시에도 제거한다", () => {
    sessionStorage.setItem("room-password:room", "old-password");

    expect(readStoredRoomAccessToken(" room ")).toBeNull();
    expect(sessionStorage.getItem("room-password:room")).toBeNull();
  });
});
