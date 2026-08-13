import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteMyQueueEntry } from "../api/deleteMyQueueEntry";
import { moveMyQueueEntry } from "../api/moveMyQueueEntry";
import { moveRoomQueueEntry } from "../api/moveRoomQueueEntry";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";
import {
  QUERY_INVALIDATION_COALESCE_MS,
  scheduleQueryInvalidation,
} from "@/src/shared/api/query/scheduleQueryInvalidation";
import { playlistKeys } from "./queryKeys";
import type { RoomQueueData } from "./queueOrderOptimistic";
import type { PlaylistEntry } from "./types";
import { useDeleteMyQueueEntry } from "./useDeleteMyQueueEntry";
import { useMoveMyQueueEntry } from "./useMoveMyQueueEntry";
import { useMoveRoomQueueEntry } from "./useMoveRoomQueueEntry";

vi.mock("../api/deleteMyQueueEntry", () => ({
  deleteMyQueueEntry: vi.fn(),
}));
vi.mock("../api/moveMyQueueEntry", () => ({
  moveMyQueueEntry: vi.fn(),
}));
vi.mock("../api/moveRoomQueueEntry", () => ({
  moveRoomQueueEntry: vi.fn(),
}));

const ROOM_SLUG = "sample-room";

function queueEntry(entryId: string): PlaylistEntry {
  return {
    addedBy: { avatarUrl: null, nickname: "나", slug: "me" },
    createdAtMs: 1,
    entryId,
    order: 1,
    status: {
      isActive: false,
      isPlayed: false,
      ownerOrderLocked: false,
      skipped: false,
    },
    track: {
      durationMs: 1,
      provider: "YOUTUBE",
      thumbnailUrl: null,
      title: entryId,
      videoId: entryId,
    },
    updatedAtMs: 1,
  };
}

function queueData(entryIds: string[]): RoomQueueData {
  return {
    pageParams: [null],
    pages: [
      {
        hasNext: false,
        items: entryIds.map(queueEntry),
        nextCursor: null,
        queueRevision: 1,
        totalPendingCount: entryIds.length,
      },
    ],
  };
}

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

    let movePromise: Promise<boolean> | null = null;
    act(() => {
      movePromise = result.current.mutateAsync({
        beforeEntryId: "entry-2",
        movedEntryId: "entry-1",
        orderedPendingEntryIds: ["entry-1", "entry-2"],
        slug: ROOM_SLUG,
      });
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(queryClient.resetQueries).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();

    scheduleQueueRealtimeRefresh(queryClient);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);
      await movePromise;
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(queryClient.resetQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.resetQueries).toHaveBeenCalledWith({
      queryKey: playlistKeys.roomQueuePrefix(ROOM_SLUG),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: playlistKeys.roomPlaybackPrefix(ROOM_SLUG),
    });
  });

  it("전체 큐 이동도 authoritative refresh가 끝날 때까지 pending을 유지한다", async () => {
    const queryClient = createQueryClient();
    vi.spyOn(queryClient, "resetQueries");
    vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(moveRoomQueueEntry).mockResolvedValue(true);
    const { result } = renderHook(() => useMoveRoomQueueEntry(), {
      wrapper: createWrapper(queryClient),
    });
    let movePromise: Promise<boolean> | null = null;

    act(() => {
      movePromise = result.current.mutateAsync({
        beforeEntryId: "entry-2",
        movedEntryId: "entry-1",
        orderedPendingEntryIds: ["entry-1", "entry-2"],
        slug: ROOM_SLUG,
      });
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.isPending).toBe(true);
    expect(queryClient.resetQueries).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);
      await movePromise;
      await vi.runOnlyPendingTimersAsync();
      await Promise.resolve();
    });

    expect(result.current.isPending).toBe(false);
    expect(queryClient.resetQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it("이동 실패 시 snapshot을 복구하고 authoritative reset까지 pending을 유지한다", async () => {
    const queryClient = createQueryClient();
    const queryKey = playlistKeys.roomQueue(ROOM_SLUG);
    queryClient.setQueryData(queryKey, queueData(["entry-1", "entry-2"]));
    vi.spyOn(queryClient, "resetQueries").mockResolvedValue();
    vi.mocked(moveRoomQueueEntry).mockRejectedValue(new Error("이동 실패"));
    const { result } = renderHook(() => useMoveRoomQueueEntry(), {
      wrapper: createWrapper(queryClient),
    });
    let movePromise: Promise<boolean> | null = null;

    act(() => {
      movePromise = result.current.mutateAsync({
        beforeEntryId: "entry-1",
        movedEntryId: "entry-2",
        orderedPendingEntryIds: ["entry-2", "entry-1"],
        slug: ROOM_SLUG,
      });
      void movePromise.catch(() => undefined);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.isPending).toBe(true);
    expect(
      queryClient
        .getQueryData<RoomQueueData>(queryKey)
        ?.pages[0]?.items.map((item) => item.entryId),
    ).toEqual(["entry-1", "entry-2"]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);
      await expect(movePromise).rejects.toThrow("이동 실패");
      await vi.runOnlyPendingTimersAsync();
      await Promise.resolve();
    });

    expect(result.current.isPending).toBe(false);
    expect(queryClient.resetQueries).toHaveBeenCalledWith({
      queryKey: playlistKeys.roomQueuePrefix(ROOM_SLUG),
    });
  });
});
