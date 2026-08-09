import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { transferRoomOwner } from "../api/transferRoomOwner";
import { roomKeys } from "../model/queryKeys";
import { useTransferRoomOwner } from "./useTransferRoomOwner";

vi.mock("../api/transferRoomOwner", () => ({
  transferRoomOwner: vi.fn(),
}));

describe("useTransferRoomOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("위임 성공 후 정규화한 방 메타를 무효화한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(transferRoomOwner).mockResolvedValue(true);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useTransferRoomOwner(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        slug: " room/sample ",
        userSlug: "new-owner",
      });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: roomKeys.meta("room/sample"),
    });
  });
});
