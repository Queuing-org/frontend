"use client";

import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import RoomQueueCard from "./RoomQueueCard";
import styles from "./RoomQueueList.module.css";

type Props = {
  canDeleteEntry?: (entry: PlaylistEntry) => boolean;
  emptyMessage: string;
  entries: PlaylistEntry[];
  isDeletePending?: boolean;
  listClassName?: string;
  onDeleteEntry?: (entryId: string) => void;
};

export default function RoomQueueList({
  canDeleteEntry,
  emptyMessage,
  entries,
  isDeletePending = false,
  listClassName,
  onDeleteEntry,
}: Props) {
  if (entries.length === 0) {
    return <div className={styles.state}>{emptyMessage}</div>;
  }

  return (
    <ul className={[styles.list, listClassName].filter(Boolean).join(" ")}>
      {entries.map((entry) => (
        <RoomQueueCard
          key={entry.entryId}
          entry={entry}
          isDeletePending={isDeletePending}
          onDelete={onDeleteEntry}
          showDeleteButton={canDeleteEntry?.(entry) ?? false}
        />
      ))}
    </ul>
  );
}
