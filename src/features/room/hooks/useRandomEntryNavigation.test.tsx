import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { useRandomEntryRoom } from "./useRandomEntryRoom";
import {
  RANDOM_ENTRY_ERROR_DURATION_MS,
  useRandomEntryNavigation,
} from "./useRandomEntryNavigation";

const { mutate, push } = vi.hoisted(() => ({
  mutate: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
vi.mock("./useRandomEntryRoom", () => ({
  useRandomEntryRoom: vi.fn(),
}));

type MutationOptions = {
  onError: (error: ApiError) => void;
  onSuccess: (room: { slug: string }) => void;
};

function getMutationOptions(callIndex = -1) {
  return mutate.mock.calls.at(callIndex)?.[1] as MutationOptions;
}

describe("useRandomEntryNavigation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(useRandomEntryRoom).mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useRandomEntryRoom>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("랜덤 입장 오류를 3초 뒤 자동으로 제거한다", () => {
    const { result } = renderHook(() => useRandomEntryNavigation());

    act(() => result.current.requestRandomEntry());
    act(() =>
      getMutationOptions().onError(
        new ApiError({
          code: "room.random-join-unavailable",
          message: "unavailable",
          status: 404,
        }),
      ),
    );

    expect(result.current.errorMessage).toBe("입장 가능한 공개방이 없어요");
    act(() => vi.advanceTimersByTime(RANDOM_ENTRY_ERROR_DURATION_MS - 1));
    expect(result.current.errorMessage).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.errorMessage).toBeNull();
  });

  it("재요청·성공·언마운트에서 오류 타이머를 정리한다", () => {
    const { result, unmount } = renderHook(() => useRandomEntryNavigation());

    act(() => result.current.requestRandomEntry());
    act(() =>
      getMutationOptions().onError(
        new ApiError({ message: "실패", status: 500 }),
      ),
    );
    expect(vi.getTimerCount()).toBe(1);

    act(() => result.current.requestRandomEntry());
    expect(result.current.errorMessage).toBeNull();
    expect(vi.getTimerCount()).toBe(0);

    act(() => getMutationOptions().onSuccess({ slug: "next-room" }));
    expect(push).toHaveBeenCalledWith("/room/next-room");
    expect(vi.getTimerCount()).toBe(0);

    act(() => result.current.requestRandomEntry());
    act(() =>
      getMutationOptions().onError(
        new ApiError({ message: "다시 실패", status: 500 }),
      ),
    );
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
