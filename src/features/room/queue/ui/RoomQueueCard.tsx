"use client";

import Image from "next/image";
import type { PlaylistEntry } from "@/src/entities/playlist/model/types";
import { formatQueueDuration } from "../model/roomQueue";
import styles from "./RoomQueueCard.module.css";

type Props = {
  entry: PlaylistEntry;
};

export default function RoomQueueCard({ entry }: Props) {
  return (
    <li className={styles.item} data-active={entry.status.isActive}>
      <div className={styles.thumbnailWrap}>
        <Image
          src={entry.track.thumbnailUrl}
          alt={`${entry.track.title} thumbnail`}
          fill
          sizes="72px"
          unoptimized
          className={styles.thumbnail}
        />
        {entry.status.isActive ? (
          <div className={styles.nowPlaying}>PLAY</div>
        ) : null}
      </div>
      <div className={styles.meta}>
        <div className={styles.title}>
          {entry.addedBy.nickname} - {entry.track.title}
        </div>
        <div className={styles.detailRow}>
          <div className={styles.story}>사연이 나옵니다.</div>
          <div className={styles.duration}>
            {formatQueueDuration(entry.track.durationMs)}
          </div>
        </div>
      </div>
    </li>
  );
}
