import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FollowingUser } from "@/src/features/follow/model/types";
import { useFollowingList } from "../hooks/useFollowingList";
import FollowingList from "./FollowingList";

vi.mock("../hooks/useFollowingList", () => ({ useFollowingList: vi.fn() }));
vi.mock("./FollowingCard", () => ({
  default: ({
    onSelect,
    user,
  }: {
    onSelect: (user: FollowingUser, trigger: HTMLButtonElement) => void;
    user: FollowingUser;
  }) => (
    <button onClick={(event) => onSelect(user, event.currentTarget)}>
      프로필 열기
    </button>
  ),
}));

const followingUser: FollowingUser = {
  cursorId: 1,
  nickname: "팔로잉",
  online: false,
  presenceVersion: 0,
  profileImageUrl: null,
  room: null,
  slug: "following",
};

describe("FollowingList", () => {
  it("빈 목록 안내를 공통 빈 상태로 표시한다", () => {
    vi.mocked(useFollowingList).mockReturnValue({
      data: { hasNext: false, items: [], nextCursor: null },
    } as ReturnType<typeof useFollowingList>);

    render(<FollowingList onSelectUser={vi.fn()} />);

    expect(screen.getByText("팔로잉한 사용자가 없습니다.")).toBeInTheDocument();
  });

  it("카드 선택 사용자와 트리거를 상위 모달에 전달한다", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onSelectUser = vi.fn();
    const items = [followingUser];
    vi.mocked(useFollowingList).mockImplementation(() => ({
      data: { hasNext: false, items, nextCursor: null },
    }) as ReturnType<typeof useFollowingList>);
    render(<FollowingList onSelectUser={onSelectUser} />);

    const trigger = screen.getByRole("button", { name: "프로필 열기" });
    await user.click(trigger);
    expect(onSelectUser).toHaveBeenCalledWith(followingUser, trigger);
  });
});
