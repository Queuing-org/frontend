import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { expect, it, vi } from "vitest";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { unblockUser } from "../api/unblockUser";
import { useUnblockUser } from "./useUnblockUser";

vi.mock("../api/unblockUser", () => ({ unblockUser: vi.fn() }));

it("차단 해제 성공 시 차단/팔로우와 사용자 검색 cache를 무효화한다", async () => {
  const queryClient = new QueryClient();
  const blockedKey = followKeys.blocked(20);
  const followingKey = followKeys.followings(undefined, 20);
  const searchKey = userKeys.search("대상", undefined, 20);
  queryClient.setQueryData(blockedKey, { pages: [], pageParams: [] });
  queryClient.setQueryData(followingKey, { items: [] });
  queryClient.setQueryData(searchKey, { items: [] });
  vi.mocked(unblockUser).mockResolvedValue(true);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUnblockUser(), { wrapper });

  await act(async () => {
    await result.current.mutateAsync("target-user");
  });

  expect(queryClient.getQueryState(blockedKey)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(followingKey)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(searchKey)?.isInvalidated).toBe(true);
});
