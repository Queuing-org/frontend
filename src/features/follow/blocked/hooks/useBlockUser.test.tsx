import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { expect, it, vi } from "vitest";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { blockUser } from "../api/blockUser";
import { useBlockUser } from "./useBlockUser";

vi.mock("../api/blockUser", () => ({ blockUser: vi.fn() }));

it("차단 성공 시 팔로우와 사용자 검색 캐시를 무효화한다", async () => {
  const queryClient = new QueryClient();
  const followingKey = followKeys.followings(undefined, 20);
  const searchKey = userKeys.search("대상", undefined, 20);
  queryClient.setQueryData(followingKey, { items: [] });
  queryClient.setQueryData(searchKey, { items: [] });
  vi.mocked(blockUser).mockResolvedValue();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useBlockUser(), { wrapper });

  await act(async () => {
    await result.current.mutateAsync("target-user");
  });

  expect(queryClient.getQueryState(followingKey)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(searchKey)?.isInvalidated).toBe(true);
});
