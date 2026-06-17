"use client";

import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import type { QueueTab } from "../model/roomQueue";
import RoomQueueListSection from "./RoomQueueListSection";
import RoomQueueTabs from "./RoomQueueTabs";
import styles from "./RoomQueuePanel.module.css";

type MovePayload = {
  movedEntryId: string;
  beforeEntryId: string | null;
  orderedPendingEntryIds: string[];
};

type RoomQueuePanelViewProps = {
  activeTab: QueueTab;
  allEntries: PlaylistEntry[];
  canDeleteEntry: (entry: PlaylistEntry) => boolean;
  canDeleteEntryAsOwner: (entry: PlaylistEntry) => boolean;
  deleteErrorMessage: string;
  emptyMessage: string;
  isDeleteMyPending: boolean;
  isDeleteRoomPending: boolean;
  isMoveMyPending: boolean;
  isMoveRoomPending: boolean;
  isOwner: boolean;
  isRefetching: boolean;
  moveErrorMessage: string;
  myEntries: PlaylistEntry[];
  roomSlug: string;
  onChangeTab: (tab: QueueTab) => void;
  onDeleteMyEntry: (entryId: string) => void;
  onDeleteRoomEntry: (entryId: string) => void;
  onMoveMyEntry: (payload: MovePayload) => void;
  onMoveRoomEntry: (payload: MovePayload) => void;
};

export default function RoomQueuePanelView({
  activeTab,
  allEntries,
  canDeleteEntry,
  canDeleteEntryAsOwner,
  deleteErrorMessage,
  emptyMessage,
  isDeleteMyPending,
  isDeleteRoomPending,
  isMoveMyPending,
  isMoveRoomPending,
  isOwner,
  isRefetching,
  moveErrorMessage,
  myEntries,
  roomSlug,
  onChangeTab,
  onDeleteMyEntry,
  onDeleteRoomEntry,
  onMoveMyEntry,
  onMoveRoomEntry,
}: RoomQueuePanelViewProps) {
  return (
    <div className={styles.root}>
      <RoomQueueTabs
        activeTab={activeTab}
        allCount={allEntries.length}
        myCount={myEntries.length}
        onChange={onChangeTab}
      />
      <div className={styles.listArea}>
        <RoomQueueListSection
          activeTab={activeTab}
          allEntries={allEntries}
          canDeleteEntry={canDeleteEntry}
          canDeleteEntryAsOwner={canDeleteEntryAsOwner}
          emptyMessage={emptyMessage}
          isDeleteMyPending={isDeleteMyPending}
          isDeleteRoomPending={isDeleteRoomPending}
          isMoveMyPending={isMoveMyPending}
          isMoveRoomPending={isMoveRoomPending}
          isOwner={isOwner}
          myEntries={myEntries}
          onDeleteMyEntry={onDeleteMyEntry}
          onDeleteRoomEntry={onDeleteRoomEntry}
          onMoveMyEntry={onMoveMyEntry}
          onMoveRoomEntry={onMoveRoomEntry}
        />
      </div>
      {moveErrorMessage ? (
        <div className={styles.error}>{moveErrorMessage}</div>
      ) : null}
      {deleteErrorMessage ? (
        <div className={styles.error}>{deleteErrorMessage}</div>
      ) : null}
      {isMoveMyPending || isMoveRoomPending ? (
        <div className={styles.refreshing}>큐 순서를 변경하는 중...</div>
      ) : null}
      {isDeleteMyPending || isDeleteRoomPending ? (
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
