import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FollowerUser } from "@/src/features/follow/model/types";
import { useFollowersList } from "../hooks/useFollowersList";
import FollowersList from "./FollowersList";

vi.mock("../hooks/useFollowersList", () => ({ useFollowersList: vi.fn() }));
vi.mock("@/src/features/follow/blocked/ui/BlockUserModal", () => ({
  default: ({ target }: { target: { nickname: string } | null }) =>
    target ? <div>차단 모달: {target.nickname}</div> : null,
}));
vi.mock("./FollowerCard", () => ({
  default: ({
    onBlock,
    user,
  }: {
    onBlock: (user: FollowerUser) => void;
    user: FollowerUser;
  }) => <button onClick={() => onBlock(user)}>차단 열기</button>,
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
      data: { hasNext: false, items: [], nextCursor: null },
    } as ReturnType<typeof useFollowersList>);

    render(<FollowersList />);

    expect(screen.getByText("팔로워가 없습니다.")).toBeInTheDocument();
  });

  it("마지막 사용자를 차단해 목록이 비어도 열린 모달을 유지한다", async () => {
    const user = userEvent.setup();
    const items = [follower];
    vi.mocked(useFollowersList).mockImplementation(() => ({
      data: { hasNext: false, items, nextCursor: null },
    }) as ReturnType<typeof useFollowersList>);
    const { rerender } = render(<FollowersList />);

    await user.click(screen.getByRole("button", { name: "차단 열기" }));
    items.splice(0);
    rerender(<FollowersList />);

    expect(screen.getByText("팔로워가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("차단 모달: 팔로워")).toBeInTheDocument();
  });
});
