"use client";

import type { PlaylistEntry } from "@/src/entities/playlist/model/types";
import RoomQueueList from "./RoomQueueList";
import styles from "./RoomQueueSortableList.module.css";

type Props = {
  emptyMessage: string;
  entries: PlaylistEntry[];
  errorMessage?: string;
  isLoading?: boolean;
};

export default function RoomQueueSortableList(props: Props) {
  return <RoomQueueList {...props} listClassName={styles.sortableList} />;
}
