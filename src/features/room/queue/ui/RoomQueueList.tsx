"use client";

import { useRef, type ReactNode } from "react";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import RoomQueueCard from "./RoomQueueCard";
import styles from "./RoomQueueList.module.css";
import { useQueueRenderWindow } from "./useQueueRenderWindow";

type Props = {
  canDeleteEntry?: (entry: PlaylistEntry) => boolean;
  emptyMessage: ReactNode;
  entries: PlaylistEntry[];
  highlightEntry?: (entry: PlaylistEntry) => boolean;
  isDeletePending?: boolean;
  listClassName?: string;
  onDeleteEntry?: (entryId: string) => void;
};

export default function RoomQueueList({
  canDeleteEntry,
  emptyMessage,
  entries,
  highlightEntry,
  isDeletePending = false,
  listClassName,
  onDeleteEntry,
}: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  const { endIndex, paddingBottom, paddingTop, startIndex } =
    useQueueRenderWindow(entries.length, listRef);

  if (entries.length === 0) {
    return <div className={styles.state}>{emptyMessage}</div>;
  }

  return (
    <ul
      ref={listRef}
      className={[styles.list, listClassName].filter(Boolean).join(" ")}
    >
      {paddingTop > 0 ? (
        <li
          aria-hidden="true"
          className={styles.virtualSpacer}
          style={{ height: paddingTop }}
        />
      ) : null}
      {entries.slice(startIndex, endIndex).map((entry) => (
        <RoomQueueCard
          key={entry.entryId}
          data-queue-virtual-item="true"
          entry={entry}
          highlighted={highlightEntry?.(entry) ?? false}
          isDeletePending={isDeletePending}
          onDelete={onDeleteEntry}
          showDeleteButton={canDeleteEntry?.(entry) ?? false}
        />
      ))}
      {paddingBottom > 0 ? (
        <li
          aria-hidden="true"
          className={styles.virtualSpacer}
          style={{ height: paddingBottom }}
        />
      ) : null}
    </ul>
  );
}
