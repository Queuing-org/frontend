import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { fetchAllFollowing } from "../api/fetchAllFollowing";
import { useFollowingRelationship } from "./useFollowingRelationship";

vi.mock("../api/fetchAllFollowing", () => ({
  fetchAllFollowing: vi.fn(),
}));

describe("useFollowingRelationship", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("합쳐진 전체 팔로잉에서 target slug 관계를 판별한다", async () => {
    vi.mocked(fetchAllFollowing).mockResolvedValue([
      {
        cursorId: 2,
        nickname: "첫 페이지",
        online: false,
        presenceVersion: 1,
        profileImageUrl: null,
        room: null,
        slug: "first-page",
      },
      {
        cursorId: 1,
        nickname: "두 번째 페이지",
        online: false,
        presenceVersion: 1,
        profileImageUrl: null,
        room: null,
        slug: "target",
      },
    ]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useFollowingRelationship("target"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBe(true));
    expect(fetchAllFollowing).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(followKeys.followingRelationships()))
      .toHaveLength(2);
    expect(followKeys.followingRelationships().slice(0, 2)).not.toEqual(
      followKeys.followingsRoot(),
    );
  });
});
