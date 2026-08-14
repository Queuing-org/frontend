import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { followKeys } from "@/src/features/follow/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { unblockUser } from "../api/unblockUser";
import {
  usePendingUnblockUserSlugs,
  useUnblockUser,
} from "./useUnblockUser";

vi.mock("../api/unblockUser", () => ({ unblockUser: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

it("차단 해제 성공 시 차단/팔로우와 사용자 검색 cache를 무효화한다", async () => {
  const queryClient = new QueryClient();
  const blockedKey = followKeys.blocked(20);
  const followingKey = followKeys.followings(undefined, 20);
  const searchKey = userKeys.search("대상", 20);
  queryClient.setQueryData(blockedKey, { pages: [], pageParams: [] });
  queryClient.setQueryData(followingKey, { items: [] });
  queryClient.setQueryData(searchKey, { items: [] });
  vi.mocked(unblockUser).mockResolvedValue();
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

it("동시에 진행 중인 모든 차단 해제 slug를 유지한다", async () => {
  const queryClient = new QueryClient();
  const resolvers = new Map<string, () => void>();
  vi.mocked(unblockUser).mockImplementation(
    (slug) =>
      new Promise<void>((resolve) => {
        resolvers.set(slug, resolve);
      }),
  );
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => ({
      mutation: useUnblockUser(),
      pendingSlugs: usePendingUnblockUserSlugs(),
    }),
    { wrapper },
  );

  act(() => {
    result.current.mutation.mutate("minji");
    result.current.mutation.mutate("jisu");
  });
  await waitFor(() =>
    expect(result.current.pendingSlugs.sort()).toEqual(["jisu", "minji"]),
  );

  act(() => resolvers.get("minji")?.());
  await waitFor(() =>
    expect(result.current.pendingSlugs).toEqual(["jisu"]),
  );

  act(() => resolvers.get("jisu")?.());
  await waitFor(() => expect(result.current.pendingSlugs).toEqual([]));
});

it("cache invalidation 완료까지 mutation을 pending으로 유지한다", async () => {
  const queryClient = new QueryClient();
  let finishInvalidation: (() => void) | undefined;
  const invalidation = new Promise<void>((resolve) => {
    finishInvalidation = resolve;
  });
  const invalidateQueries = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockReturnValue(invalidation);
  vi.mocked(unblockUser).mockResolvedValue();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUnblockUser(), { wrapper });

  act(() => result.current.mutate("target-user"));
  await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(5));
  expect(result.current.isPending).toBe(true);

  act(() => finishInvalidation?.());
  await waitFor(() => expect(result.current.isPending).toBe(false));
});
