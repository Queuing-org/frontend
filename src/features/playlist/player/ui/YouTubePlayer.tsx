"use client";

import type { PlaybackStatus } from "@/src/features/room/model/types";
import {
  type LocalSeekRequest,
  useYouTubeIframePlayer,
} from "../hooks/useYouTubeIframePlayer";
import styles from "./YouTubePlayer.module.css";

type YouTubePlayerProps = {
  videoId: string | null;
  playbackStatus?: PlaybackStatus | null;
  currentTimeMs?: number | null;
  localSeekRequest?: LocalSeekRequest | null;
  onPlayerReady?: () => void;
  onPlaybackStateChange?: (args: {
    status: PlaybackStatus;
    currentTimeMs: number;
  }) => void;
  playbackKey?: string | null;
};

export default function YouTubePlayer({
  videoId,
  playbackStatus,
  currentTimeMs,
  localSeekRequest,
  onPlayerReady,
  onPlaybackStateChange,
  playbackKey,
}: YouTubePlayerProps) {
  const { playerError, playerMountRef } = useYouTubeIframePlayer({
    currentTimeMs,
    localSeekRequest,
    onPlaybackStateChange,
    onPlayerReady,
    playbackKey,
    playbackStatus,
    playerHostClassName: styles.playerHost,
    videoId,
  });
  const showEmptyState = !videoId;
  const showPlayerFrame = !!videoId;
  const rootClassName = [
    styles.root,
    showPlayerFrame ? styles.rootActive : styles.rootEmpty,
  ].join(" ");
  const playerMountClassName = [
    styles.playerMount,
    showPlayerFrame ? null : styles.playerMountHidden,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div className={styles.frame}>
        <div ref={playerMountRef} className={playerMountClassName} />
        {showEmptyState ? (
          <div className={styles.emptyState}>
            재생할 유튜브 영상이 아직 없습니다.
          </div>
        ) : null}
      </div>
      {videoId && playerError ? (
        <div className={styles.errorPanel}>{playerError}</div>
      ) : null}
    </div>
  );
}
