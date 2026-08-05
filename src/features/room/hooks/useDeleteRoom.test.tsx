import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteRoom } from "../api/deleteRoom";
import { roomKeys } from "../model/queryKeys";
import { useDeleteRoom } from "./useDeleteRoom";

vi.mock("../api/deleteRoom", () => ({
  deleteRoom: vi.fn(),
}));

describe("useDeleteRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("삭제한 방 메타를 제거하고 방 목록을 무효화한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const removeQueries = vi.spyOn(queryClient, "removeQueries");
    vi.mocked(deleteRoom).mockResolvedValue(true);

    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteRoom(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("sample%2Froom");
    });

    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: roomKeys.meta("sample/room"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: roomKeys.all(),
    });
  });
});
