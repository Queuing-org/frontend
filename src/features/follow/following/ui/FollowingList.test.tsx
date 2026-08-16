import { act, render, screen } from "@testing-library/react";
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
      data: { pages: [{ hasNext: false, items: [], nextCursor: null }] },
      fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false,
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
      data: { pages: [{ hasNext: false, items, nextCursor: null }] },
      fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false,
    }) as ReturnType<typeof useFollowingList>);
    render(<FollowingList onSelectUser={onSelectUser} />);

    const trigger = screen.getByRole("button", { name: "프로필 열기" });
    await user.click(trigger);
    expect(onSelectUser).toHaveBeenCalledWith(followingUser, trigger);
  });

  it("cursor 페이지의 중복 slug를 제거하고 새 페이지에도 기존 포커스를 유지한다", () => {
    let pages = [{ hasNext: true, items: [followingUser], nextCursor: 2 }];
    vi.mocked(useFollowingList).mockImplementation(() => ({
      data: { pages }, fetchNextPage: vi.fn(), hasNextPage: false,
      isFetchingNextPage: false, isFetchNextPageError: false,
    }) as ReturnType<typeof useFollowingList>);
    const { rerender } = render(<FollowingList onSelectUser={vi.fn()} />);
    const focused = screen.getByRole("button", { name: "프로필 열기" });
    focused.focus();
    pages = [
      pages[0],
      { hasNext: false, items: [followingUser], nextCursor: null },
    ];
    rerender(<FollowingList onSelectUser={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: "프로필 열기" })).toHaveLength(1);
    expect(document.activeElement).toBe(focused);
  });

  it("다음 페이지 실패 시 자동 observer 대신 다시 시도 버튼을 제공한다", async () => {
    const fetchNextPage = vi.fn();
    vi.mocked(useFollowingList).mockReturnValue({
      data: { pages: [{ hasNext: true, items: [followingUser], nextCursor: 2 }] },
      fetchNextPage, hasNextPage: true, isFetchingNextPage: false,
      isFetchNextPageError: true,
    } as ReturnType<typeof useFollowingList>);
    render(<FollowingList onSelectUser={vi.fn()} />);
    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.setup().click(screen.getByRole("button", { name: "다시 시도" }));
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it("sentinel이 보이면 다음 cursor 페이지를 자동 요청한다", () => {
    let observerCallback: IntersectionObserverCallback | undefined;
    class IntersectionObserverMock {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    const fetchNextPage = vi.fn();
    vi.mocked(useFollowingList).mockReturnValue({
      data: { pages: [{ hasNext: true, items: [followingUser], nextCursor: 2 }] },
      fetchNextPage, hasNextPage: true, isFetchingNextPage: false,
      isFetchNextPageError: false,
    } as ReturnType<typeof useFollowingList>);
    render(<FollowingList onSelectUser={vi.fn()} />);
    act(() => observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(fetchNextPage).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
