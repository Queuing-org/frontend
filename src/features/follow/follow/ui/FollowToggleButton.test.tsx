import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUnfollow } from "@/src/features/follow/unfollow/hooks/useUnfollow";
import { useFollow } from "../hooks/useFollow";
import FollowToggleButton from "./FollowToggleButton";

vi.mock("../hooks/useFollow", () => ({ useFollow: vi.fn() }));
vi.mock("@/src/features/follow/unfollow/hooks/useUnfollow", () => ({
  useUnfollow: vi.fn(),
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
        targetSlug="target-user"
      />,
    );

    await user.click(screen.getByRole("button", { name: "팔로잉" }));

    expect(unfollowMutate).toHaveBeenCalledWith(
      { targetSlug: "target-user" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
