import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMyRoomQueue } from "@/src/features/playlist/model/useMyRoomQueue";
import { useRoomQueue } from "@/src/features/playlist/model/useRoomQueue";
import { useRoomQueuePanel } from "./useRoomQueuePanel";

vi.mock("@/src/features/playlist/model/useRoomQueue", () => ({
  useRoomQueue: vi.fn(),
}));
vi.mock("@/src/features/playlist/model/useMyRoomQueue", () => ({
  useMyRoomQueue: vi.fn(),
}));
vi.mock("@/src/features/playlist/model/useMoveMyQueueEntry", () => ({
  useMoveMyQueueEntry: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock("@/src/features/playlist/model/useMoveRoomQueueEntry", () => ({
  useMoveRoomQueueEntry: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock("@/src/features/playlist/model/useDeleteMyQueueEntry", () => ({
  useDeleteMyQueueEntry: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock("@/src/features/playlist/model/useDeleteRoomQueueEntries", () => ({
  useDeleteRoomQueueEntries: () => ({ isPending: false, mutate: vi.fn() }),
}));

describe("useRoomQueuePanel query visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRoomQueue).mockReturnValue({
      data: {
        pages: [
          {
            hasNext: false,
            items: [],
            nextCursor: null,
            queueRevision: 1,
            totalPendingCount: 0,
          },
        ],
      },
      error: null,
      fetchNextQueuePage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isRefetching: false,
    } as unknown as ReturnType<typeof useRoomQueue>);
    vi.mocked(useMyRoomQueue).mockReturnValue({
      data: undefined,
      error: null,
      fetchNextQueuePage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isRefetching: false,
    } as unknown as ReturnType<typeof useMyRoomQueue>);
  });

  it("전체 탭에서는 내 큐를 요청하지 않고 mine 탭 진입 때 활성화한다", () => {
    const { result } = renderHook(() =>
      useRoomQueuePanel({
        currentUser: {
          nickname: "사용자",
          profileImageUrl: null,
          slug: "user",
          userId: 1,
        },
        isCurrentUserLoading: false,
        roomMeta: null,
        roomSlug: "room",
      }),
    );

    expect(useMyRoomQueue).toHaveBeenLastCalledWith("room", undefined, false);

    act(() => result.current.setActiveTab("mine"));

    expect(useMyRoomQueue).toHaveBeenLastCalledWith("room", undefined, true);
  });
});
