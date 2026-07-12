import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { recommendMusicPower } from "../api/recommendMusicPower";
import type { UserProfile } from "../model/types";
import { useRecommendMusicPower } from "./useRecommendMusicPower";

vi.mock("../api/recommendMusicPower", () => ({
  recommendMusicPower: vi.fn(),
}));

describe("useRecommendMusicPower", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("추천 성공 시 음악력과 공개 프로필 캐시를 함께 갱신한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const profile: UserProfile = {
      nickname: "대상",
      profileImageUrl: null,
      slug: "target-user",
      musicPower: 4,
    };
    queryClient.setQueryData(userKeys.profile("target-user"), profile);
    vi.mocked(recommendMusicPower).mockResolvedValue({
      musicPower: 5,
      recommendedByMe: true,
      targetUserSlug: "target-user",
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useRecommendMusicPower(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("target-user");
    });

    expect(queryClient.getQueryData(userKeys.musicPower("target-user"))).toEqual({
      musicPower: 5,
      recommendedByMe: true,
      targetUserSlug: "target-user",
    });
    expect(
      queryClient.getQueryData<UserProfile>(userKeys.profile("target-user"))
        ?.musicPower,
    ).toBe(5);
  });
});
