import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { User } from "@/src/features/user/model/types";
import { updateMe } from "../api/updateMe";
import { useUpdateMe } from "./useUpdateMe";

vi.mock("../api/updateMe", () => ({
  updateMe: vi.fn(),
}));

describe("useUpdateMe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("성공 시 내 정보와 내 공개 프로필 캐시를 함께 무효화한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const me: User = {
      nickname: "민지",
      profileImageUrl: null,
      slug: "minji",
      statusMessage: "기존 메시지",
    };
    queryClient.setQueryData(userKeys.me(), me);
    queryClient.setQueryData(userKeys.profile(me.slug), me);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(updateMe).mockResolvedValue(true);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateMe(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        nickname: "민지",
        statusMessage: "새 메시지",
      });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: userKeys.me(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: userKeys.profile("minji"),
    });
    expect(queryClient.getQueryData(userKeys.me())).not.toBe(true);
  });
});
