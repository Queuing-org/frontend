import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { follow } from "../follow/api/follow";
import { unfollow } from "../unfollow/api/unfollow";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { delete: vi.fn(), put: vi.fn() },
}));

describe("user-profiles 관계 mutation 계약", () => {
  beforeEach(() => vi.clearAllMocks());

  it("팔로우와 언팔로우는 같은 resource에 PUT/DELETE하고 204를 파싱하지 않는다", async () => {
    await expect(follow({ targetSlug: "user/a" })).resolves.toBeUndefined();
    await expect(unfollow({ targetSlug: "user/a" })).resolves.toBeUndefined();
    const path = "/api/v1/user-profiles/me/following/user%2Fa";
    expect(axiosInstance.put).toHaveBeenCalledWith(path);
    expect(axiosInstance.delete).toHaveBeenCalledWith(path);
  });
});
