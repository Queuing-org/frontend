import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelScheduledQueryInvalidation,
  QUERY_INVALIDATION_COALESCE_MS,
  scheduleQueryInvalidation,
} from "./scheduleQueryInvalidation";

describe("scheduleQueryInvalidation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("같은 scope의 mutation과 realtime 요청을 query key별 한 번으로 합친다", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    const cancelQueries = vi.spyOn(queryClient, "cancelQueries");
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const resetQueries = vi.spyOn(queryClient, "resetQueries");

    scheduleQueryInvalidation({
      queryClient,
      queryKeys: [["roomPlayback", "room"]],
      resetQueryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    });
    scheduleQueryInvalidation({
      queryClient,
      queryKeys: [
        ["roomQueue", "room"],
        ["roomPlayback", "room"],
      ],
      scopeKey: "room-read:room",
    });

    await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);

    expect(cancelQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(resetQueries).toHaveBeenCalledTimes(1);
    expect(cancelQueries.mock.invocationCallOrder[0]).toBeLessThan(
      invalidateQueries.mock.invocationCallOrder[0],
    );
  });

  it("scope cleanup 시 예약된 refresh를 폐기한다", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    scheduleQueryInvalidation({
      queryClient,
      queryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    });
    cancelScheduledQueryInvalidation(queryClient, "room-read:room");
    await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
