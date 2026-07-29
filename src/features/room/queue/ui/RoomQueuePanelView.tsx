"use client";

import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import type {
  PlaylistEntry,
  RoomHistoryEntry,
} from "@/src/features/playlist/model/types";
import type { QueueTab } from "../model/roomQueue";
import RoomQueueListSection from "./RoomQueueListSection";
import RoomQueueTabs from "./RoomQueueTabs";
import RoomHistoryList from "./RoomHistoryList";
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
  hasNextHistoryPage: boolean;
  historyEntries: RoomHistoryEntry[];
  historyErrorMessage: string;
  isDeleteMyPending: boolean;
  isDeleteRoomPending: boolean;
  isMoveMyPending: boolean;
  isMoveRoomPending: boolean;
  isOwner: boolean;
  isRefetching: boolean;
  isFetchingNextHistoryPage: boolean;
  moveErrorMessage: string;
  myEntries: PlaylistEntry[];
  roomPassword?: string | null;
  roomSlug: string;
  onChangeTab: (tab: QueueTab) => void;
  onDeleteMyEntry: (entryId: string) => void;
  onDeleteRoomEntry: (entryId: string) => void;
  onMoveMyEntry: (payload: MovePayload) => void;
  onMoveRoomEntry: (payload: MovePayload) => void;
  onLoadMoreHistory: () => void;
};

export default function RoomQueuePanelView({
  activeTab,
  allEntries,
  canDeleteEntry,
  canDeleteEntryAsOwner,
  deleteErrorMessage,
  emptyMessage,
  hasNextHistoryPage,
  historyEntries,
  historyErrorMessage,
  isDeleteMyPending,
  isDeleteRoomPending,
  isMoveMyPending,
  isMoveRoomPending,
  isOwner,
  isRefetching,
  isFetchingNextHistoryPage,
  moveErrorMessage,
  myEntries,
  roomPassword,
  roomSlug,
  onChangeTab,
  onDeleteMyEntry,
  onDeleteRoomEntry,
  onMoveMyEntry,
  onMoveRoomEntry,
  onLoadMoreHistory,
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
        {activeTab === "history" ? (
          <RoomHistoryList
            entries={historyEntries}
            emptyMessage={emptyMessage}
            hasNextPage={hasNextHistoryPage}
            isFetchingNextPage={isFetchingNextHistoryPage}
            onLoadMore={onLoadMoreHistory}
          />
        ) : (
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
        )}
      </div>
      {moveErrorMessage ? (
        <div className={styles.error}>{moveErrorMessage}</div>
      ) : null}
      {deleteErrorMessage ? (
        <div className={styles.error}>{deleteErrorMessage}</div>
      ) : null}
      {historyErrorMessage ? (
        <div className={styles.error}>{historyErrorMessage}</div>
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
      {activeTab !== "history" ? (
        <div className={styles.addTrackDock}>
          <AddTrackAction
            roomPassword={roomPassword}
            slug={roomSlug}
            variant="queueDock"
          />
        </div>
      ) : null}
    </div>
  );
}
