import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { setMusicPowerVote } from "../api/setMusicPowerVote";
import type { UserProfile } from "../model/types";
import { useSetMusicPowerVote } from "./useSetMusicPowerVote";

vi.mock("../api/setMusicPowerVote", () => ({
  setMusicPowerVote: vi.fn(),
}));

describe("useSetMusicPowerVote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("성공 시 음악력, 내 투표, 공개 프로필 캐시를 함께 갱신한다", async () => {
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
    vi.mocked(setMusicPowerVote).mockResolvedValue({
      musicPower: 5,
      myVote: "DOWNVOTE",
      targetUserSlug: "target-user",
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSetMusicPowerVote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        userSlug: "target-user",
        vote: "DOWNVOTE",
      });
    });

    expect(queryClient.getQueryData(userKeys.musicPower("target-user"))).toEqual({
      musicPower: 5,
      myVote: "DOWNVOTE",
      targetUserSlug: "target-user",
    });
    expect(
      queryClient.getQueryData<UserProfile>(userKeys.profile("target-user"))
        ?.musicPower,
    ).toBe(5);
  });
});
