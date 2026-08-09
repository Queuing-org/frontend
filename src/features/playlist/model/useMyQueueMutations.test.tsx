import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteMyQueueEntry } from "../api/deleteMyQueueEntry";
import { moveMyQueueEntry } from "../api/moveMyQueueEntry";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";
import {
  QUERY_INVALIDATION_COALESCE_MS,
  scheduleQueryInvalidation,
} from "@/src/shared/api/query/scheduleQueryInvalidation";
import { playlistKeys } from "./queryKeys";
import { useDeleteMyQueueEntry } from "./useDeleteMyQueueEntry";
import { useMoveMyQueueEntry } from "./useMoveMyQueueEntry";

vi.mock("../api/deleteMyQueueEntry", () => ({
  deleteMyQueueEntry: vi.fn(),
}));
vi.mock("../api/moveMyQueueEntry", () => ({
  moveMyQueueEntry: vi.fn(),
}));

const ROOM_SLUG = "sample-room";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

function scheduleQueueRealtimeRefresh(queryClient: QueryClient) {
  scheduleQueryInvalidation({
    queryClient,
    queryKeys: [
      playlistKeys.roomQueuePrefix(ROOM_SLUG),
      playlistKeys.roomPlaybackPrefix(ROOM_SLUG),
    ],
    scopeKey: getRoomReadInvalidationScope(ROOM_SLUG),
  });
}

async function expectCoalescedQueueRefresh(queryClient: QueryClient) {
  expect(queryClient.resetQueries).not.toHaveBeenCalled();
  expect(queryClient.invalidateQueries).not.toHaveBeenCalled();

  scheduleQueueRealtimeRefresh(queryClient);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);
  });

  expect(queryClient.resetQueries).toHaveBeenCalledTimes(1);
  expect(queryClient.resetQueries).toHaveBeenCalledWith({
    queryKey: playlistKeys.roomQueuePrefix(ROOM_SLUG),
  });
  expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: playlistKeys.roomPlaybackPrefix(ROOM_SLUG),
  });
}

describe("my queue mutations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("내 큐 삭제 성공과 QUEUE_REMOVED refresh를 room-read scope에서 합친다", async () => {
    const queryClient = createQueryClient();
    vi.spyOn(queryClient, "resetQueries");
    vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(deleteMyQueueEntry).mockResolvedValue(true);
    const { result } = renderHook(() => useDeleteMyQueueEntry(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        entryId: "entry-1",
        slug: ROOM_SLUG,
      });
    });

    await expectCoalescedQueueRefresh(queryClient);
  });

  it("내 큐 이동 성공과 QUEUE_REORDERED refresh를 room-read scope에서 합친다", async () => {
    const queryClient = createQueryClient();
    vi.spyOn(queryClient, "resetQueries");
    vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(moveMyQueueEntry).mockResolvedValue(true);
    const { result } = renderHook(() => useMoveMyQueueEntry(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        beforeEntryId: "entry-2",
        movedEntryId: "entry-1",
        orderedPendingEntryIds: ["entry-1", "entry-2"],
        slug: ROOM_SLUG,
      });
    });

    await expectCoalescedQueueRefresh(queryClient);
  });
});
