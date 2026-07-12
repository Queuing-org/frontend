import { expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { blockUser } from "./blockUser";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { post: vi.fn() },
}));

it("인코딩한 사용자 slug의 차단 API를 호출한다", async () => {
  vi.mocked(axiosInstance.post).mockResolvedValue({ data: { result: true } });

  await blockUser("target/user");

  expect(axiosInstance.post).toHaveBeenCalledWith(
    "/api/v1/user-profiles/target%2Fuser/blocks",
  );
});
