import { expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { blockUser } from "./blockUser";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { put: vi.fn() },
}));

it("인코딩한 사용자 slug의 차단 API를 호출한다", async () => {
  vi.mocked(axiosInstance.put).mockResolvedValue({ status: 204 });

  await blockUser({ targetSlug: "target/user" });

  expect(axiosInstance.put).toHaveBeenCalledWith(
    "/api/v1/user-profiles/me/blocked-users/target%2Fuser",
    undefined,
  );
});

it("차단 사유는 trim해서 보내고 빈 값은 body를 생략한다", async () => {
  vi.mocked(axiosInstance.put).mockResolvedValue({ status: 204 });

  await blockUser({ targetSlug: "target", reason: "  반복 메시지  " });
  expect(axiosInstance.put).toHaveBeenLastCalledWith(
    "/api/v1/user-profiles/me/blocked-users/target",
    { reason: "반복 메시지" },
  );

  await blockUser({ targetSlug: "target", reason: "   " });
  expect(axiosInstance.put).toHaveBeenLastCalledWith(
    "/api/v1/user-profiles/me/blocked-users/target",
    undefined,
  );
});
