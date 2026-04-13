"use client";

import type { PlaylistEntry } from "@/src/entities/playlist/model/types";
import RoomQueueCard from "./RoomQueueCard";
import styles from "./RoomQueueList.module.css";

type Props = {
  emptyMessage: string;
  entries: PlaylistEntry[];
  errorMessage?: string;
  isLoading?: boolean;
  listClassName?: string;
};

export default function RoomQueueList({
  emptyMessage,
  entries,
  errorMessage,
  isLoading = false,
  listClassName,
}: Props) {
  if (isLoading) {
    return <div className={styles.state}>플레이리스트를 불러오는 중입니다.</div>;
  }

  if (errorMessage) {
    return <div className={styles.state}>{errorMessage}</div>;
  }

  if (entries.length === 0) {
    return <div className={styles.state}>{emptyMessage}</div>;
  }

  return (
    <ul className={[styles.list, listClassName].filter(Boolean).join(" ")}>
      {entries.map((entry) => (
        <RoomQueueCard key={entry.entryId} entry={entry} />
      ))}
    </ul>
  );
}
