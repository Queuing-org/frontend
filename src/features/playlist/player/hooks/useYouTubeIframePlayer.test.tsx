import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getYouTubeIframeAllowWithAutoplay,
  type LocalSeekRequest,
  useYouTubeIframePlayer,
} from "./useYouTubeIframePlayer";

type MockPlayer = {
  cueVideoById: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  getCurrentTime: ReturnType<typeof vi.fn>;
  getIframe: ReturnType<typeof vi.fn>;
  getVolume: ReturnType<typeof vi.fn>;
  isMuted: ReturnType<typeof vi.fn>;
  loadVideoById: ReturnType<typeof vi.fn>;
  mute: ReturnType<typeof vi.fn>;
  pauseVideo: ReturnType<typeof vi.fn>;
  playVideo: ReturnType<typeof vi.fn>;
  seekTo: ReturnType<typeof vi.fn>;
  setVolume: ReturnType<typeof vi.fn>;
  unMute: ReturnType<typeof vi.fn>;
};

type PlayerOptions = {
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: MockPlayer }) => void;
  };
};

function PlayerHarness({
  currentTimeMs = 5_000,
  localSeekRequest = null,
  playbackStatus = "PLAYING",
  playbackKey = "entry-1",
  videoId = "video-1",
}: {
  currentTimeMs?: number;
  localSeekRequest?: LocalSeekRequest | null;
  playbackStatus?: "PLAYING" | "PAUSED";
  playbackKey?: string;
  videoId?: string;
}) {
  const { playerMountRef } = useYouTubeIframePlayer({
    currentTimeMs,
    localSeekRequest,
    playbackStatus,
    playbackKey,
    playerHostClassName: "player-host",
    videoId,
  });

  return <div ref={playerMountRef} />;
}

function installYouTubePlayerMock() {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("allow", "fullscreen; encrypted-media");
  const requestFullscreen = vi.fn(() => Promise.resolve());
  Object.defineProperty(iframe, "requestFullscreen", {
    configurable: true,
    value: requestFullscreen,
  });
  const player: MockPlayer = {
    cueVideoById: vi.fn(),
    destroy: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    getIframe: vi.fn(() => iframe),
    getVolume: vi.fn(() => 50),
    isMuted: vi.fn(() => false),
    loadVideoById: vi.fn(),
    mute: vi.fn(),
    pauseVideo: vi.fn(),
    playVideo: vi.fn(),
    seekTo: vi.fn(),
    setVolume: vi.fn(),
    unMute: vi.fn(),
  };
  let playerOptions: PlayerOptions | undefined;

  function Player(_element: HTMLElement, options: PlayerOptions) {
    playerOptions = options;
    _element.appendChild(iframe);
    return player;
  }

  window.YT = {
    Player: Player as unknown as NonNullable<typeof window.YT>["Player"],
  };

  return {
    iframe,
    player,
    requestFullscreen,
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
  it("iframe 키보드·autoplay 권한을 보강한 뒤 현재 곡 재생을 시도한다", async () => {
    const { iframe, player, requestFullscreen, getPlayerOptions } =
      installYouTubePlayerMock();

    const { getByRole } = render(
      <>
        <PlayerHarness />
        <input aria-label="채팅 입력" />
      </>,
    );

    await waitFor(() => expect(getPlayerOptions()).toBeDefined());
    const options = getPlayerOptions();

    expect(options?.playerVars?.autoplay).toBe(1);
    expect(options?.playerVars?.disablekb).toBe(0);

    act(() => {
      options?.events?.onReady?.({ target: player });
    });

    expect(iframe).toHaveAttribute(
      "allow",
      "fullscreen; encrypted-media; autoplay",
    );
    const keyboardTarget = iframe.parentElement?.parentElement;
    expect(keyboardTarget).toHaveAttribute("tabindex", "0");

    fireEvent.pointerEnter(keyboardTarget!);
    expect(keyboardTarget).toHaveFocus();

    fireEvent.keyDown(keyboardTarget!, { key: "ArrowUp" });
    expect(player.setVolume).toHaveBeenLastCalledWith(55);

    fireEvent.keyDown(keyboardTarget!, { key: "ArrowDown" });
    expect(player.setVolume).toHaveBeenLastCalledWith(45);

    player.seekTo.mockClear();
    fireEvent.keyDown(keyboardTarget!, { key: "ArrowRight" });
    expect(player.seekTo).toHaveBeenCalledWith(5, true);

    fireEvent.keyDown(keyboardTarget!, { key: "m" });
    expect(player.mute).toHaveBeenCalledOnce();

    fireEvent.keyDown(keyboardTarget!, { key: "f" });
    expect(requestFullscreen).toHaveBeenCalledOnce();

    const chatInput = getByRole("textbox", { name: "채팅 입력" });
    chatInput.focus();
    fireEvent.pointerEnter(keyboardTarget!);
    expect(chatInput).toHaveFocus();

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

  it("로컬 seek 이후 같은 곡의 서버 시간 보정은 무시하고 곡 변경 시 복귀한다", async () => {
    const { player, getPlayerOptions } = installYouTubePlayerMock();
    const { rerender } = render(<PlayerHarness currentTimeMs={5_000} />);

    await waitFor(() => expect(getPlayerOptions()).toBeDefined());
    act(() => {
      getPlayerOptions()?.events?.onReady?.({ target: player });
    });

    rerender(
      <PlayerHarness
        currentTimeMs={5_000}
        localSeekRequest={{ id: 1, playbackKey: "entry-1", seconds: 731 }}
      />,
    );
    expect(player.seekTo).toHaveBeenCalledWith(731, true);

    player.seekTo.mockClear();
    player.getCurrentTime.mockReturnValue(731);
    rerender(
      <PlayerHarness
        currentTimeMs={10_000}
        localSeekRequest={{ id: 1, playbackKey: "entry-1", seconds: 731 }}
      />,
    );
    expect(player.seekTo).not.toHaveBeenCalled();

    player.getCurrentTime.mockReturnValue(0);
    rerender(
      <PlayerHarness
        currentTimeMs={12_000}
        localSeekRequest={null}
        playbackKey="entry-2"
        videoId="video-2"
      />,
    );
    expect(player.loadVideoById).toHaveBeenLastCalledWith({
      videoId: "video-2",
      startSeconds: 12,
    });
  });
});
