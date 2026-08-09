import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFollow } from "@/src/features/follow/follow/hooks/useFollow";
import { useSearchUsers } from "@/src/features/user/search/hooks/useSearchUsers";
import type { SearchUser } from "@/src/features/user/search/model/types";
import { useAddFriendModalState } from "./useAddFriendModalState";

vi.mock("@/src/features/follow/follow/hooks/useFollow", () => ({
  useFollow: vi.fn(),
}));
vi.mock("@/src/features/user/search/hooks/useSearchUsers", () => ({
  useSearchUsers: vi.fn(),
}));

const followMutate = vi.fn();
const followReset = vi.fn();
const targetUser: SearchUser = {
  nickname: "감튀",
  profileImageUrl: "/profile.png",
  relationship: "NONE",
  slug: "gam-twi",
};

describe("useAddFriendModalState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchUsers).mockReturnValue({
      data: { hasNext: false, items: [targetUser] },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useSearchUsers>);
    vi.mocked(useFollow).mockReturnValue({
      error: null,
      isPending: false,
      mutate: followMutate,
      reset: followReset,
    } as unknown as ReturnType<typeof useFollow>);
  });

  it("검색 결과를 선택하면 입력값에는 닉네임을 채우고 slug는 mutation에 사용한다", () => {
    const { result } = renderHook(() => useAddFriendModalState());

    act(() => result.current.updateQuery("감"));
    act(() => result.current.selectUser(targetUser));

    expect(result.current.query).toBe("감튀");
    expect(result.current.isResultsOpen).toBe(false);

    act(() => result.current.submit());

    expect(followMutate).toHaveBeenCalledWith(
      { targetSlug: "gam-twi" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    const mutationOptions = followMutate.mock.calls[0]?.[1] as {
      onSuccess: () => void;
    };
    act(() => mutationOptions.onSuccess());
    expect(result.current.isSuccess).toBe(true);
  });

  it("입력값을 다시 수정하면 선택과 이전 feedback을 초기화한다", () => {
    const { result } = renderHook(() => useAddFriendModalState());

    act(() => result.current.selectUser(targetUser));
    act(() => result.current.updateQuery("감튀교"));

    expect(result.current.isResultsOpen).toBe(true);
    expect(followReset).toHaveBeenCalled();
  });

  it("팔로우 요청 중에는 mutation 상태를 초기화하지 않는다", () => {
    vi.mocked(useFollow).mockReturnValue({
      error: null,
      isPending: true,
      mutate: followMutate,
      reset: followReset,
    } as unknown as ReturnType<typeof useFollow>);
    const { result } = renderHook(() => useAddFriendModalState());

    act(() => result.current.updateQuery("감"));
    act(() => result.current.selectUser(targetUser));
    act(() => result.current.clearQuery());
    act(() => result.current.submit());

    expect(followReset).not.toHaveBeenCalled();
    expect(followMutate).not.toHaveBeenCalled();
  });
});
