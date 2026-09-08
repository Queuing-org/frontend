import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createTestQueryClient,
  createTestQueryClientWrapper,
} from "@/src/shared/test/queryClient";
import { useLogout } from "@/src/features/auth/logout/model/useLogout";
import { useWithdrawMe } from "./useWithdrawMe";
import { trackSuggestionKeys } from "@/src/features/playlist/model/trackSuggestionKeys";
vi.mock("@/src/features/auth/logout/api/logout", () => ({
  logoutApi: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../api/withdrawMe", () => ({
  withdrawMe: vi.fn().mockResolvedValue(undefined),
}));

describe("account exit with in-flight reads", () => {
  it.each(["logout", "withdraw"])(
    "%s 성공 시 검색 캐시를 제거하고 늦은 본인 조회가 계정을 복원하지 못한다",
    async (action) => {
      const client = createTestQueryClient();
      const user = { slug: "previous-account" };
      client.setQueryData(["me"], user);
      client.setQueryData(trackSuggestionKeys.frequent(user.slug), [
        { videoId: "private" },
      ]);
      client.setQueryData(
        trackSuggestionKeys.search(user.slug, "private search"),
        [{ videoId: "private" }],
      );
      let resolve!: (user: { slug: string }) => void;
      let signal!: AbortSignal;
      const pending = client
        .fetchQuery({
          queryKey: ["me"],
          queryFn: (context) => {
            signal = context.signal;
            return new Promise<typeof user>((done) => {
              resolve = done;
            });
          },
        })
        .catch(() => undefined);
      const { result } = renderHook(
        () => ({ logout: useLogout(), withdraw: useWithdrawMe() }),
        { wrapper: createTestQueryClientWrapper(client) },
      );
      await act(async () => {
        if (action === "logout") await result.current.logout.mutateAsync();
        else await result.current.withdraw.mutateAsync({});
      });
      expect(signal.aborted).toBe(true);
      await act(async () => {
        resolve(user);
        await pending;
      });
      expect(client.getQueryData(["me"])).toBeNull();
      expect(
        client.getQueryCache().findAll({ queryKey: trackSuggestionKeys.all() }),
      ).toHaveLength(0);
      client.clear();
    },
  );
});
