import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { deleteRoomThumbnail } from "@/src/features/room/api/deleteRoomThumbnail";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import {
  createTestQueryClient,
  createTestQueryClientWrapper,
} from "@/src/shared/test/queryClient";
import { useDeleteRoomThumbnail } from "./useDeleteRoomThumbnail";

vi.mock("@/src/features/room/api/deleteRoomThumbnail", () => ({
  deleteRoomThumbnail: vi.fn(),
}));

it("삭제 성공 시 방 목록과 정규화한 상세 cache를 무효화한다", async () => {
  vi.mocked(deleteRoomThumbnail).mockResolvedValue({ success: true });
  const queryClient = createTestQueryClient();
  const invalidateQueries = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue();
  const { result } = renderHook(() => useDeleteRoomThumbnail(), {
    wrapper: createTestQueryClientWrapper(queryClient),
  });

  await act(async () => {
    await result.current.mutateAsync({ slug: " room-one " });
  });

  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: roomKeys.all() });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: roomKeys.meta("room-one"),
  });
});
