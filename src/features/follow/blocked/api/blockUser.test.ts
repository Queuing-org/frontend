import { expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { blockUser } from "./blockUser";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { put: vi.fn() },
}));

it("인코딩한 사용자 slug의 차단 API를 호출한다", async () => {
  vi.mocked(axiosInstance.put).mockResolvedValue({ status: 204 });

  await blockUser("target/user");

  expect(axiosInstance.put).toHaveBeenCalledWith(
    "/api/v1/user-profiles/me/blocked-users/target%2Fuser",
  );
});
