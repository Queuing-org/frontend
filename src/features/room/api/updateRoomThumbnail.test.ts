import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { updateRoomThumbnail } from "./updateRoomThumbnail";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { put: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it("정규화한 방 slug와 임시 업로드 token으로 썸네일을 교체한다", async () => {
  vi.mocked(axiosInstance.put).mockResolvedValue({ data: { result: true } });

  await expect(
    updateRoomThumbnail({
      slug: " room/one ",
      thumbnailUploadToken: " rtu_test ",
    }),
  ).resolves.toEqual({ success: true });

  expect(axiosInstance.put).toHaveBeenCalledWith(
    "/api/v2/rooms/room%2Fone/thumbnail",
    { thumbnailUploadToken: "rtu_test" },
  );
});

it("빈 임시 업로드 token은 요청 전에 거부한다", async () => {
  await expect(
    updateRoomThumbnail({
      slug: "room-one",
      thumbnailUploadToken: "   ",
    }),
  ).rejects.toEqual(
    new ApiError({
      message: "썸네일 업로드 token이 필요합니다.",
      status: 400,
    }),
  );
  expect(axiosInstance.put).not.toHaveBeenCalled();
});

it("result false는 성공으로 처리하지 않는다", async () => {
  vi.mocked(axiosInstance.put).mockResolvedValue({ data: { result: false } });

  await expect(
    updateRoomThumbnail({
      slug: "room-one",
      thumbnailUploadToken: "rtu_test",
    }),
  ).rejects.toThrow("방 썸네일을 교체하지 못했습니다.");
});
