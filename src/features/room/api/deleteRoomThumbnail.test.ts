import { beforeEach, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { deleteRoomThumbnail } from "./deleteRoomThumbnail";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { delete: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it("정규화한 방 slug의 썸네일을 삭제한다", async () => {
  vi.mocked(axiosInstance.delete).mockResolvedValue({
    data: { result: true },
  });

  await expect(
    deleteRoomThumbnail({ slug: " room/one " }),
  ).resolves.toEqual({ success: true });
  expect(axiosInstance.delete).toHaveBeenCalledWith(
    "/api/v2/rooms/room%2Fone/thumbnail",
  );
});

it("result false는 삭제 성공으로 처리하지 않는다", async () => {
  vi.mocked(axiosInstance.delete).mockResolvedValue({
    data: { result: false },
  });

  await expect(
    deleteRoomThumbnail({ slug: "room-one" }),
  ).rejects.toThrow("방 썸네일을 삭제하지 못했습니다.");
});
