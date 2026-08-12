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

    const mutationRefresh = scheduleQueryInvalidation({
      queryClient,
      queryKeys: [["roomPlayback", "room"]],
      resetQueryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    });
    const realtimeRefresh = scheduleQueryInvalidation({
      queryClient,
      queryKeys: [
        ["roomQueue", "room"],
        ["roomPlayback", "room"],
      ],
      scopeKey: "room-read:room",
    });

    await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);
    await expect(mutationRefresh).resolves.toBeUndefined();
    await expect(realtimeRefresh).resolves.toBeUndefined();

    expect(cancelQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(resetQueries).toHaveBeenCalledTimes(1);
    expect(cancelQueries.mock.invocationCallOrder[0]).toBeLessThan(
      invalidateQueries.mock.invocationCallOrder[0],
    );
  });

  it("예약된 refresh가 끝날 때까지 호출자 completion을 pending으로 유지한다", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    let finishReset = () => {};
    const resetFinished = new Promise<void>((resolve) => {
      finishReset = resolve;
    });
    vi.spyOn(queryClient, "resetQueries").mockReturnValue(resetFinished);
    let isCompleted = false;

    const completion = scheduleQueryInvalidation({
      queryClient,
      queryKeys: [],
      resetQueryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    }).then(() => {
      isCompleted = true;
    });

    await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);
    expect(queryClient.resetQueries).toHaveBeenCalledOnce();
    expect(isCompleted).toBe(false);

    finishReset();
    await completion;
    expect(isCompleted).toBe(true);
  });

  it("refresh 도중 같은 key가 reset으로 승격되면 후속 reset까지 완료한다", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    let finishInvalidation = () => {};
    const invalidationFinished = new Promise<void>((resolve) => {
      finishInvalidation = resolve;
    });
    vi.spyOn(queryClient, "invalidateQueries").mockReturnValue(
      invalidationFinished,
    );
    const resetQueries = vi.spyOn(queryClient, "resetQueries");

    const realtimeCompletion = scheduleQueryInvalidation({
      queryClient,
      queryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    });
    await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);
    expect(queryClient.invalidateQueries).toHaveBeenCalledOnce();

    const mutationCompletion = scheduleQueryInvalidation({
      queryClient,
      queryKeys: [],
      resetQueryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    });
    expect(mutationCompletion).toBe(realtimeCompletion);

    finishInvalidation();
    await mutationCompletion;
    expect(resetQueries).toHaveBeenCalledOnce();
  });

  it("refresh 도중 같은 key의 같은 모드 요청이 오면 한 번 더 refresh한다", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    let finishFirstInvalidation = () => {};
    const firstInvalidationFinished = new Promise<void>((resolve) => {
      finishFirstInvalidation = resolve;
    });
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockReturnValueOnce(firstInvalidationFinished)
      .mockResolvedValueOnce();

    const firstCompletion = scheduleQueryInvalidation({
      queryClient,
      queryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    });
    await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);
    expect(invalidateQueries).toHaveBeenCalledOnce();

    const secondCompletion = scheduleQueryInvalidation({
      queryClient,
      queryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    });
    expect(secondCompletion).toBe(firstCompletion);

    finishFirstInvalidation();
    await secondCompletion;
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
  });

  it("scope cleanup 시 예약된 refresh를 폐기한다", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    const completion = scheduleQueryInvalidation({
      queryClient,
      queryKeys: [["roomQueue", "room"]],
      scopeKey: "room-read:room",
    });
    cancelScheduledQueryInvalidation(queryClient, "room-read:room");
    await vi.advanceTimersByTimeAsync(QUERY_INVALIDATION_COALESCE_MS);

    expect(invalidateQueries).not.toHaveBeenCalled();
    await expect(completion).resolves.toBeUndefined();
  });
});
