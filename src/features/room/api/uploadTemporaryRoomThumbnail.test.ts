import { expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { uploadTemporaryRoomThumbnail } from "./uploadTemporaryRoomThumbnail";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { post: vi.fn() },
}));

it("선택한 파일을 방 생성 전 임시 썸네일 API에 업로드한다", async () => {
  const file = new File(["thumbnail"], "cover.png", { type: "image/png" });
  const uploadResult = {
    uploadToken: "rtu_test",
    thumbnailUrl: "https://example.com/thumbnail.png",
    thumbnailUrls: null,
    contentType: "image/png",
    sizeBytes: 9,
    width: 100,
    height: 100,
    expiresAt: "2026-08-02T08:00:00Z",
  };
  vi.mocked(axiosInstance.post).mockResolvedValue({
    data: { result: uploadResult },
  });

  const result = await uploadTemporaryRoomThumbnail({ file });

  expect(axiosInstance.post).toHaveBeenCalledOnce();
  const [path, body] = vi.mocked(axiosInstance.post).mock.calls[0] ?? [];
  expect(path).toBe("/api/v2/rooms/thumbnail");
  expect(body).toBeInstanceOf(FormData);
  expect((body as FormData).get("file")).toBe(file);
  expect(result).toEqual(uploadResult);
});

it("성공 응답에 필수 메타데이터가 없으면 계약 오류로 처리한다", async () => {
  const file = new File(["thumbnail"], "cover.png", { type: "image/png" });
  vi.mocked(axiosInstance.post).mockResolvedValue({
    data: {
      result: {
        thumbnailUrl: "https://example.com/thumbnail.png",
      },
    },
  });

  await expect(uploadTemporaryRoomThumbnail({ file })).rejects.toEqual(
    new ApiError({
      message: "썸네일 업로드 응답이 올바르지 않습니다.",
      status: 500,
    }),
  );
});
