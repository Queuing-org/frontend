import { expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { reportChatMessage } from "./reportChatMessage";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { post: vi.fn() },
}));

it("방과 메시지 식별자를 인코딩해 신고 사유와 비밀번호 헤더를 전송한다", async () => {
  vi.mocked(axiosInstance.post).mockResolvedValue({ data: { result: true } });

  await reportChatMessage({
    messageKey: "message/key",
    password: "secret",
    reason: "욕설 및 비방",
    slug: "room/slug",
  });

  expect(axiosInstance.post).toHaveBeenCalledWith(
    "/api/v1/rooms/room%2Fslug/chat-messages/message%2Fkey/reports",
    { reason: "욕설 및 비방" },
    { headers: { "X-Room-Password": "secret" } },
  );
});
