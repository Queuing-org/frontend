import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InfiniteData } from "@tanstack/react-query";
import type { Room, RoomsResponse } from "../model/types";
import {
  getRoomsFromPages,
  ROOM_DISCOVERY_MAX_PAGES,
  ROOM_DISCOVERY_MAX_ROOMS,
  useRoomsQuery,
} from "./useFetchRooms";
import { useRoomMetaQuery } from "./useRoomMeta";

const { useInfiniteQuery, useQuery } = vi.hoisted(() => ({
  useInfiniteQuery: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery,
  useQuery,
  useSuspenseQuery: vi.fn(),
}));

describe("방 탐색 화면 캐시 재검증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("방 목록은 polling 없이 화면 복귀와 재연결 때만 다시 조회한다", () => {
    useRoomsQuery();

    const options = useInfiniteQuery.mock.calls[0]?.[0];
    expect(options).not.toHaveProperty("refetchInterval");
    expect(options).toEqual(
      expect.objectContaining({
        maxPages: ROOM_DISCOVERY_MAX_PAGES,
        refetchOnMount: "always",
        refetchOnReconnect: "always",
        refetchOnWindowFocus: true,
        staleTime: 0,
      }),
    );
  });

  it("검색·모바일 목록과 infinite cache가 세 페이지를 넘지 않는다", () => {
    const pages = Array.from({ length: 4 }, (_, pageIndex) => ({
      hasNext: pageIndex < 3,
      nextCursorLastId: null,
      nextCursorLastCreatedAt: null,
      nextCursorLastParticipantCount: null,
      nextCursorLastRandomRank: null,
      nextCursorSeed: null,
      rooms: Array.from({ length: 30 }, (_, roomIndex) => {
        const id = pageIndex * 30 + roomIndex + 1;
        return { id, slug: `room-${id}` } as Room;
      }),
    })) satisfies RoomsResponse[];
    const data = {
      pageParams: [undefined, 1, 2, 3],
      pages,
    } as InfiniteData<RoomsResponse>;

    const rooms = getRoomsFromPages(data);

    expect(rooms).toHaveLength(ROOM_DISCOVERY_MAX_ROOMS);
    expect(rooms[0]?.id).toBe(31);
    expect(rooms.at(-1)?.id).toBe(120);
  });

  it("서버가 이미 요청한 방 cursor를 반복하면 자동 near-end pagination을 중단한다", () => {
    useRoomsQuery();
    const options = useInfiniteQuery.mock.calls[0]?.[0];
    const repeatedCursor = { cursorLastId: 30, cursorSeed: 123 };
    const lastPage = {
      hasNext: true,
      nextCursorLastId: 30,
      nextCursorSeed: 123,
      rooms: [],
    } satisfies RoomsResponse;

    expect(
      options.getNextPageParam(
        lastPage,
        [lastPage],
        repeatedCursor,
        [undefined, repeatedCursor],
      ),
    ).toBeUndefined();
  });

  it("선택된 방 메타도 polling 없이 화면 복귀와 재연결 때 다시 조회한다", () => {
    useRoomMetaQuery("sample-room");

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        refetchOnMount: "always",
        refetchOnReconnect: "always",
        refetchOnWindowFocus: true,
        staleTime: 0,
      }),
    );
    expect(useQuery.mock.calls[0]?.[0]).not.toHaveProperty("refetchInterval");
  });
});
