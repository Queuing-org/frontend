import { describe, expect, it } from "vitest";
import { createTestQueryClient } from "./queryClient";

describe("createTestQueryClient", () => {
  it("호출자 옵션을 보존하고 client cache를 서로 격리한다", () => {
    const first = createTestQueryClient({
      defaultOptions: {
        mutations: { retry: 1 },
        queries: { retry: 2, staleTime: 30_000 },
      },
    });
    const second = createTestQueryClient();

    expect(first.getDefaultOptions()).toMatchObject({
      mutations: { retry: 1 },
      queries: { retry: 2, staleTime: 30_000 },
    });
    expect(second.getDefaultOptions()).toMatchObject({
      mutations: { retry: false },
      queries: { retry: false },
    });

    first.setQueryData(["scope"], "first");
    expect(second.getQueryData(["scope"])).toBeUndefined();
  });
});
