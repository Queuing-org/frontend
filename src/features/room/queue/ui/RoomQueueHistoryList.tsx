"use client";

import { useRef } from "react";
import type { RoomQueueHistoryEntry } from "@/src/features/playlist/model/types";
import RoomQueueHistoryCard from "./RoomQueueHistoryCard";
import styles from "./RoomQueueList.module.css";
import { useQueueRenderWindow } from "./useQueueRenderWindow";

type Props = {
  entries: RoomQueueHistoryEntry[];
};

export default function RoomQueueHistoryList({ entries }: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  const { endIndex, paddingBottom, paddingTop, startIndex } =
    useQueueRenderWindow(entries.length, listRef);

  if (entries.length === 0) {
    return null;
  }

  return (
    <ul ref={listRef} className={styles.list} aria-label="지난 곡">
      {paddingTop > 0 ? (
        <li
          aria-hidden="true"
          className={styles.virtualSpacer}
          style={{ height: paddingTop }}
        />
      ) : null}
      {entries.slice(startIndex, endIndex).map((entry) => (
        <RoomQueueHistoryCard key={entry.id} entry={entry} />
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
