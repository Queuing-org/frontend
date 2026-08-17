import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { fetchRoomQueuePage } from "../api/fetchRoomQueue";
import { useMyRoomQueue } from "./useMyRoomQueue";

vi.mock("../api/fetchRoomQueue", () => ({
  fetchRoomQueuePage: vi.fn(),
  getNextRoomQueuePageParam: (lastPage: {
    hasNext: boolean;
    nextCursor: string | null;
  }) =>
    lastPage.hasNext && lastPage.nextCursor
      ? lastPage.nextCursor
      : undefined,
  QUEUE_CONFLICT_CODE: "room.queue-update-conflict",
}));

const page = (entryId: string, hasNext: boolean, revision: number) => ({
  items: [
    {
      order: 1,
      track: {
        title: entryId,
        videoId: entryId,
        provider: "YOUTUBE" as const,
        durationMs: 1,
        thumbnailUrl: null,
      },
      status: {
        skipped: false,
        isActive: false,
        isPlayed: false,
        ownerOrdered: false,
      },
      addedBy: { slug: "me", nickname: "나", avatarUrl: null },
      entryId,
      createdAtMs: 1,
      updatedAtMs: 1,
    },
  ],
  hasNext,
  nextCursor: hasNext ? entryId : null,
  queueRevision: revision,
  totalPendingCount: hasNext ? 2 : 1,
});

describe("useMyRoomQueue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("다음 구간 충돌 시 기존 페이지를 비우고 첫 구간부터 다시 조회한다", async () => {
    vi.mocked(fetchRoomQueuePage)
      .mockResolvedValueOnce(page("old", true, 10))
      .mockRejectedValueOnce(
        new ApiError({
          status: 409,
          code: "room.queue-update-conflict",
          message: "conflict",
        }),
      )
      .mockResolvedValueOnce(page("new", false, 11));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useMyRoomQueue("room", "secret"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      await result.current.fetchNextQueuePage();
    });

    await waitFor(() =>
      expect(result.current.data?.pages[0]?.items[0]?.entryId).toBe("new"),
    );
    expect(fetchRoomQueuePage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ cursor: null }),
    );
    expect(fetchRoomQueuePage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: "old" }),
    );
    expect(fetchRoomQueuePage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ cursor: null }),
    );
    expect(result.current.data?.pages).toHaveLength(1);
  });
});
