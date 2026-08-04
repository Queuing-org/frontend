import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { badgeKeys } from "@/src/features/badge/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { logoutApi } from "../api/logout";
import { useLogout } from "./useLogout";

vi.mock("../api/logout", () => ({
  logoutApi: vi.fn(),
}));

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로그아웃 성공 시 내 정보와 계정별 칭호 캐시를 정리한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(userKeys.me(), { slug: "first-user" });
    queryClient.setQueryData(badgeKeys.me(), {
      badges: [{ badgeCode: "FIRST_BADGE" }],
    });
    vi.mocked(logoutApi).mockResolvedValue();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(userKeys.me())).toBeNull();
    expect(queryClient.getQueryData(badgeKeys.me())).toBeUndefined();
  });
});
