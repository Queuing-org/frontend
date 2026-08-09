import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FollowingUser } from "@/src/features/follow/model/types";
import { useFollowingList } from "../hooks/useFollowingList";
import FollowingList from "./FollowingList";

vi.mock("../hooks/useFollowingList", () => ({ useFollowingList: vi.fn() }));
vi.mock("@/src/features/follow/blocked/ui/BlockUserModal", () => ({
  default: ({ target }: { target: { nickname: string } | null }) =>
    target ? <div>차단 모달: {target.nickname}</div> : null,
}));
vi.mock("./FollowingCard", () => ({
  default: ({
    onBlock,
    user,
  }: {
    onBlock: (user: FollowingUser) => void;
    user: FollowingUser;
  }) => <button onClick={() => onBlock(user)}>차단 열기</button>,
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

    render(<FollowingList />);

    expect(screen.getByText("팔로잉한 사용자가 없습니다.")).toBeInTheDocument();
  });

  it("마지막 사용자를 차단해 목록이 비어도 열린 모달을 유지한다", async () => {
    const user = userEvent.setup();
    const items = [followingUser];
    vi.mocked(useFollowingList).mockImplementation(() => ({
      data: { hasNext: false, items, nextCursor: null },
    }) as ReturnType<typeof useFollowingList>);
    const { rerender } = render(<FollowingList />);

    await user.click(screen.getByRole("button", { name: "차단 열기" }));
    items.splice(0);
    rerender(<FollowingList />);

    expect(screen.getByText("팔로잉한 사용자가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("차단 모달: 팔로잉")).toBeInTheDocument();
  });
});
