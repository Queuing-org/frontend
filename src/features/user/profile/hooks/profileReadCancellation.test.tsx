import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMusicPower } from "../api/fetchMusicPower";
import { fetchUserProfile } from "../api/fetchUserProfile";
import { useMusicPower } from "./useMusicPower";
import { useUserProfile } from "./useUserProfile";

vi.mock("../api/fetchMusicPower", () => ({ fetchMusicPower: vi.fn() }));
vi.mock("../api/fetchUserProfile", () => ({ fetchUserProfile: vi.fn() }));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("profile read cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchUserProfile).mockReturnValue(new Promise(() => {}));
    vi.mocked(fetchMusicPower).mockReturnValue(new Promise(() => {}));
  });

  it("프로필 대상이 바뀌면 이전 GET signal을 abort한다", async () => {
    const { rerender } = renderHook(
      ({ slug }: { slug: string }) => useUserProfile(slug),
      { initialProps: { slug: "first" }, wrapper: createWrapper() },
    );
    await waitFor(() => expect(fetchUserProfile).toHaveBeenCalledOnce());
    const firstSignal = vi.mocked(fetchUserProfile).mock.calls[0]?.[1];

    rerender({ slug: "second" });

    await waitFor(() => expect(fetchUserProfile).toHaveBeenCalledTimes(2));
    expect(firstSignal?.aborted).toBe(true);
  });

  it("음악력 대상이 바뀌면 이전 GET signal을 abort한다", async () => {
    const { rerender } = renderHook(
      ({ slug }: { slug: string }) => useMusicPower(slug),
      { initialProps: { slug: "first" }, wrapper: createWrapper() },
    );
    await waitFor(() => expect(fetchMusicPower).toHaveBeenCalledOnce());
    const firstSignal = vi.mocked(fetchMusicPower).mock.calls[0]?.[2];

    rerender({ slug: "second" });

    await waitFor(() => expect(fetchMusicPower).toHaveBeenCalledTimes(2));
    expect(firstSignal?.aborted).toBe(true);
  });
});
