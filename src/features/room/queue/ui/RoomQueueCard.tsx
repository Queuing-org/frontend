"use client";

import type { ComponentPropsWithoutRef, PointerEvent } from "react";
import { forwardRef } from "react";
import Image from "next/image";
import type { PlaylistEntry } from "@/src/entities/playlist/model/types";
import { formatQueueDuration } from "../model/roomQueue";
import styles from "./RoomQueueCard.module.css";

type Props = {
  dragActivatorProps?: ComponentPropsWithoutRef<"li">;
  entry: PlaylistEntry;
  isDeletePending?: boolean;
  onDelete?: (entryId: string) => void;
  showDeleteButton?: boolean;
} & ComponentPropsWithoutRef<"li">;

const RoomQueueCard = forwardRef<HTMLLIElement, Props>(function RoomQueueCard(
  {
    className,
    dragActivatorProps,
    entry,
    isDeletePending = false,
    onDelete,
    showDeleteButton = false,
    ...props
  },
  ref,
) {
  const hasDeleteButton = showDeleteButton && Boolean(onDelete);
  const {
    className: dragActivatorClassName,
    ...safeDragActivatorProps
  } = dragActivatorProps ?? {};

  const handleDeletePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <li
      ref={ref}
      {...safeDragActivatorProps}
      className={[styles.item, dragActivatorClassName, className]
        .filter(Boolean)
        .join(" ")}
      data-active={entry.status.isActive}
      data-has-delete={hasDeleteButton}
      {...props}
    >
      <div className={styles.thumbnailWrap}>
        <Image
          src={entry.track.thumbnailUrl}
          alt={`${entry.track.title} thumbnail`}
          fill
          sizes="72px"
          unoptimized
          draggable={false}
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
      <div className={styles.actions}>
        {hasDeleteButton && onDelete ? (
          <button
            type="button"
            className={styles.deleteButton}
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(entry.entryId);
            }}
            onPointerDown={handleDeletePointerDown}
            disabled={isDeletePending}
            aria-label={`${entry.track.title} 삭제`}
          >
            <Image
              src="/icons/trash.svg"
              alt=""
              width={14}
              height={14}
              draggable={false}
              className={styles.deleteIcon}
            />
          </button>
        ) : null}
      </div>
    </li>
  );
});

export default RoomQueueCard;
