"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackStatus } from "@/src/features/room/model/types";

type YouTubePlayerInstance = {
  cueVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getIframe: () => HTMLIFrameElement;
  getVolume: () => number;
  isMuted: () => boolean;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  unMute: () => void;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YouTubePlayerInstance }) => void;
        onStateChange?: (event: {
          data: number;
          target: YouTubePlayerInstance;
        }) => void;
      };
    },
  ) => YouTubePlayerInstance;
};

export type LocalSeekRequest = {
  id: number;
  playbackKey: string;
  seconds: number;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YOUTUBE_IFRAME_API_URL = "https://www.youtube.com/iframe_api";
const SEEK_THRESHOLD_SECONDS = 1.5;
const KEYBOARD_SEEK_STEP_SECONDS = 5;
const KEYBOARD_VOLUME_STEP = 5;
const YOUTUBE_PLAYER_STATES = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
} as const;

export function getYouTubeIframeAllowWithAutoplay(currentAllow: string) {
  const permissions = currentAllow
    .split(";")
    .map((permission) => permission.trim())
    .filter(Boolean);
  const hasAutoplayPermission = permissions.some(
    (permission) => permission.split(/\s+/)[0]?.toLowerCase() === "autoplay",
  );

  return hasAutoplayPermission
    ? permissions.join("; ")
    : [...permissions, "autoplay"].join("; ");
}

function ensureYouTubeIframeAutoplayPermission(
  player: YouTubePlayerInstance,
) {
  const iframe = player.getIframe();
  const currentAllow = iframe.getAttribute("allow") ?? "";
  const nextAllow = getYouTubeIframeAllowWithAutoplay(currentAllow);

  if (currentAllow !== nextAllow) {
    iframe.setAttribute("allow", nextAllow);
  }
}

function isTextEntryElement(element: Element | null) {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  );
}

let youtubeIframeApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("브라우저 환경에서만 플레이어를 로드할 수 있습니다."),
    );
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise;
  }

  youtubeIframeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${YOUTUBE_IFRAME_API_URL}"]`,
    );
    const previousReadyHandler = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();

      if (window.YT?.Player) {
        resolve(window.YT);
        return;
      }

      youtubeIframeApiPromise = null;
      reject(new Error("YouTube Player API 초기화에 실패했습니다."));
    };

    if (existingScript) {
      existingScript.addEventListener(
        "error",
        () => {
          youtubeIframeApiPromise = null;
          reject(new Error("YouTube Player API 스크립트를 불러오지 못했습니다."));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = YOUTUBE_IFRAME_API_URL;
    script.async = true;
    script.onerror = () => {
      youtubeIframeApiPromise = null;
      reject(new Error("YouTube Player API 스크립트를 불러오지 못했습니다."));
    };

    document.head.appendChild(script);
  });

  return youtubeIframeApiPromise;
}

function getEffectivePlaybackStatus(
  videoId: string | null,
  playbackStatus?: PlaybackStatus | null,
) {
  if (!videoId) {
    return null;
  }

  return playbackStatus ?? "PLAYING";
}

function mapYouTubePlayerState(state: number): PlaybackStatus | null {
  switch (state) {
    case YOUTUBE_PLAYER_STATES.PLAYING:
      return "PLAYING";
    case YOUTUBE_PLAYER_STATES.PAUSED:
      return "PAUSED";
    case YOUTUBE_PLAYER_STATES.BUFFERING:
      return "BUFFERING";
    case YOUTUBE_PLAYER_STATES.ENDED:
      return "ENDED";
    default:
      return null;
  }
}

type UseYouTubeIframePlayerParams = {
  currentTimeMs?: number | null;
  localSeekRequest?: LocalSeekRequest | null;
  onPlaybackStateChange?: (args: {
    status: PlaybackStatus;
    currentTimeMs: number;
  }) => void;
  onPlayerReady?: () => void;
  playbackStatus?: PlaybackStatus | null;
  playbackKey?: string | null;
  playerHostClassName: string;
  videoId: string | null;
};

