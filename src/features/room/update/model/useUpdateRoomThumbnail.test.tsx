import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { expect, it, vi } from "vitest";
import { updateRoomThumbnail } from "@/src/features/room/api/updateRoomThumbnail";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import { useUpdateRoomThumbnail } from "./useUpdateRoomThumbnail";

vi.mock("@/src/features/room/api/updateRoomThumbnail", () => ({
  updateRoomThumbnail: vi.fn(),
}));

it("교체 성공 시 방 목록과 정규화한 상세 cache를 무효화한다", async () => {
  vi.mocked(updateRoomThumbnail).mockResolvedValue({ success: true });
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const invalidateQueries = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpdateRoomThumbnail(), { wrapper });

  await act(async () => {
    await result.current.mutateAsync({
      slug: " room-one ",
      thumbnailUploadToken: "rtu_test",
    });
  });

  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: roomKeys.all() });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: roomKeys.meta("room-one"),
  });
});
