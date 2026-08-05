import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRoomsQuery } from "./useFetchRooms";
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
        refetchOnMount: "always",
        refetchOnReconnect: "always",
        refetchOnWindowFocus: true,
        staleTime: 0,
      }),
    );
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
