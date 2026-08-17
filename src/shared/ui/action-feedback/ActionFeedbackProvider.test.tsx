import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActionFeedbackProvider, {
  useActionFeedback,
} from "./ActionFeedbackProvider";

function FeedbackHarness() {
  const { notify } = useActionFeedback();
  const [routeChild, setRouteChild] = useState("home");

  return (
    <>
      <span>{routeChild}</span>
      <button onClick={() => setRouteChild("room")}>route</button>
      <button
        onClick={() =>
          notify({ dedupeKey: "default", message: "완료", tone: "default" })
        }
      >
        default
      </button>
      <button
        onClick={() =>
          notify({ dedupeKey: "error", message: "실패", tone: "error" })
        }
      >
        error
      </button>
    </>
  );
}

function renderProvider(child = <FeedbackHarness />) {
  return render(
    <ActionFeedbackProvider>{child}</ActionFeedbackProvider>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ActionFeedbackProvider", () => {
  it("기본과 오류 tone을 접근성 role로 구분한다", () => {
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "default" }));
    fireEvent.click(screen.getByRole("button", { name: "error" }));

    expect(screen.getByRole("status")).toHaveTextContent("완료");
    expect(screen.getByRole("alert")).toHaveTextContent("실패");
  });

  it("1.5초 후 퇴장 상태를 거쳐 제거한다", () => {
    vi.useFakeTimers();
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "default" }));
    const feedback = screen.getByRole("status");

    act(() => vi.advanceTimersByTime(1_500));
    expect(feedback).toHaveAttribute("data-phase", "exiting");

    act(() => vi.advanceTimersByTime(160));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("퇴장 중 다른 알림이 추가되어도 기존 항목을 160ms에 제거한다", () => {
    vi.useFakeTimers();
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "default" }));
    act(() => vi.advanceTimersByTime(1_500));
    expect(screen.getByText("완료").closest("[data-phase]"))
      .toHaveAttribute("data-phase", "exiting");

    act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByRole("button", { name: "error" }));
    act(() => vi.advanceTimersByTime(60));

    expect(screen.queryByText("완료")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("실패");
  });

  it("같은 key를 갱신하고 300ms 안의 같은 문구는 무시한다", () => {
    vi.useFakeTimers();

    function DedupeHarness() {
      const { notify } = useActionFeedback();
      return (
        <>
          <button
            onClick={() =>
              notify({ dedupeKey: "same", message: "첫 문구", tone: "default" })
            }
          >
            first
          </button>
          <button
            onClick={() =>
              notify({ dedupeKey: "same", message: "둘째 문구", tone: "error" })
            }
          >
            update
          </button>
        </>
      );
    }

    renderProvider(<DedupeHarness />);
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    expect(screen.getAllByRole("status")).toHaveLength(1);

    act(() => vi.advanceTimersByTime(250));
    fireEvent.click(screen.getByRole("button", { name: "update" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("둘째 문구");

    act(() => vi.advanceTimersByTime(1_499));
    expect(screen.getByRole("alert")).toHaveAttribute("data-phase", "visible");
  });

  it("최신 다섯 개만 유지하고 가장 오래된 항목을 제거한다", () => {
    function StackHarness() {
      const { notify } = useActionFeedback();
      return (
        <button
          onClick={() => {
            for (let index = 1; index <= 6; index += 1) {
              notify({
                dedupeKey: `item-${index}`,
                message: `알림 ${index}`,
                tone: "default",
              });
            }
          }}
        >
          stack
        </button>
      );
    }

    renderProvider(<StackHarness />);
    fireEvent.click(screen.getByRole("button", { name: "stack" }));

    expect(screen.getAllByRole("status")).toHaveLength(5);
    expect(screen.queryByText("알림 1")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("알림 6");
  });

  it("기존 key를 갱신하면 스택 앞으로 옮겨 다음 알림에도 보존한다", () => {
    function StackUpdateHarness() {
      const { notify } = useActionFeedback();
      return (
        <>
          <button
            onClick={() => {
              for (let index = 1; index <= 5; index += 1) {
                notify({
                  dedupeKey: `item-${index}`,
                  message: `알림 ${index}`,
                  tone: "default",
                });
              }
            }}
          >
            fill
          </button>
          <button
            onClick={() =>
              notify({
                dedupeKey: "item-1",
                message: "갱신한 알림 1",
                tone: "default",
              })
            }
          >
            update oldest
          </button>
          <button
            onClick={() =>
              notify({
                dedupeKey: "item-6",
                message: "알림 6",
                tone: "default",
              })
            }
          >
            add next
          </button>
        </>
      );
    }

    renderProvider(<StackUpdateHarness />);
    fireEvent.click(screen.getByRole("button", { name: "fill" }));
    fireEvent.click(screen.getByRole("button", { name: "update oldest" }));
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "갱신한 알림 1",
    );

    fireEvent.click(screen.getByRole("button", { name: "add next" }));

    expect(screen.getAllByRole("status")).toHaveLength(5);
    expect(screen.getByText("갱신한 알림 1")).toBeInTheDocument();
    expect(screen.queryByText("알림 2")).not.toBeInTheDocument();
  });

  it("route child가 교체되어도 알림을 유지한다", () => {
    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "default" }));
    fireEvent.click(screen.getByRole("button", { name: "route" }));

    expect(screen.getByText("room")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("완료");
  });

  it("직접 삭제와 실시간 삭제가 겹쳐도 같은 key의 한 항목만 유지한다", () => {
    function RoomDeleteHarness() {
      const { notify } = useActionFeedback();
      return (
        <>
          <button
            onClick={() =>
              notify({
                dedupeKey: "room-delete:room",
                message: "'방' 방을 삭제했습니다.",
                tone: "default",
              })
            }
          >
            direct
          </button>
          <button
            onClick={() =>
              notify({
                dedupeKey: "room-delete:room",
                message: "방이 삭제되어 홈으로 이동했습니다.",
                tone: "default",
              })
            }
          >
            realtime
          </button>
        </>
      );
    }

    renderProvider(<RoomDeleteHarness />);
    fireEvent.click(screen.getByRole("button", { name: "direct" }));
    fireEvent.click(screen.getByRole("button", { name: "realtime" }));

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "방이 삭제되어 홈으로 이동했습니다.",
    );
  });
});
