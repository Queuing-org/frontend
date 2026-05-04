"use client";

import { useState } from "react";
import { useRoomQueue } from "@/src/entities/playlist/model/useRoomQueue";
import { useMoveMyQueueEntry } from "@/src/entities/playlist/model/useMoveMyQueueEntry";
import { useMoveRoomQueueEntry } from "@/src/entities/playlist/model/useMoveRoomQueueEntry";
import { useDeleteMyQueueEntry } from "@/src/entities/playlist/model/useDeleteMyQueueEntry";
import { useDeleteRoomQueueEntries } from "@/src/entities/playlist/model/useDeleteRoomQueueEntries";
import type { RoomMeta } from "@/src/entities/room/model/types";
import type { User } from "@/src/entities/user/model/types";
import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import {
  isEntryRequestedByUser,
  isPendingQueueEntry,
  type QueueTab,
} from "../model/roomQueue";
import RoomQueueList from "./RoomQueueList";
import RoomQueueSortableList from "./RoomQueueSortableList";
import RoomQueueTabs from "./RoomQueueTabs";
import styles from "./RoomQueuePanel.module.css";

type Props = {
  currentUser: User | null;
  isCurrentUserLoading: boolean;
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
};

function isRoomOwner(
  roomMeta: RoomMeta | null,
  currentUser: User | null | undefined,
) {
  const owner = roomMeta?.owner;
  if (!owner || !currentUser) {
    return false;
  }

  if (owner.userId != null && currentUser.userId != null) {
    return owner.userId === currentUser.userId;
  }

  return owner.slug === currentUser.slug;
}

export default function RoomQueuePanel({
  currentUser,
  isCurrentUserLoading,
  roomMeta,
  roomPassword,
  roomSlug,
}: Props) {
  const [activeTab, setActiveTab] = useState<QueueTab>("all");
  const [moveErrorMessage, setMoveErrorMessage] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const {
    data: entries,
    error,
    isLoading,
    isRefetching,
  } = useRoomQueue(roomSlug, roomPassword, 0, 200);
  const moveMyQueueEntry = useMoveMyQueueEntry();
  const moveRoomQueueEntry = useMoveRoomQueueEntry();
  const deleteMyQueueEntry = useDeleteMyQueueEntry();
  const deleteRoomQueueEntries = useDeleteRoomQueueEntries();

  const allEntries = entries ?? [];
  const isOwner = isRoomOwner(roomMeta, currentUser);
  const myEntries = allEntries.filter((entry) =>
    isEntryRequestedByUser(entry, currentUser),
  );
  const errorMessage = error?.message || "플레이리스트를 불러오지 못했습니다.";
  const canDeleteEntry = (entry: (typeof allEntries)[number]) =>
    isPendingQueueEntry(entry) && isEntryRequestedByUser(entry, currentUser);
  const canDeleteEntryAsOwner = (entry: (typeof allEntries)[number]) =>
    isPendingQueueEntry(entry);

  const handleDeleteRoomEntry = (entryId: string) => {
    setDeleteErrorMessage("");
    deleteRoomQueueEntries.mutate(
      {
        entryIds: [entryId],
        password: roomPassword,
        slug: roomSlug,
      },
      {
        onError: (deleteError) => {
          setDeleteErrorMessage(
            deleteError.message || "큐 항목을 삭제하지 못했습니다.",
          );
        },
      },
    );
  };

  const handleDeleteMyEntry = (entryId: string) => {
    setDeleteErrorMessage("");
    deleteMyQueueEntry.mutate(
      {
        entryId,
        password: roomPassword,
        slug: roomSlug,
      },
      {
        onError: (deleteError) => {
          setDeleteErrorMessage(
            deleteError.message || "큐 항목을 삭제하지 못했습니다.",
          );
        },
      },
    );
  };

  let emptyMessage = "플레이리스트가 아직 비어 있습니다.";
  if (activeTab === "mine") {
    if (isCurrentUserLoading) {
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
          isOwner ? (
            <RoomQueueSortableList
              canDeleteEntry={canDeleteEntryAsOwner}
              emptyMessage={emptyMessage}
              entries={allEntries}
              errorMessage={error ? errorMessage : undefined}
              isDeletePending={deleteRoomQueueEntries.isPending}
              isLoading={isLoading}
              isMovePending={moveRoomQueueEntry.isPending}
              onDelete={handleDeleteRoomEntry}
              onMove={({
                beforeEntryId,
                movedEntryId,
                orderedPendingEntryIds,
              }) => {
                setMoveErrorMessage("");
                moveRoomQueueEntry.mutate(
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
          ) : (
            <RoomQueueList
              canDeleteEntry={canDeleteEntry}
              emptyMessage={emptyMessage}
              entries={allEntries}
              errorMessage={error ? errorMessage : undefined}
              isDeletePending={deleteMyQueueEntry.isPending}
              isLoading={isLoading}
              onDeleteEntry={handleDeleteMyEntry}
            />
          )
        ) : (
          <RoomQueueSortableList
            canDeleteEntry={canDeleteEntry}
            emptyMessage={emptyMessage}
            entries={myEntries}
            errorMessage={error ? errorMessage : undefined}
            isDeletePending={deleteMyQueueEntry.isPending}
            isLoading={isLoading}
            isMovePending={moveMyQueueEntry.isPending}
            onDelete={handleDeleteMyEntry}
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
      {moveErrorMessage ? (
        <div className={styles.error}>{moveErrorMessage}</div>
      ) : null}
      {deleteErrorMessage ? (
        <div className={styles.error}>{deleteErrorMessage}</div>
      ) : null}
      {moveMyQueueEntry.isPending || moveRoomQueueEntry.isPending ? (
        <div className={styles.refreshing}>큐 순서를 변경하는 중...</div>
      ) : null}
      {deleteMyQueueEntry.isPending || deleteRoomQueueEntries.isPending ? (
        <div className={styles.refreshing}>큐 항목을 삭제하는 중...</div>
      ) : null}
      {isRefetching ? (
        <div className={styles.refreshing}>최신 목록으로 갱신 중...</div>
      ) : null}
      <div className={styles.addTrackDock}>
        <AddTrackAction slug={roomSlug} variant="queueDock" />
      </div>
    </div>
  );
}
