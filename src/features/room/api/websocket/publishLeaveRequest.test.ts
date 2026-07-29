import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { publishLeaveRequest } from "./publishLeaveRequest";

vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  getSocketClient: vi.fn(),
}));

describe("publishLeaveRequest", () => {
  const publish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSocketClient).mockReturnValue({
      connected: true,
      publish,
    } as never);
  });

  it("정규화한 방 slug의 leave destination으로 빈 frame을 보낸다", () => {
    expect(publishLeaveRequest(" room ")).toBe(true);
    expect(publish).toHaveBeenCalledWith({
      destination: "/app/room/room/leave",
      body: "",
    });
  });

  it("socket이 끊어진 상태에서는 publish하지 않는다", () => {
    vi.mocked(getSocketClient).mockReturnValue({
      connected: false,
      publish,
    } as never);

    expect(publishLeaveRequest("room")).toBe(false);
    expect(publish).not.toHaveBeenCalled();
  });
});
