import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoomMeta } from "../api/fetchRoomMeta";
import { roomMetaQueryOptions, useRoomMeta } from "./useRoomMeta";

vi.mock("../api/fetchRoomMeta", () => ({
  fetchRoomMeta: vi.fn(),
}));

describe("useRoomMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입장 전 fetchQuery 결과를 joined observer가 중복 조회하지 않고 재사용한다", async () => {
    const roomMeta = {
      slug: "room",
      title: "방",
      isPublic: true,
      hasPassword: false,
      activeUsersCount: 1,
      tags: [],
    };
    vi.mocked(fetchRoomMeta).mockResolvedValue(roomMeta);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    await queryClient.fetchQuery(roomMetaQueryOptions("room"));
    const { result } = renderHook(() => useRoomMeta("room"), { wrapper });

    expect(result.current.data).toEqual(roomMeta);
    expect(fetchRoomMeta).toHaveBeenCalledTimes(1);
    expect(fetchRoomMeta).toHaveBeenCalledWith(
      "room",
      expect.any(AbortSignal),
    );
  });
});
