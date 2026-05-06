"use client";

import Image from "next/image";
import type { CurrentRequesterProfile } from "@/src/features/room/profile/model/types";
import SkipTrackButton from "@/src/features/playlist/skip-track/ui/SkipTrackButton";
import styles from "./CurrentRequesterCard.module.css";

type CurrentRequesterCardProps = {
  durationMs: number | null;
  isOwner: boolean;
  requester: CurrentRequesterProfile;
  roomSlug: string | null;
  trackTitle: string | null;
};

function formatDurationMs(durationMs: number | null) {
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs)) {
    return "-:--";
  }

  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CurrentRequesterCard({
  durationMs,
  isOwner,
  requester,
  roomSlug,
  trackTitle,
}: CurrentRequesterCardProps) {
  const durationText = formatDurationMs(durationMs);

  return (
    <div className={styles.card}>
      <SkipTrackButton className={styles.skipButton} slug={roomSlug} />
      {requester.avatarUrl ? (
        <Image
          src={requester.avatarUrl}
          alt={`${requester.nickname} avatar`}
          width={44}
          height={44}
          unoptimized
          className={styles.avatar}
        />
      ) : (
        <div className={styles.avatarFallback} aria-hidden="true">
          {requester.nickname.slice(0, 1)}
        </div>
      )}
      <div className={styles.meta}>
        <div className={styles.titleRow}>
          <span className={styles.name}>{requester.nickname}</span>
          {isOwner ? (
            <Image
              src="/icons/onwer_black.svg"
              alt="방장"
              width={16}
              height={14}
              className={styles.ownerIcon}
            />
          ) : null}
          {trackTitle ? (
            <>
              <span className={styles.separator}>-</span>
              <span className={styles.trackTitle}>{trackTitle}</span>
            </>
          ) : null}
        </div>
        <div className={styles.descriptionRow}>
          <span className={styles.story}>“사연이 나올 영역입니다.”</span>
          <span className={styles.dot}>·</span>
          <span className={styles.duration}>{durationText}</span>
        </div>
      </div>
    </div>
  );
}
