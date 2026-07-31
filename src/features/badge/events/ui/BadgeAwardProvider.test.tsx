import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import BadgeAwardProvider from "./BadgeAwardProvider";

type EventHandler = (event: Event) => void;

class MockEventSource {
  static latest: MockEventSource | null = null;
  handlers = new Map<string, EventHandler>();
  close = vi.fn();

  constructor(
    public url: string,
    public options?: EventSourceInit,
  ) {
    MockEventSource.latest = this;
  }

  addEventListener(type: string, handler: EventListenerOrEventListenerObject) {
    this.handlers.set(type, handler as EventHandler);
  }

  removeEventListener(type: string) {
    this.handlers.delete(type);
  }

  emit(type: string, event: Event) {
    this.handlers.get(type)?.(event);
  }
}

vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));
vi.mock("@/src/shared/api/config", () => ({
  API_BASE_URL: "https://api.example.com",
}));

function Wrapper({ children }: PropsWithChildren) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("BadgeAwardProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.latest = null;
    vi.stubGlobal("EventSource", MockEventSource);
    vi.mocked(useMe).mockReturnValue({
      data: {
        nickname: "나",
        profileImageUrl: null,
        slug: "me",
      },
    } as ReturnType<typeof useMe>);
  });

  it("EventSource credentials를 사용하고 여러 칭호를 순차 표시하며 중복을 제거한다", async () => {
    const user = userEvent.setup();
    render(
      <BadgeAwardProvider>
        <span>앱</span>
      </BadgeAwardProvider>,
      { wrapper: Wrapper },
    );

    expect(MockEventSource.latest?.options).toEqual({
      withCredentials: true,
    });
    const rawEvent = {
      data: JSON.stringify({
        roomSlug: "room",
        userSlug: "me",
        nickname: "나",
        badges: [
          { badgeCode: "A", name: "첫 칭호" },
          { badgeCode: "B", name: "둘째 칭호" },
        ],
      }),
      lastEventId: "event-1",
    } as MessageEvent<string>;
    act(() => {
      MockEventSource.latest?.emit("badge-awarded", rawEvent);
    });

    expect(screen.getByText("첫 칭호 칭호 획득하셨습니다!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(
      screen.getByText("둘째 칭호 칭호 획득하셨습니다!"),
    ).toBeInTheDocument();

    act(() => {
      MockEventSource.latest?.emit("badge-awarded", rawEvent);
    });
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("로그인 상태가 바뀌어도 앱 children을 remount하지 않는다", () => {
    const onMount = vi.fn();
    const onUnmount = vi.fn();
    vi.mocked(useMe).mockReturnValue({
      data: null,
    } as ReturnType<typeof useMe>);

    function AppLifecycleProbe() {
      useEffect(() => {
        onMount();
        return onUnmount;
      }, []);

      return <span>앱 화면</span>;
    }

    const view = render(
      <BadgeAwardProvider>
        <AppLifecycleProbe />
      </BadgeAwardProvider>,
      { wrapper: Wrapper },
    );

    expect(onMount).toHaveBeenCalledOnce();
    expect(onUnmount).not.toHaveBeenCalled();
    expect(MockEventSource.latest).toBeNull();

    vi.mocked(useMe).mockReturnValue({
      data: {
        nickname: "나",
        profileImageUrl: null,
        slug: "me",
      },
    } as ReturnType<typeof useMe>);
    view.rerender(
      <BadgeAwardProvider>
        <AppLifecycleProbe />
      </BadgeAwardProvider>,
    );

    expect(onMount).toHaveBeenCalledOnce();
    expect(onUnmount).not.toHaveBeenCalled();
    expect(MockEventSource.latest?.options).toEqual({
      withCredentials: true,
    });
    expect(screen.getByText("앱 화면")).toBeInTheDocument();
  });
});
