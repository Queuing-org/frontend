import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStompClient } from "./createStompClient";

const { Client, TickerStrategy } = vi.hoisted(() => ({
  Client: vi.fn(),
  TickerStrategy: {
    Worker: "worker",
  },
}));

vi.mock("@stomp/stompjs", () => ({ Client, TickerStrategy }));

type ClientConfig = {
  debug: (message: string) => void;
};

describe("createStompClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("백그라운드 heartbeat에 Worker ticker와 기존 연결 기본값을 사용한다", () => {
    createStompClient();

    expect(Client).toHaveBeenCalledWith(
      expect.objectContaining({
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        heartbeatStrategy: TickerStrategy.Worker,
      }),
    );
  });

  it("production에서는 STOMP frame debug를 출력하지 않는다", () => {
    vi.stubEnv("NODE_ENV", "production");
    const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});

    createStompClient({ debugLabel: "ROOM_STOMP" });
    const config = Client.mock.calls[0]?.[0] as ClientConfig;
    config.debug(">>> SEND\ndestination:/app/room\n\nsecret body");

    expect(consoleDebug).not.toHaveBeenCalled();
  });

  it("development에서도 STOMP debug body와 header를 제거한다", () => {
    vi.stubEnv("NODE_ENV", "development");
    const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});

    createStompClient({ debugLabel: "ROOM_STOMP" });
    const config = Client.mock.calls[0]?.[0] as ClientConfig;
    config.debug("<<< MESSAGE\ndestination:/topic/private\n\nsecret body");

    expect(consoleDebug).toHaveBeenCalledWith("[ROOM_STOMP]", "<<< MESSAGE");
    expect(JSON.stringify(consoleDebug.mock.calls)).not.toContain("secret");
    expect(JSON.stringify(consoleDebug.mock.calls)).not.toContain("destination");
  });
});
