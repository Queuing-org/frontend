import { describe, expect, it, vi } from "vitest";
import {
  createRetryablePreloader,
  runAfterComponentPreload,
} from "./preloadableDynamicComponent";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

describe("preloadableDynamicComponent", () => {
  it("동시 선로딩과 성공 후 호출을 하나의 로더 실행으로 합친다", async () => {
    const deferred = createDeferred<string>();
    const loader = vi.fn(() => deferred.promise);
    const preload = createRetryablePreloader(loader);

    const firstLoad = preload();
    const concurrentLoad = preload();

    expect(concurrentLoad).toBe(firstLoad);
    expect(loader).toHaveBeenCalledOnce();

    deferred.resolve("loaded");
    await expect(firstLoad).resolves.toBe("loaded");
    await expect(preload()).resolves.toBe("loaded");
    expect(loader).toHaveBeenCalledOnce();
  });

  it("실패한 선로딩 캐시를 비워 다음 호출에서 재시도한다", async () => {
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValueOnce("loaded");
    const preload = createRetryablePreloader(loader);

    await expect(preload()).rejects.toThrow("chunk failed");
    await expect(preload()).resolves.toBe("loaded");
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("성공 전에는 열지 않고 실패 시 오류 콜백만 호출한다", async () => {
    const success = createDeferred<unknown>();
    const onReady = vi.fn();
    const onError = vi.fn();

    runAfterComponentPreload(() => success.promise, onReady, onError);
    expect(onReady).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();

    success.resolve(undefined);
    await success.promise;
    await Promise.resolve();
    expect(onReady).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();

    const failure = new Error("chunk failed");
    runAfterComponentPreload(
      () => Promise.reject(failure),
      onReady,
      onError,
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(onReady).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(failure);
  });
});
