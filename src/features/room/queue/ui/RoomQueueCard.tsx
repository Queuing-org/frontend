"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import { forwardRef } from "react";
import Image from "next/image";
import type { PlaylistEntry } from "@/src/entities/playlist/model/types";
import { formatQueueDuration } from "../model/roomQueue";
import styles from "./RoomQueueCard.module.css";

type Props = {
  dragHandleProps?: Omit<ComponentPropsWithoutRef<"button">, "children">;
  dragHandleRef?: Ref<HTMLButtonElement>;
  entry: PlaylistEntry;
  showDragHandle?: boolean;
} & ComponentPropsWithoutRef<"li">;

const RoomQueueCard = forwardRef<HTMLLIElement, Props>(function RoomQueueCard(
  { className, dragHandleProps, dragHandleRef, entry, showDragHandle = false, ...props },
  ref,
) {
  return (
    <li
      ref={ref}
      className={[styles.item, className].filter(Boolean).join(" ")}
      data-active={entry.status.isActive}
      {...props}
    >
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
      {showDragHandle ? (
        <button
          ref={dragHandleRef}
          type="button"
          className={[
            styles.dragHandle,
            dragHandleProps?.className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="곡 순서 변경"
          {...dragHandleProps}
        >
          <span className={styles.dragHandleIcon} aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
});

export default RoomQueueCard;
