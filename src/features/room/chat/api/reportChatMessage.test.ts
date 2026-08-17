import { expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { reportChatMessage } from "./reportChatMessage";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { post: vi.fn() },
}));

it("방과 메시지 식별자를 인코딩해 신고 사유와 접근 토큰을 전송한다", async () => {
  vi.mocked(axiosInstance.post).mockResolvedValue({ data: { result: true } });

  await reportChatMessage({
    messageKey: "message/key",
    accessToken: "secret",
    reason: "욕설 및 비방",
    slug: "room/slug",
  });

  expect(axiosInstance.post).toHaveBeenCalledWith(
    "/api/v1/rooms/room%2Fslug/chat-messages/message%2Fkey/reports",
    { reason: "욕설 및 비방" },
    { headers: { "X-Room-Access-Token": "secret" } },
  );
});
