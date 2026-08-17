import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMyRoomQueue } from "@/src/features/playlist/model/useMyRoomQueue";
import { useRoomQueue } from "@/src/features/playlist/model/useRoomQueue";
import { ApiError } from "@/src/shared/api/api-error";
import { useRoomQueuePanel } from "./useRoomQueuePanel";

const mocks = vi.hoisted(() => ({
  deleteMine: vi.fn(),
  deleteRoom: vi.fn(),
  moveMine: vi.fn(),
  moveRoom: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/src/features/playlist/model/useRoomQueue", () => ({
  useRoomQueue: vi.fn(),
}));
vi.mock("@/src/features/playlist/model/useMyRoomQueue", () => ({
  useMyRoomQueue: vi.fn(),
}));
vi.mock("@/src/features/playlist/model/useMoveMyQueueEntry", () => ({
  useMoveMyQueueEntry: () => ({ isPending: false, mutateAsync: mocks.moveMine }),
}));
vi.mock("@/src/features/playlist/model/useMoveRoomQueueEntry", () => ({
  useMoveRoomQueueEntry: () => ({ isPending: false, mutateAsync: mocks.moveRoom }),
}));
vi.mock("@/src/features/playlist/model/useDeleteMyQueueEntry", () => ({
  useDeleteMyQueueEntry: () => ({ isPending: false, mutate: mocks.deleteMine }),
}));
vi.mock("@/src/features/playlist/model/useDeleteRoomQueueEntries", () => ({
  useDeleteRoomQueueEntries: () => ({ isPending: false, mutate: mocks.deleteRoom }),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify: mocks.notify }),
}));

const pendingEntry = {
  addedBy: { avatarUrl: null, nickname: "사용자", slug: "user" },
  createdAtMs: 1,
  entryId: "entry-1",
  order: 1,
  status: {
    isActive: false,
    isPlayed: false,
    ownerOrdered: false,
    skipped: false,
  },
  track: {
    durationMs: 1_000,
    provider: "YOUTUBE",
    thumbnailUrl: null,
    title: "곡",
    videoId: "video",
  },
  updatedAtMs: 1,
};

describe("useRoomQueuePanel query visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.moveMine.mockResolvedValue(undefined);
    mocks.moveRoom.mockResolvedValue(undefined);
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

  it("전체 탭에서도 로그인 사용자의 내 큐를 조회해 새로고침 count를 복원한다", () => {
    vi.mocked(useMyRoomQueue).mockReturnValue({
      data: {
        pages: [
          {
            hasNext: false,
            items: [pendingEntry],
            nextCursor: null,
            queueRevision: 1,
            totalPendingCount: 1,
          },
        ],
      },
      error: null,
      fetchNextQueuePage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isRefetching: false,
    } as unknown as ReturnType<typeof useMyRoomQueue>);
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

    expect(useMyRoomQueue).toHaveBeenLastCalledWith("room", undefined, true);
    expect(result.current.activeTab).toBe("all");
    expect(result.current.myPendingCount).toBe(1);
  });

  it("곡 삭제 성공은 알림 없이 목록 갱신 결과만 사용한다", () => {
    const { result } = renderHook(() =>
      useRoomQueuePanel({
        currentUser: null,
        isCurrentUserLoading: false,
        roomMeta: null,
        roomSlug: "room",
      }),
    );

    act(() => result.current.handleDeleteRoomEntry("entry-1"));
    const options = mocks.deleteRoom.mock.lastCall?.[1] as {
      onSuccess?: () => void;
    };
    act(() => options.onSuccess?.());

    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("곡 삭제 실패만 서버 문구의 빨간 알림으로 표시한다", () => {
    const { result } = renderHook(() =>
      useRoomQueuePanel({
        currentUser: null,
        isCurrentUserLoading: false,
        roomMeta: null,
        roomSlug: "room",
      }),
    );

    act(() => result.current.handleDeleteRoomEntry("entry-1"));
    const options = mocks.deleteRoom.mock.lastCall?.[1] as {
      onError: (error: Error) => void;
    };
    act(() => options.onError(new Error("삭제 실패")));

    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "queue-delete:room:entry-1",
      message: "삭제 실패",
      tone: "error",
    });
  });

  it("방장 순서 변경 성공은 조용히 끝나고 실패만 빨간 알림으로 표시한다", async () => {
    const { result } = renderHook(() =>
      useRoomQueuePanel({
        currentUser: null,
        isCurrentUserLoading: false,
        roomMeta: null,
        roomSlug: "room",
      }),
    );
    const payload = {
      beforeEntryId: null,
      movedEntryId: "entry-1",
      orderedPendingEntryIds: ["entry-1"],
    };

    await act(() => result.current.handleMoveRoomEntry(payload));
    expect(mocks.notify).not.toHaveBeenCalled();

    mocks.moveRoom.mockRejectedValueOnce(new Error("이동 실패"));
    await act(() => result.current.handleMoveRoomEntry(payload));
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "queue-move:room",
      message: "이동 실패",
      tone: "error",
    });
  });

  it("큐 충돌은 최신 순서 복구 안내로 정규화한다", async () => {
    mocks.moveRoom.mockRejectedValueOnce(
      new ApiError({
        code: "room.queue-update-conflict",
        message: "revision mismatch",
        status: 409,
      }),
    );
    const { result } = renderHook(() =>
      useRoomQueuePanel({
        currentUser: null,
        isCurrentUserLoading: false,
        roomMeta: null,
        roomSlug: "room",
      }),
    );

    await act(() =>
      result.current.handleMoveRoomEntry({
        beforeEntryId: null,
        movedEntryId: "entry-1",
        orderedPendingEntryIds: ["entry-1"],
      }),
    );

    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "queue-move:room",
      message: "큐가 변경되어 최신 순서로 다시 불러왔습니다.",
      tone: "default",
    });
  });

  it("ownerOrdered인 내 pending 곡도 전체 개인 순서로 이동한다", async () => {
    vi.mocked(useMyRoomQueue).mockReturnValue({
      data: {
        pages: [
          {
            hasNext: false,
            items: [
              {
                ...pendingEntry,
                status: { ...pendingEntry.status, ownerOrdered: true },
              },
              {
                ...pendingEntry,
                entryId: "entry-2",
                order: 2,
              },
            ],
            nextCursor: null,
            queueRevision: 1,
            totalPendingCount: 2,
          },
        ],
      },
      error: null,
      fetchNextQueuePage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isRefetching: false,
    } as unknown as ReturnType<typeof useMyRoomQueue>);
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

    act(() => result.current.setActiveTab("mine"));
    await act(() =>
      result.current.handleMoveMyEntry({
        beforeEntryId: "entry-2",
        movedEntryId: "entry-1",
        orderedPendingEntryIds: ["entry-1", "entry-2"],
      }),
    );

    expect(mocks.moveMine).toHaveBeenCalledWith({
      beforeEntryId: "entry-2",
      movedEntryId: "entry-1",
      orderedPendingEntryIds: ["entry-1", "entry-2"],
      password: undefined,
      slug: "room",
    });
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});
