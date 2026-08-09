import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFollowers } from "@/src/features/follow/followers/api/fetchFollowers";
import { fetchFollowing } from "@/src/features/follow/following/api/fetchFollowing";
import {
  formatFollowTabCount,
  useFollowTabCounts,
} from "./useFollowTabCounts";

vi.mock("@/src/features/follow/followers/api/fetchFollowers", () => ({
  fetchFollowers: vi.fn(),
}));
vi.mock("@/src/features/follow/following/api/fetchFollowing", () => ({
  fetchFollowing: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useFollowTabCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchFollowing).mockResolvedValue({
      hasNext: false,
      items: [],
      nextCursor: null,
    });
    vi.mocked(fetchFollowers).mockResolvedValue({
      hasNext: false,
      items: [],
      nextCursor: null,
    });
  });

  it("모달이 열리면 두 목록의 첫 100명을 같은 query 계약으로 조회한다", async () => {
    const { result } = renderHook(() => useFollowTabCounts(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toEqual({ following: "0", followers: "0" }));
    expect(fetchFollowing).toHaveBeenCalledWith({ size: 100 });
    expect(fetchFollowers).toHaveBeenCalledWith({ size: 100 });
  });

  it("모달이 닫혀 있으면 목록을 추가 조회하지 않는다", () => {
    renderHook(() => useFollowTabCounts(false), { wrapper: createWrapper() });

    expect(fetchFollowing).not.toHaveBeenCalled();
    expect(fetchFollowers).not.toHaveBeenCalled();
  });
});

describe("formatFollowTabCount", () => {
  it("다음 페이지가 있으면 정확하지 않은 전체 수 대신 +를 붙인다", () => {
    expect(
      formatFollowTabCount({
        hasNext: true,
        items: Array.from({ length: 100 }, (_, index) => ({
          cursorId: index,
          nickname: `사용자 ${index}`,
          online: false,
          presenceVersion: 0,
          profileImageUrl: null,
          room: null,
          slug: `user-${index}`,
        })),
        nextCursor: 1,
      }),
    ).toBe("100+");
  });
});
