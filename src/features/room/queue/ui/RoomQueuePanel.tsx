"use client";

import { useState } from "react";
import { useRoomQueue } from "@/src/entities/playlist/model/useRoomQueue";
import { useMoveMyQueueEntry } from "@/src/entities/playlist/model/useMoveMyQueueEntry";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { isEntryRequestedByUser, type QueueTab } from "../model/roomQueue";
import RoomQueueList from "./RoomQueueList";
import RoomQueueSortableList from "./RoomQueueSortableList";
import RoomQueueTabs from "./RoomQueueTabs";
import styles from "./RoomQueuePanel.module.css";

type Props = {
  roomPassword?: string | null;
  roomSlug: string;
};

export default function RoomQueuePanel({ roomPassword, roomSlug }: Props) {
  const [activeTab, setActiveTab] = useState<QueueTab>("all");
  const [moveErrorMessage, setMoveErrorMessage] = useState("");
  const { data: currentUser, isLoading: isMeLoading } = useMe();
  const {
    data: entries,
    error,
    isLoading,
    isRefetching,
  } = useRoomQueue(roomSlug, roomPassword, 0, 200);
  const moveMyQueueEntry = useMoveMyQueueEntry();

  const allEntries = entries ?? [];
  const myEntries = allEntries.filter((entry) =>
    isEntryRequestedByUser(entry, currentUser),
  );
  const errorMessage = error?.message || "플레이리스트를 불러오지 못했습니다.";

  let emptyMessage = "플레이리스트가 아직 비어 있습니다.";
  if (activeTab === "mine") {
    if (isMeLoading) {
      emptyMessage = "내 신청곡 정보를 확인하는 중입니다.";
    } else if (!currentUser) {
      emptyMessage = "내 신청곡을 확인할 수 없습니다.";
    } else {
      emptyMessage = "내가 신청한 곡이 아직 없습니다.";
    }
  }

  return (
    <div className={styles.root}>
      <RoomQueueTabs
        activeTab={activeTab}
        allCount={allEntries.length}
        myCount={myEntries.length}
        onChange={setActiveTab}
      />
      <div className={styles.listArea}>
        {activeTab === "all" ? (
          <RoomQueueList
            emptyMessage={emptyMessage}
            entries={allEntries}
            errorMessage={error ? errorMessage : undefined}
            isLoading={isLoading}
          />
        ) : (
          <RoomQueueSortableList
            emptyMessage={emptyMessage}
            entries={myEntries}
            errorMessage={error ? errorMessage : undefined}
            isLoading={isLoading}
            isMovePending={moveMyQueueEntry.isPending}
            onMove={({ beforeEntryId, movedEntryId, orderedPendingEntryIds }) => {
              setMoveErrorMessage("");
              moveMyQueueEntry.mutate(
                {
                  beforeEntryId,
                  movedEntryId,
                  orderedPendingEntryIds,
                  password: roomPassword,
                  slug: roomSlug,
                },
                {
                  onError: (moveError) => {
                    setMoveErrorMessage(
                      moveError.message || "큐 순서를 변경하지 못했습니다.",
                    );
                  },
                },
              );
            }}
          />
        )}
      </div>
      {activeTab === "mine" && moveErrorMessage ? (
        <div className={styles.error}>{moveErrorMessage}</div>
      ) : null}
      {activeTab === "mine" && moveMyQueueEntry.isPending ? (
        <div className={styles.refreshing}>큐 순서를 변경하는 중...</div>
      ) : null}
      {isRefetching ? (
        <div className={styles.refreshing}>최신 목록으로 갱신 중...</div>
      ) : null}
    </div>
  );
}
