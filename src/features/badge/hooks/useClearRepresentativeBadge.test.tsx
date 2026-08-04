import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { clearRepresentativeBadge } from "../api/clearRepresentativeBadge";
import { badgeKeys } from "../model/queryKeys";
import { useClearRepresentativeBadge } from "./useClearRepresentativeBadge";

vi.mock("../api/clearRepresentativeBadge", () => ({
  clearRepresentativeBadge: vi.fn(),
}));

describe("useClearRepresentativeBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("해제 성공 시 내 정보와 내·공개 칭호 cache를 무효화한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    queryClient.setQueryData(userKeys.me(), {
      nickname: "민지",
      profileImageUrl: null,
      slug: "minji",
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(clearRepresentativeBadge).mockResolvedValue(true);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useClearRepresentativeBadge(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: badgeKeys.me() });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: userKeys.me() });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: badgeKeys.publicUser("minji"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: userKeys.profile("minji"),
    });
  });
});
