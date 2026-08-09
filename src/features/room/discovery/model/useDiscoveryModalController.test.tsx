import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const preloaderByModal = vi.hoisted(() => ({
  create: vi.fn<() => Promise<unknown>>(),
  follow: vi.fn<() => Promise<unknown>>(),
  settings: vi.fn<() => Promise<unknown>>(),
}));

vi.mock(
  "@/src/features/room/discovery/lib/discoveryModalResources",
  () => ({
    getDiscoveryModalPreloader: (
      modalKey: keyof typeof preloaderByModal,
    ) => preloaderByModal[modalKey],
  }),
);

import { useDiscoveryModalController } from "./useDiscoveryModalController";

function createDeferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

describe("useDiscoveryModalController", () => {
  beforeEach(() => {
    Object.values(preloaderByModal).forEach((preloader) => {
      preloader.mockReset();
    });
  });

  it("선로딩 완료 전에는 모달을 열지 않고 교차 요청도 하나로 제한한다", async () => {
    const createLoad = createDeferred();
    preloaderByModal.create.mockReturnValue(createLoad.promise);
    preloaderByModal.follow.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDiscoveryModalController());

    act(() => {
      result.current.requestModal("create");
      result.current.requestModal("follow");
    });

    expect(result.current.activeModal).toBeNull();
    expect(preloaderByModal.create).toHaveBeenCalledOnce();
    expect(preloaderByModal.follow).not.toHaveBeenCalled();

    await act(async () => {
      createLoad.resolve();
      await createLoad.promise;
    });
    expect(result.current.activeModal).toBe("create");

    act(() => {
      result.current.closeModal();
      result.current.requestModal("follow");
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.activeModal).toBe("follow");
  });

  it("실패 시 화면을 유지하고 같은 액션의 재시도를 허용한다", async () => {
    preloaderByModal.settings
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDiscoveryModalController());

    await act(async () => {
      result.current.requestModal("settings");
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.activeModal).toBeNull();
    expect(result.current.loadErrorMessage).toBe(
      "화면을 불러오지 못했어요. 다시 시도해 주세요.",
    );

    await act(async () => {
      result.current.requestModal("settings");
      await Promise.resolve();
    });
    expect(preloaderByModal.settings).toHaveBeenCalledTimes(2);
    expect(result.current.activeModal).toBe("settings");
    expect(result.current.loadErrorMessage).toBeNull();
  });
});
