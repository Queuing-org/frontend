import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFollowingRelationship } from "../following/hooks/useFollowingRelationship";
import type { FollowUser } from "../model/types";
import FollowUserActions from "./FollowUserActions";

vi.mock("../following/hooks/useFollowingRelationship", () => ({
  useFollowingRelationship: vi.fn(),
}));
vi.mock("../follow/ui/FollowToggleButton", () => ({
  default: ({
    initialRelationship,
  }: {
    initialRelationship: string;
  }) => (
    <button type="button">
      {initialRelationship === "FOLLOWING" ? "언팔로우" : "팔로우"}
    </button>
  ),
}));

const target: FollowUser = {
  cursorId: 1,
  nickname: "민지",
  online: true,
  presenceVersion: 1,
  profileImageUrl: null,
  room: null,
  slug: "minji",
};

describe("FollowUserActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFollowingRelationship).mockReturnValue({
      data: false,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useFollowingRelationship>);
  });

  it("팔로워의 현재 관계를 확인해 팔로우와 차단 액션을 표시한다", async () => {
    const user = userEvent.setup();
    const onBlock = vi.fn();
    render(
      <FollowUserActions
        initialRelationship={null}
        onBlock={onBlock}
        user={target}
      />,
    );

    expect(useFollowingRelationship).toHaveBeenCalledWith("minji");
    expect(screen.getByRole("button", { name: "팔로우" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "차단" }));
    expect(onBlock).toHaveBeenCalledWith(target);
  });

  it("팔로잉 카드는 추가 조회 없이 현재 관계 액션을 표시한다", () => {
    render(
      <FollowUserActions
        initialRelationship="FOLLOWING"
        onBlock={vi.fn()}
        user={target}
      />,
    );

    expect(useFollowingRelationship).toHaveBeenCalledWith(null);
    expect(
      screen.getByRole("button", { name: "언팔로우" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "차단" })).toBeInTheDocument();
  });

  it("전체 팔로잉 조회에서 대상이 발견되면 팔로워 카드도 언팔로우로 표시한다", () => {
    vi.mocked(useFollowingRelationship).mockReturnValue({
      data: true,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useFollowingRelationship>);

    render(
      <FollowUserActions
        initialRelationship={null}
        onBlock={vi.fn()}
        user={target}
      />,
    );

    expect(
      screen.getByRole("button", { name: "언팔로우" }),
    ).toBeInTheDocument();
  });
});
