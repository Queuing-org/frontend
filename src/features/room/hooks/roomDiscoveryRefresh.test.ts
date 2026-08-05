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

describe("방 탐색 화면 자동 갱신", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("랜덤 infinite 목록 전체에는 주기 재조회를 걸지 않는다", () => {
    useRoomsQuery();

    const options = useInfiniteQuery.mock.calls[0]?.[0];
    expect(options).not.toHaveProperty("refetchInterval");
  });

  it("선택된 방 메타도 10초마다 다시 조회한다", () => {
    useRoomMetaQuery("sample-room");

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        refetchInterval: 10_000,
      }),
    );
  });
});
