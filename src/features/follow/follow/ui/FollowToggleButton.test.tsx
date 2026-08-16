import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUnfollow } from "@/src/features/follow/unfollow/hooks/useUnfollow";
import { useFollow } from "../hooks/useFollow";
import FollowToggleButton from "./FollowToggleButton";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("../hooks/useFollow", () => ({ useFollow: vi.fn() }));
vi.mock("@/src/features/follow/unfollow/hooks/useUnfollow", () => ({
  useUnfollow: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));

const unfollowMutate = vi.fn();

describe("FollowToggleButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFollow).mockReturnValue({
      error: null,
      isPending: false,
      mutate: vi.fn(),
      reset: vi.fn(),
      variables: undefined,
    } as unknown as ReturnType<typeof useFollow>);
    vi.mocked(useUnfollow).mockReturnValue({
      error: null,
      isPending: false,
      mutate: unfollowMutate,
      reset: vi.fn(),
      variables: undefined,
    } as unknown as ReturnType<typeof useUnfollow>);
  });

  it("프로필 전용 following label을 표시하면서 기존 unfollow 동작을 유지한다", async () => {
    const user = userEvent.setup();
    render(
      <FollowToggleButton
        followingLabel="팔로잉"
        initialRelationship="FOLLOWING"
        targetNickname="감튀"
        targetSlug="target-user"
      />,
    );

    await user.click(screen.getByRole("button", { name: "팔로잉" }));

    expect(unfollowMutate).toHaveBeenCalledWith(
      { targetSlug: "target-user" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    const options = unfollowMutate.mock.lastCall?.[1] as { onSuccess: () => void };
    act(() => options.onSuccess());
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "unfollow:target-user",
      message: "'감튀'님을 언팔로우했습니다.",
      tone: "default",
    });
  });

  it("메뉴 역할을 전달하고 mutation 성공 뒤 callback을 실행한다", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const followMutate = vi.fn();
    vi.mocked(useFollow).mockReturnValue({
      error: null,
      isPending: false,
      mutate: followMutate,
      reset: vi.fn(),
      variables: undefined,
    } as unknown as ReturnType<typeof useFollow>);
    render(
      <FollowToggleButton
        onSuccess={onSuccess}
        role="menuitem"
        targetNickname="감튀"
        targetSlug="target-user"
      />,
    );

    await user.click(screen.getByRole("menuitem", { name: "팔로우" }));
    const options = followMutate.mock.calls[0]?.[1] as
      | { onSuccess?: () => void }
      | undefined;
    act(() => options?.onSuccess?.());

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "follow:target-user",
      message: "'감튀'님을 팔로우했습니다!",
      tone: "default",
    });
  });
});
