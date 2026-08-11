import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getYouTubeIframeAllowWithAutoplay,
  useYouTubeIframePlayer,
} from "./useYouTubeIframePlayer";

type MockPlayer = {
  cueVideoById: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  getCurrentTime: ReturnType<typeof vi.fn>;
  getIframe: ReturnType<typeof vi.fn>;
  loadVideoById: ReturnType<typeof vi.fn>;
  pauseVideo: ReturnType<typeof vi.fn>;
  playVideo: ReturnType<typeof vi.fn>;
  seekTo: ReturnType<typeof vi.fn>;
};

type PlayerOptions = {
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: MockPlayer }) => void;
  };
};

function PlayerHarness({
  currentTimeMs = 5_000,
  playbackStatus = "PLAYING",
}: {
  currentTimeMs?: number;
  playbackStatus?: "PLAYING" | "PAUSED";
}) {
  const { playerMountRef } = useYouTubeIframePlayer({
    currentTimeMs,
    playbackStatus,
    playerHostClassName: "player-host",
    videoId: "video-1",
  });

  return <div ref={playerMountRef} />;
}

function installYouTubePlayerMock() {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("allow", "fullscreen; encrypted-media");
  const player: MockPlayer = {
    cueVideoById: vi.fn(),
    destroy: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    getIframe: vi.fn(() => iframe),
    loadVideoById: vi.fn(),
    pauseVideo: vi.fn(),
    playVideo: vi.fn(),
    seekTo: vi.fn(),
  };
  let playerOptions: PlayerOptions | undefined;

  function Player(_element: HTMLElement, options: PlayerOptions) {
    playerOptions = options;
    return player;
  }

  window.YT = {
    Player: Player as unknown as NonNullable<typeof window.YT>["Player"],
  };

  return {
    iframe,
    player,
    getPlayerOptions: () => playerOptions,
  };
}

afterEach(() => {
  delete window.YT;
});

describe("getYouTubeIframeAllowWithAutoplay", () => {
  it.each([
    ["", "autoplay"],
    ["fullscreen; encrypted-media", "fullscreen; encrypted-media; autoplay"],
    ["autoplay; fullscreen", "autoplay; fullscreen"],
    ["autoplay 'self'; fullscreen", "autoplay 'self'; fullscreen"],
  ])("%s 권한에 autoplay를 중복 없이 보강한다", (current, expected) => {
    expect(getYouTubeIframeAllowWithAutoplay(current)).toBe(expected);
  });
});

describe("useYouTubeIframePlayer", () => {
  it("iframe autoplay 권한을 위임한 뒤 현재 곡 재생을 시도한다", async () => {
    const { iframe, player, getPlayerOptions } = installYouTubePlayerMock();

    render(<PlayerHarness />);

    await waitFor(() => expect(getPlayerOptions()).toBeDefined());
    const options = getPlayerOptions();

    expect(options?.playerVars?.autoplay).toBe(1);

    act(() => {
      options?.events?.onReady?.({ target: player });
    });

    expect(iframe).toHaveAttribute(
      "allow",
      "fullscreen; encrypted-media; autoplay",
    );
    expect(player.loadVideoById).toHaveBeenCalledWith({
      videoId: "video-1",
      startSeconds: 5,
    });
    expect(player.playVideo).toHaveBeenCalledOnce();
  });

  it("서버 상태가 일시정지면 자동재생을 시도하지 않는다", async () => {
    const { player, getPlayerOptions } = installYouTubePlayerMock();

    render(<PlayerHarness playbackStatus="PAUSED" />);

    await waitFor(() => expect(getPlayerOptions()).toBeDefined());

    act(() => {
      getPlayerOptions()?.events?.onReady?.({ target: player });
    });

    expect(player.cueVideoById).toHaveBeenCalledWith({
      videoId: "video-1",
      startSeconds: 5,
    });
    expect(player.pauseVideo).toHaveBeenCalledOnce();
    expect(player.playVideo).not.toHaveBeenCalled();
  });
});
