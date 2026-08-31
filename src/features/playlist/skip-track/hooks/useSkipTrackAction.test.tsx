import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishNextTrack } from "@/src/features/playlist/api/websocket/publishNextTrack";
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { useSkipTrackAction } from "./useSkipTrackAction";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@/src/features/playlist/api/websocket/publishNextTrack", () => ({
  publishNextTrack: vi.fn(),
}));
vi.mock("@/src/shared/api/query/scheduleQueryInvalidation", () => ({
  scheduleQueryInvalidation: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));

function renderSkipAction() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return {
    queryClient,
    ...renderHook(() => useSkipTrackAction("room"), { wrapper }),
  };
}

describe("useSkipTrackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SKIP 성공은 알림 없이 큐와 재생 상태 갱신만 예약한다", () => {
    const { queryClient, result } = renderSkipAction();
    const resetQueries = vi.spyOn(queryClient, "resetQueries");

    act(() => result.current.skipTrack());

    expect(publishNextTrack).toHaveBeenCalledWith("room");
    expect(scheduleQueryInvalidation).toHaveBeenCalledOnce();
    expect(resetQueries).toHaveBeenCalledWith({
      queryKey: ["roomQueueHistory", "room"],
      exact: true,
    });
    expect(notify).not.toHaveBeenCalled();
  });

  it("SKIP 요청 실패만 빨간 공통 알림으로 표시한다", () => {
    vi.mocked(publishNextTrack).mockImplementationOnce(() => {
      throw new Error("SKIP 실패");
    });
    const { result } = renderSkipAction();

    act(() => result.current.skipTrack());

    expect(scheduleQueryInvalidation).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith({
      dedupeKey: "skip-track:room",
      message: "SKIP 실패",
      tone: "error",
    });
  });
});