export function useYouTubeIframePlayer({
  currentTimeMs,
  localSeekRequest,
  onPlaybackStateChange,
  onPlayerReady,
  playbackStatus,
  playbackKey,
  playerHostClassName,
  videoId,
}: UseYouTubeIframePlayerParams) {
  const playerMountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const isReadyRef = useRef(false);
  const loadedVideoIdRef = useRef<string | null>(null);
  const localSeekPlaybackKeyRef = useRef<string | null>(null);
  const localSeekRequestIdRef = useRef<number | null>(null);
  const localSeekSecondsRef = useRef<number | null>(null);
  const desiredPlaybackRef = useRef({
    videoId,
    playbackStatus,
    currentTimeMs,
    playbackKey,
  });
  const onPlayerReadyRef = useRef(onPlayerReady);
  const onPlaybackStateChangeRef = useRef(onPlaybackStateChange);
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    onPlayerReadyRef.current = onPlayerReady;
  }, [onPlayerReady]);

  useEffect(() => {
    onPlaybackStateChangeRef.current = onPlaybackStateChange;
  }, [onPlaybackStateChange]);

  const destroyPlayer = useCallback(() => {
    if (!playerRef.current) {
      if (playerMountRef.current) {
        playerMountRef.current.replaceChildren();
      }
      return;
    }

    try {
      playerRef.current.destroy();
    } catch {
      // ignore player teardown failures during navigation/remount
    }

    if (playerMountRef.current) {
      playerMountRef.current.replaceChildren();
    }

    playerRef.current = null;
    isReadyRef.current = false;
    loadedVideoIdRef.current = null;
    localSeekPlaybackKeyRef.current = null;
    localSeekRequestIdRef.current = null;
    localSeekSecondsRef.current = null;
  }, []);

  const ensurePlayerHost = useCallback(() => {
    if (!playerMountRef.current) {
      return null;
    }

    const host = document.createElement("div");
    host.className = playerHostClassName;
    playerMountRef.current.replaceChildren(host);

    return host;
  }, [playerHostClassName]);

  const applyDesiredPlayback = useCallback(() => {
    const player = playerRef.current;
    const desiredPlayback = desiredPlaybackRef.current;
    const nextVideoId = desiredPlayback.videoId;
    const nextStatus = getEffectivePlaybackStatus(
      desiredPlayback.videoId,
      desiredPlayback.playbackStatus,
    );
    const hasLocalSeekOverride =
      Boolean(desiredPlayback.playbackKey) &&
      localSeekPlaybackKeyRef.current === desiredPlayback.playbackKey &&
      localSeekSecondsRef.current !== null;
    const nextTimeSeconds = hasLocalSeekOverride
      ? localSeekSecondsRef.current ?? 0
      : Math.max(0, (desiredPlayback.currentTimeMs ?? 0) / 1000);

    if (!player || !isReadyRef.current) {
      return;
    }

    if (!nextVideoId || !nextStatus) {
      player.pauseVideo();
      return;
    }

    if (loadedVideoIdRef.current !== nextVideoId) {
      loadedVideoIdRef.current = nextVideoId;

      if (nextStatus === "PAUSED" || nextStatus === "ENDED") {
        player.cueVideoById({
          videoId: nextVideoId,
          startSeconds: nextTimeSeconds,
        });
      } else {
        player.loadVideoById({
          videoId: nextVideoId,
          startSeconds: nextTimeSeconds,
        });
      }
    } else if (!hasLocalSeekOverride) {
      const currentSeconds = player.getCurrentTime();
      if (Math.abs(currentSeconds - nextTimeSeconds) >= SEEK_THRESHOLD_SECONDS) {
        player.seekTo(nextTimeSeconds, true);
      }
    }

    if (nextStatus === "PAUSED" || nextStatus === "ENDED") {
      player.pauseVideo();
      return;
    }

    player.playVideo();
  }, []);

  useEffect(() => {
    if (!videoId || playerRef.current) {
      return;
    }

    let isCancelled = false;
    let createdPlayer: YouTubePlayerInstance | null = null;

    async function setupPlayer() {
      try {
        setPlayerError(null);
        const YT = await loadYouTubeIframeApi();

        if (isCancelled || playerRef.current) {
          return;
        }

        const host = ensurePlayerHost();
        if (!host) {
          return;
        }

        createdPlayer = new YT.Player(host, {
          videoId: videoId ?? undefined,
          playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 0,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (isCancelled) {
                return;
              }

              ensureYouTubeIframeAutoplayPermission(event.target);
              isReadyRef.current = true;
              onPlayerReadyRef.current?.();
              applyDesiredPlayback();
            },
            onStateChange: (event) => {
              const mappedStatus = mapYouTubePlayerState(event.data);
              if (!mappedStatus) {
                return;
              }

              onPlaybackStateChangeRef.current?.({
                status: mappedStatus,
                currentTimeMs: Math.round(event.target.getCurrentTime() * 1000),
              });
            },
          },
        });

        playerRef.current = createdPlayer;
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setPlayerError(
          error instanceof Error
            ? error.message
            : "YouTube 플레이어를 불러오지 못했습니다.",
        );
      }
    }

    setupPlayer();

    return () => {
      isCancelled = true;
      if (createdPlayer && playerRef.current !== createdPlayer) {
        try {
          createdPlayer.destroy();
        } catch {
          // ignore player teardown failures during navigation/remount
        }
      }
    };
  }, [applyDesiredPlayback, ensurePlayerHost, videoId]);

  useEffect(() => {
    const keyboardTarget = playerMountRef.current;
    if (!videoId || !keyboardTarget) {
      return;
    }

    const focusPlayerKeyboardTarget = () => {
      if (isTextEntryElement(document.activeElement)) {
        return;
      }

      keyboardTarget.focus({ preventScroll: true });
    };
    const handlePlayerKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const player = playerRef.current;
      if (!player || !isReadyRef.current) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "arrowup": {
          event.preventDefault();
          const nextVolume = Math.min(
            100,
            player.getVolume() + KEYBOARD_VOLUME_STEP,
          );
          player.setVolume(nextVolume);
          if (nextVolume > 0 && player.isMuted()) {
            player.unMute();
          }
          return;
        }
        case "arrowdown":
          event.preventDefault();
          player.setVolume(
            Math.max(0, player.getVolume() - KEYBOARD_VOLUME_STEP),
          );
          return;
        case "arrowleft":
          event.preventDefault();
          player.seekTo(
            Math.max(
              0,
              player.getCurrentTime() - KEYBOARD_SEEK_STEP_SECONDS,
            ),
            true,
          );
          return;
        case "arrowright":
          event.preventDefault();
          player.seekTo(
            player.getCurrentTime() + KEYBOARD_SEEK_STEP_SECONDS,
            true,
          );
          return;
        case "m":
          event.preventDefault();
          if (player.isMuted()) {
            player.unMute();
          } else {
            player.mute();
          }
          return;
        case "f": {
          event.preventDefault();
          const iframe = player.getIframe();
          try {
            const fullscreenRequest =
              document.fullscreenElement === iframe
                ? document.exitFullscreen()
                : iframe.requestFullscreen();
            void fullscreenRequest.catch(() => undefined);
          } catch {
            // Keep the player usable when fullscreen is unavailable.
          }
          return;
        }
      }
    };

    keyboardTarget.tabIndex = 0;
    keyboardTarget.addEventListener("pointerenter", focusPlayerKeyboardTarget);
    keyboardTarget.addEventListener("keydown", handlePlayerKeyDown);

    return () => {
      keyboardTarget.removeEventListener(
        "pointerenter",
        focusPlayerKeyboardTarget,
      );
      keyboardTarget.removeEventListener("keydown", handlePlayerKeyDown);
      keyboardTarget.removeAttribute("tabindex");
    };
  }, [videoId]);

  useEffect(() => {
    if (videoId) {
      return;
    }

    destroyPlayer();
  }, [destroyPlayer, videoId]);

  useEffect(() => {
    desiredPlaybackRef.current = {
      videoId,
      playbackStatus,
      currentTimeMs,
      playbackKey,
    };
  }, [currentTimeMs, playbackKey, playbackStatus, videoId]);

  useEffect(() => {
    if (localSeekPlaybackKeyRef.current === playbackKey) {
      return;
    }

    localSeekPlaybackKeyRef.current = null;
    localSeekRequestIdRef.current = null;
    localSeekSecondsRef.current = null;
  }, [playbackKey]);

  useEffect(() => {
    if (
      !localSeekRequest ||
      !playbackKey ||
      localSeekRequest.playbackKey !== playbackKey ||
      localSeekRequest.id === localSeekRequestIdRef.current
    ) {
      return;
    }

    const nextSeconds = Math.max(0, localSeekRequest.seconds);
    localSeekPlaybackKeyRef.current = playbackKey;
    localSeekRequestIdRef.current = localSeekRequest.id;
    localSeekSecondsRef.current = nextSeconds;

    const player = playerRef.current;
    if (
      player &&
      isReadyRef.current &&
      loadedVideoIdRef.current === videoId
    ) {
      player.seekTo(nextSeconds, true);
      return;
    }

    applyDesiredPlayback();
  }, [applyDesiredPlayback, localSeekRequest, playbackKey, videoId]);

  useEffect(() => {
    applyDesiredPlayback();
  }, [
    applyDesiredPlayback,
    currentTimeMs,
    playbackKey,
    playbackStatus,
    videoId,
  ]);

  useEffect(() => destroyPlayer, [destroyPlayer]);

  return {
    playerError,
    playerMountRef,
  };
}
