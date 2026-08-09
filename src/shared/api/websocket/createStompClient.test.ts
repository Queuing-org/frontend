import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStompClient } from "./createStompClient";

const { Client } = vi.hoisted(() => ({
  Client: vi.fn(),
}));

vi.mock("@stomp/stompjs", () => ({ Client }));

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
