import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRoomOwnerSuccessionFeedback } from "./useRoomOwnerSuccessionFeedback";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));

describe("useRoomOwnerSuccessionFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("최초 입장 시 이미 방장이어도 알림을 표시하지 않는다", () => {
    renderHook(() =>
      useRoomOwnerSuccessionFeedback({
        currentUserSlug: "me",
        isCurrentUserLoading: false,
        ownerSlug: "me",
        roomSlug: "room",
        roomTitle: "테스트 방",
      }),
    );

    expect(notify).not.toHaveBeenCalled();
  });

  it("실제 owner.slug가 현재 사용자로 바뀔 때 한 번만 알린다", () => {
    const { rerender } = renderHook(
      ({ ownerSlug, roomTitle }) =>
        useRoomOwnerSuccessionFeedback({
          currentUserSlug: "me",
          isCurrentUserLoading: false,
          ownerSlug,
          roomSlug: "room",
          roomTitle,
        }),
      { initialProps: { ownerSlug: "other", roomTitle: "테스트 방" } },
    );

    rerender({ ownerSlug: "me", roomTitle: "테스트 방" });
    rerender({ ownerSlug: "me", roomTitle: "바뀐 제목" });

    expect(notify).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "room-owner-received:room",
      message: "'테스트 방' 방의 방장 권한을 이어받았습니다!",
      tone: "default",
    });
  });

  it("비로그인 상태에서 owner가 비어도 승계로 오인하지 않는다", () => {
    const { rerender } = renderHook(
      ({ ownerSlug }: { ownerSlug: string | null }) =>
        useRoomOwnerSuccessionFeedback({
          currentUserSlug: null,
          isCurrentUserLoading: false,
          ownerSlug,
          roomSlug: "room",
          roomTitle: "테스트 방",
        }),
      { initialProps: { ownerSlug: "other" } },
    );

    rerender({ ownerSlug: null });

    expect(notify).not.toHaveBeenCalled();
  });

  it("owner 전환 중 사용자 조회가 늦어도 조회 완료 후 한 번 알린다", () => {
    const { rerender } = renderHook(
      ({ currentUserSlug, isCurrentUserLoading, ownerSlug }) =>
        useRoomOwnerSuccessionFeedback({
          currentUserSlug,
          isCurrentUserLoading,
          ownerSlug,
          roomSlug: "room",
          roomTitle: "테스트 방",
        }),
      {
        initialProps: {
          currentUserSlug: null as string | null,
          isCurrentUserLoading: true,
          ownerSlug: "other",
        },
      },
    );

    rerender({
      currentUserSlug: null,
      isCurrentUserLoading: true,
      ownerSlug: "me",
    });
    expect(notify).not.toHaveBeenCalled();

    rerender({
      currentUserSlug: "me",
      isCurrentUserLoading: false,
      ownerSlug: "me",
    });

    expect(notify).toHaveBeenCalledOnce();
  });
});
