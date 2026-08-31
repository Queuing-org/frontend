import { act, renderHook } from "@testing-library/react";
import type { InfiniteData } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoomQueueHistoryPage } from "../api/fetchRoomQueueHistory";
import type {
  RoomQueueHistoryEntry,
  RoomQueueHistoryPage,
} from "./types";
import {
  getChronologicalRoomQueueHistoryEntries,
  includesLatestRoomQueueHistoryPage,
  ROOM_QUEUE_HISTORY_MAX_PAGES,
  useRoomQueueHistory,
} from "./useRoomQueueHistory";

const mocks = vi.hoisted(() => ({
  resetQueries: vi.fn(),
  useInfiniteQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useInfiniteQuery: mocks.useInfiniteQuery,
    useQueryClient: () => ({ resetQueries: mocks.resetQueries }),
  };
});

vi.mock("../api/fetchRoomQueueHistory", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../api/fetchRoomQueueHistory")
  >();
  return { ...actual, fetchRoomQueueHistoryPage: vi.fn() };
});

function entry(id: number): RoomQueueHistoryEntry {
  return {
    id,
    title: `곡 ${id}`,
    entryId: `entry-${id}`,
    skipped: false,
    videoId: `video-${id}`,
    provider: "YOUTUBE",
    source: "USER_REQUESTED",
    endedAtMs: id,
    durationMs: 1_000,
    queuedAtMs: null,
    startedAtMs: null,
    thumbnailUrl: null,
    addedByUserSlug: null,
  };
}

function page(ids: number[]): RoomQueueHistoryPage {
  return { items: ids.map(entry), hasNext: true, nextCursor: ids.at(-1) ?? null };
}

describe("room queue history mapping", () => {
  it("5개 page를 합친 history window를 최대 500곡으로 유지한다", () => {
    const pages = Array.from({ length: 5 }, (_, pageIndex) =>
      page(
        Array.from(
          { length: 100 },
          (_, itemIndex) => 500 - (pageIndex * 100 + itemIndex),
        ),
      ),
    );

    expect(getChronologicalRoomQueueHistoryEntries(pages)).toHaveLength(500);
  });

  it("최신순 page/item을 시간순으로 바꾸고 중복 id는 최신 page 값을 유지한다", () => {
    const newestDuplicate = { ...entry(3), title: "최신 값" };
    const entries = getChronologicalRoomQueueHistoryEntries([
      { ...page([5, 4]), items: [entry(5), entry(4), newestDuplicate] },
      page([3, 2, 1]),
    ]);

    expect(entries.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5]);
    expect(entries.find(({ id }) => id === 3)?.title).toBe("최신 값");
  });

  it("initial page param이 밀려났는지 구분한다", () => {
    const latestData: InfiniteData<RoomQueueHistoryPage, number | null> = {
      pages: [page([5])],
      pageParams: [null],
    };
    const evictedData: InfiniteData<RoomQueueHistoryPage, number | null> = {
      pages: [page([4])],
      pageParams: [4],
    };

    expect(includesLatestRoomQueueHistoryPage(latestData)).toBe(true);
    expect(includesLatestRoomQueueHistoryPage(evictedData)).toBe(false);
  });
});

describe("useRoomQueueHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetQueries.mockResolvedValue(undefined);
    mocks.useInfiniteQuery.mockReturnValue({
      data: { pages: [page([2, 1])], pageParams: [null] },
      fetchNextPage: vi.fn(),
    });
  });

  it("token 없는 key, AbortSignal, 5 page sliding window를 설정한다", async () => {
    renderHook(() => useRoomQueueHistory("room", "secret"));
    const options = mocks.useInfiniteQuery.mock.calls[0]?.[0];
    const signal = new AbortController().signal;

    expect(options.queryKey).toEqual(["roomQueueHistory", "room"]);
    expect(options.queryKey).not.toContain("secret");
    expect(options.maxPages).toBe(ROOM_QUEUE_HISTORY_MAX_PAGES);
    expect(options.initialPageParam).toBeNull();
    await options.queryFn({ pageParam: 0, signal });
    expect(fetchRoomQueueHistoryPage).toHaveBeenCalledWith({
      slug: "room",
      accessToken: "secret",
      cursorId: 0,
      signal,
    });
  });

  it("최신 창 복귀는 해당 history query를 reset한다", async () => {
    const { result } = renderHook(() =>
      useRoomQueueHistory("room", "secret"),
    );

    await act(() => result.current.resetToLatestPage());

    expect(mocks.resetQueries).toHaveBeenCalledWith({
      queryKey: ["roomQueueHistory", "room"],
      exact: true,
    });
  });
});
