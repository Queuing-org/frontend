import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoomParticipantsPage } from "../api/fetchRoomParticipants";
import { useRoomParticipants } from "./useRoomParticipants";

vi.mock("../api/fetchRoomParticipants", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../api/fetchRoomParticipants")
    >();

  return { ...actual, fetchRoomParticipantsPage: vi.fn() };
});

describe("useRoomParticipants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("첫 render는 hasNext여도 첫 page 한 번만 요청하고 명시적 load-more에서만 cursor를 보낸다", async () => {
    vi.mocked(fetchRoomParticipantsPage)
      .mockResolvedValueOnce({
        hasNext: true,
        items: [],
        nextCursor: "cursor-1",
      })
      .mockResolvedValueOnce({
        hasNext: false,
        items: [],
        nextCursor: null,
      });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    const { result } = renderHook(
      () => useRoomParticipants("room", "secret", true),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchRoomParticipantsPage).toHaveBeenCalledTimes(1);
    expect(fetchRoomParticipantsPage).toHaveBeenNthCalledWith(1, {
      cursor: undefined,
      accessToken: "secret",
      signal: expect.any(AbortSignal),
      slug: "room",
    });
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(fetchRoomParticipantsPage).toHaveBeenCalledTimes(2);
    expect(fetchRoomParticipantsPage).toHaveBeenNthCalledWith(2, {
      cursor: "cursor-1",
      accessToken: "secret",
      signal: expect.any(AbortSignal),
      slug: "room",
    });
  });

  it("서버가 같은 nextCursor page를 append해도 더 이상 cursor GET을 반복하지 않는다", async () => {
    vi.mocked(fetchRoomParticipantsPage)
      .mockResolvedValueOnce({
        hasNext: true,
        items: [],
        nextCursor: "repeated-cursor",
      })
      .mockResolvedValueOnce({
        hasNext: true,
        items: [],
        nextCursor: "repeated-cursor",
      });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    const { result } = renderHook(
      () => useRoomParticipants("room", "secret", true),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const nextPageResult = await act(() =>
      result.current.fetchNextPage(),
    );

    expect(fetchRoomParticipantsPage).toHaveBeenCalledTimes(2);
    expect(nextPageResult.data?.pages).toHaveLength(2);
    expect(nextPageResult.hasNextPage).toBe(false);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(fetchRoomParticipantsPage).toHaveBeenCalledTimes(2);
  });
});
