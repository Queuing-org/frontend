"use client";

import { useState } from "react";
import Image from "next/image";
import type { RoomQueueHistoryEntry } from "@/src/features/playlist/model/types";
import OverflowMarquee from "@/src/features/room/ui/OverflowMarquee";
import { formatQueueDuration } from "../model/roomQueue";
import styles from "./RoomQueueCard.module.css";

type Props = {
  entry: RoomQueueHistoryEntry;
};

export default function RoomQueueHistoryCard({ entry }: Props) {
  const thumbnailUrl = entry.thumbnailUrl ?? "/Thumbnail.png";
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState<string | null>(
    null,
  );
  const thumbnailSrc =
    failedThumbnailUrl === thumbnailUrl ? "/Thumbnail.png" : thumbnailUrl;

  return (
    <li
      className={styles.item}
      data-history="true"
      data-queue-history-id={entry.id}
      data-queue-history-item="true"
      data-queue-virtual-item="true"
      data-marquee-group
    >
      <div className={styles.thumbnailWrap}>
        <Image
          src={thumbnailSrc}
          alt={`${entry.title} thumbnail`}
          fill
          sizes="72px"
          unoptimized
          draggable={false}
          className={styles.thumbnail}
          onError={() => setFailedThumbnailUrl(thumbnailUrl)}
        />
      </div>
      <div className={styles.meta}>
        <div className={styles.titleRow}>
          <OverflowMarquee
            activation="group-hover"
            className={styles.title}
            contentClassName={styles.titleContent}
            text={entry.title}
          />
        </div>
        <div className={styles.detailRow} data-has-story="false">
          <div className={styles.duration}>
            {formatQueueDuration(entry.durationMs)}
          </div>
        </div>
      </div>
    </li>
  );
}
