"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackStatus } from "@/src/entities/room/model/types";

type YouTubePlayerProps = {
  videoId: string | null;
  playbackStatus?: PlaybackStatus | null;
  currentTimeMs?: number | null;
  onPlayerReady?: () => void;
  onPlaybackStateChange?: (args: {
    status: PlaybackStatus;
    currentTimeMs: number;
  }) => void;
};

type YouTubePlayerInstance = {
  cueVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
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

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YOUTUBE_IFRAME_API_URL = "https://www.youtube.com/iframe_api";
const SEEK_THRESHOLD_SECONDS = 1.5;
const YOUTUBE_PLAYER_STATES = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
} as const;

let youtubeIframeApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 플레이어를 로드할 수 있습니다."));
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

function mapYouTubePlayerState(
  state: number,
): PlaybackStatus | null {
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

export default function YouTubePlayer({
  videoId,
  playbackStatus,
  currentTimeMs,
  onPlayerReady,
  onPlaybackStateChange,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const isReadyRef = useRef(false);
  const loadedVideoIdRef = useRef<string | null>(null);
  const desiredPlaybackRef = useRef({
    videoId,
    playbackStatus,
    currentTimeMs,
  });
  const [playerError, setPlayerError] = useState<string | null>(null);

  const destroyPlayer = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    try {
      playerRef.current.destroy();
    } catch {
      // ignore player teardown failures during navigation/remount
    }

    playerRef.current = null;
    isReadyRef.current = false;
    loadedVideoIdRef.current = null;
  }, []);

  const applyDesiredPlayback = useCallback(() => {
    const player = playerRef.current;
    const desiredPlayback = desiredPlaybackRef.current;
    const nextVideoId = desiredPlayback.videoId;
    const nextStatus = getEffectivePlaybackStatus(
      desiredPlayback.videoId,
      desiredPlayback.playbackStatus,
    );
    const nextTimeSeconds = Math.max(
      0,
      (desiredPlayback.currentTimeMs ?? 0) / 1000,
    );

    if (!player || !isReadyRef.current || !nextVideoId || !nextStatus) {
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
    } else {
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
    if (!videoId) {
      destroyPlayer();
      return;
    }

    let isCancelled = false;
    let createdPlayer: YouTubePlayerInstance | null = null;

    async function setupPlayer() {
      try {
        setPlayerError(null);
        const YT = await loadYouTubeIframeApi();

        if (isCancelled || !containerRef.current || playerRef.current) {
          return;
        }

        createdPlayer = new YT.Player(containerRef.current, {
          videoId: videoId ?? undefined,
          playerVars: {
            autoplay: 1,
            controls: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              isReadyRef.current = true;
              onPlayerReady?.();
              applyDesiredPlayback();
            },
            onStateChange: (event) => {
              const mappedStatus = mapYouTubePlayerState(event.data);
              if (!mappedStatus) {
                return;
              }

              onPlaybackStateChange?.({
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
      if (createdPlayer && playerRef.current === createdPlayer) {
        destroyPlayer();
      }
    };
  }, [applyDesiredPlayback, destroyPlayer, onPlaybackStateChange, onPlayerReady, videoId]);

  useEffect(() => {
    desiredPlaybackRef.current = {
      videoId,
      playbackStatus,
      currentTimeMs,
    };
  }, [currentTimeMs, playbackStatus, videoId]);

  useEffect(() => {
    applyDesiredPlayback();
  }, [applyDesiredPlayback, currentTimeMs, playbackStatus, videoId]);

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
        재생할 유튜브 영상이 아직 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-black shadow-sm">
      <div ref={containerRef} className="aspect-video w-full" />
      {playerError ? (
        <div className="border-t border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {playerError}
        </div>
      ) : null}
    </div>
  );
}
