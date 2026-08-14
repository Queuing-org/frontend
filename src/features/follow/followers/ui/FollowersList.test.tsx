import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FollowerUser } from "@/src/features/follow/model/types";
import { useFollowersList } from "../hooks/useFollowersList";
import FollowersList from "./FollowersList";

vi.mock("../hooks/useFollowersList", () => ({ useFollowersList: vi.fn() }));
vi.mock("./FollowerCard", () => ({
  default: ({
    onSelect,
    user,
  }: {
    onSelect: (user: FollowerUser, trigger: HTMLButtonElement) => void;
    user: FollowerUser;
  }) => (
    <button onClick={(event) => onSelect(user, event.currentTarget)}>
      프로필 열기
    </button>
  ),
}));

const follower: FollowerUser = {
  cursorId: 1,
  nickname: "팔로워",
  online: false,
  presenceVersion: 0,
  profileImageUrl: null,
  room: null,
  slug: "follower",
};

describe("FollowersList", () => {
  it("빈 목록 안내를 공통 빈 상태로 표시한다", () => {
    vi.mocked(useFollowersList).mockReturnValue({
      data: { pages: [{ hasNext: false, items: [], nextCursor: null }] },
      fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false,
    } as ReturnType<typeof useFollowersList>);

    render(<FollowersList onSelectUser={vi.fn()} />);

    expect(screen.getByText("팔로워가 없습니다.")).toBeInTheDocument();
  });

  it("카드 선택 사용자와 트리거를 상위 모달에 전달한다", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onSelectUser = vi.fn();
    const items = [follower];
    vi.mocked(useFollowersList).mockImplementation(() => ({
      data: { pages: [{ hasNext: false, items, nextCursor: null }] },
      fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false,
    }) as ReturnType<typeof useFollowersList>);
    render(<FollowersList onSelectUser={onSelectUser} />);

    const trigger = screen.getByRole("button", { name: "프로필 열기" });
    await user.click(trigger);
    expect(onSelectUser).toHaveBeenCalledWith(follower, trigger);
  });
});
