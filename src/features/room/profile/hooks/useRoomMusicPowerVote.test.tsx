import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import { ApiError } from "@/src/shared/api/api-error";
import { useCurrentTrackMusicPowerVote } from "./useCurrentTrackMusicPowerVote";
import { useRoomMusicPowerVote } from "./useRoomMusicPowerVote";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@/src/features/user/profile/hooks/useMusicPower", () => ({
  useMusicPower: vi.fn(),
}));
vi.mock("./useCurrentTrackMusicPowerVote", () => ({
  useCurrentTrackMusicPowerVote: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));

const mutate = vi.fn();
const defaultParams = {
  currentEntryId: "entry-1",
  displayNickname: "대상",
  hasCurrentUser: true,
  isCurrentUserLoading: false,
  isSelf: false,
  roomSlug: "room",
  targetSlug: "target-user",
};

function mockMusicPower(myVote: "UPVOTE" | "DOWNVOTE" | null = null) {
  vi.mocked(useMusicPower).mockReturnValue({
    data: {
      musicPower: 55,
      myVote,
      targetUserSlug: "target-user",
    },
    isLoading: false,
  } as ReturnType<typeof useMusicPower>);
}

function mockMutation(
  overrides: Partial<ReturnType<typeof useCurrentTrackMusicPowerVote>> = {},
) {
  vi.mocked(useCurrentTrackMusicPowerVote).mockReturnValue({
    error: null,
    isPending: false,
    mutate,
    variables: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useCurrentTrackMusicPowerVote>);
}

describe("useRoomMusicPowerVote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMusicPower();
    mockMutation();
  });

  it("현재 재생 entry 범위의 점수와 선택 상태만 조회한다", () => {
    const { result, rerender } = renderHook(
      ({ entryId }: { entryId: string }) =>
        useRoomMusicPowerVote({ ...defaultParams, currentEntryId: entryId }),
      { initialProps: { entryId: "entry-1" } },
    );

    expect(useMusicPower).toHaveBeenLastCalledWith("target-user", {
      entryId: "entry-1",
      roomSlug: "room",
    });
    expect(result.current.musicPower).toBe(55);
    expect(result.current.selectedVote).toBeNull();
    act(() => result.current.onVote("UPVOTE"));
    expect(mutate).toHaveBeenCalledOnce();

    mockMusicPower("UPVOTE");
    rerender({ entryId: "entry-1" });
    expect(result.current.selectedVote).toBe("UPVOTE");

    mockMusicPower();
    rerender({ entryId: "entry-2" });
    expect(result.current.selectedVote).toBeNull();
    expect(useMusicPower).toHaveBeenLastCalledWith("target-user", {
      entryId: "entry-2",
      roomSlug: "room",
    });
    act(() => result.current.onVote("DOWNVOTE"));
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(mutate).toHaveBeenLastCalledWith(
      {
        entryId: "entry-2",
        roomSlug: "room",
        targetUserSlug: "target-user",
        vote: "DOWNVOTE",
      },
      expect.any(Object),
    );
  });

  it("같은 재생곡의 연속 클릭은 한 번의 mutation만 전송한다", () => {
    const { result } = renderHook(() =>
      useRoomMusicPowerVote(defaultParams),
    );

    act(() => {
      result.current.onVote("UPVOTE");
      result.current.onVote("UPVOTE");
      result.current.onVote("DOWNVOTE");
    });

    expect(mutate).toHaveBeenCalledOnce();
    expect(mutate).toHaveBeenCalledWith(
      {
        entryId: "entry-1",
        roomSlug: "room",
        targetUserSlug: "target-user",
        vote: "UPVOTE",
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("성공하면 대상 닉네임을 포함한 공통 피드백을 표시한다", () => {
    const { result } = renderHook(() =>
      useRoomMusicPowerVote(defaultParams),
    );
    act(() => result.current.onVote("UPVOTE"));
    const options = mutate.mock.calls[0]?.[1] as { onSuccess: () => void };

    act(() => options.onSuccess());

    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "music-power:room:entry-1:target-user",
      message: "'대상'님의 음악력을 올렸습니다!",
      tone: "default",
    });
    expect(mutate).toHaveBeenCalledOnce();
  });

  it.each([
    {
      error: new ApiError({
        code: "music-power.already-evaluated",
        message: "이미 평가했습니다.",
        status: 409,
      }),
      message: "같은 곡에는 한 번만 음악력을 평가할 수 있습니다.",
      tone: "default",
    },
    {
      error: new ApiError({
        code: "music-power.failed",
        message: "음악력을 변경하지 못했습니다.",
        status: 500,
      }),
      message: "음악력을 변경하지 못했습니다.",
      tone: "error",
    },
  ] as const)("mutation 오류를 $tone 공통 피드백으로 표시한다", ({
    error,
    message,
    tone,
  }) => {
    const { result } = renderHook(() =>
      useRoomMusicPowerVote(defaultParams),
    );
    act(() => result.current.onVote("UPVOTE"));
    const options = mutate.mock.calls[0]?.[1] as {
      onError: (mutationError: ApiError) => void;
    };

    act(() => options.onError(error));

    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "music-power:room:entry-1:target-user",
      message,
      tone,
    });
  });

  it("서버 myVote가 있으면 mutation 없이 1회 제한을 안내한다", () => {
    mockMusicPower("UPVOTE");
    const { result } = renderHook(() =>
      useRoomMusicPowerVote(defaultParams),
    );

    act(() => result.current.onVote("DOWNVOTE"));

    expect(result.current.selectedVote).toBe("UPVOTE");
    expect(result.current.disabled).toBe(false);
    expect(mutate).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "music-power:room:entry-1:target-user",
      message: "같은 곡에는 한 번만 음악력을 평가할 수 있습니다.",
      tone: "default",
    });
  });

  it("비로그인은 버튼을 잠그지 않고 로그인 안내만 표시한다", () => {
    const { result } = renderHook(() =>
      useRoomMusicPowerVote({ ...defaultParams, hasCurrentUser: false }),
    );

    expect(useMusicPower).toHaveBeenLastCalledWith(null, undefined);
    expect(result.current.disabled).toBe(false);
    expect(result.current.loginNotice).toBe(
      "로그인 후 음악력을 평가할 수 있습니다.",
    );
    act(() => result.current.onVote("UPVOTE"));
    expect(mutate).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "music-power:room:entry-1:target-user",
      message: "로그인 후 음악력을 평가할 수 있습니다.",
      tone: "default",
    });
  });

  it("pending 선택은 같은 방·entry·대상에만 표시하고 버튼은 잠그지 않는다", () => {
    mockMutation({
      isPending: true,
      variables: {
        entryId: "entry-1",
        roomSlug: "room",
        targetUserSlug: "target-user",
        vote: "UPVOTE",
      },
    });
    const { result, rerender } = renderHook(
      ({ entryId }: { entryId: string }) =>
        useRoomMusicPowerVote({ ...defaultParams, currentEntryId: entryId }),
      { initialProps: { entryId: "entry-1" } },
    );

    expect(result.current.selectedVote).toBe("UPVOTE");
    expect(result.current.disabled).toBe(false);
    act(() => result.current.onVote("DOWNVOTE"));
    expect(mutate).not.toHaveBeenCalled();

    rerender({ entryId: "entry-2" });
    expect(result.current.selectedVote).toBeNull();
  });
});
