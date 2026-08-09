import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { searchUsers } from "../api/searchUsers";
import { useSearchUsers } from "./useSearchUsers";

vi.mock("../api/searchUsers", () => ({
  searchUsers: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useSearchUsers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("두 글자부터 검색하고 observer가 이동하면 이전 요청을 abort한다", async () => {
    vi.mocked(searchUsers).mockReturnValue(new Promise(() => {}));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { rerender, unmount } = renderHook(
      ({ query }) => useSearchUsers({ query }),
      {
        initialProps: { query: "감" },
        wrapper: createWrapper(queryClient),
      },
    );

    expect(searchUsers).not.toHaveBeenCalled();

    rerender({ query: " 감튀 " });
    await waitFor(() => expect(searchUsers).toHaveBeenCalledOnce());
    const [params, signal] = vi.mocked(searchUsers).mock.calls[0];
    expect(params.query).toBe("감튀");
    expect(signal?.aborted).toBe(false);

    rerender({ query: "" });
    await waitFor(() => expect(signal?.aborted).toBe(true));

    unmount();
    queryClient.clear();
  });
});
