"use client";

import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
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
  allPendingCount: number;
  canDeleteEntry: (entry: PlaylistEntry) => boolean;
  canDeleteEntryAsOwner: (entry: PlaylistEntry) => boolean;
  emptyMessage: string;
  hasNextAllQueuePage: boolean;
  hasNextMyQueuePage: boolean;
  isDeleteMyPending: boolean;
  isDeleteRoomPending: boolean;
  isEmptyLoading: boolean;
  isCurrentUserEntry: (entry: PlaylistEntry) => boolean;
  isMoveMyPending: boolean;
  isMoveRoomPending: boolean;
  isOwner: boolean;
  isRefetching: boolean;
  isFetchingNextAllQueuePage: boolean;
  isFetchingNextMyQueuePage: boolean;
  myEntries: PlaylistEntry[];
  myPendingCount: number;
  queueErrorMessage: string;
  roomPassword?: string | null;
  roomSlug: string;
  onChangeTab: (tab: QueueTab) => void;
  onDeleteMyEntry: (entryId: string) => void;
  onDeleteRoomEntry: (entryId: string) => void;
  onMoveMyEntry: (payload: MovePayload) => Promise<void>;
  onMoveRoomEntry: (payload: MovePayload) => Promise<void>;
  onLoadMoreAllQueue: () => void;
  onLoadMoreMyQueue: () => void;
};

export default function RoomQueuePanelView({
  activeTab,
  allEntries,
  allPendingCount,
  canDeleteEntry,
  canDeleteEntryAsOwner,
  emptyMessage,
  hasNextAllQueuePage,
  hasNextMyQueuePage,
  isDeleteMyPending,
  isDeleteRoomPending,
  isEmptyLoading,
  isCurrentUserEntry,
  isMoveMyPending,
  isMoveRoomPending,
  isOwner,
  isRefetching,
  isFetchingNextAllQueuePage,
  isFetchingNextMyQueuePage,
  myEntries,
  myPendingCount,
  queueErrorMessage,
  roomPassword,
  roomSlug,
  onChangeTab,
  onDeleteMyEntry,
  onDeleteRoomEntry,
  onMoveMyEntry,
  onMoveRoomEntry,
  onLoadMoreAllQueue,
  onLoadMoreMyQueue,
}: RoomQueuePanelViewProps) {
  return (
    <div className={styles.root}>
      <RoomQueueTabs
        activeTab={activeTab}
        allCount={allPendingCount}
        myCount={myPendingCount}
        onChange={onChangeTab}
      />
      <div
        className={styles.listArea}
        data-queue-scroll-container
        aria-label="재생목록"
        tabIndex={0}
      >
        <RoomQueueListSection
          activeTab={activeTab}
          allEntries={allEntries}
          canDeleteEntry={canDeleteEntry}
          canDeleteEntryAsOwner={canDeleteEntryAsOwner}
          emptyMessage={emptyMessage}
          isEmptyLoading={isEmptyLoading}
          isCurrentUserEntry={isCurrentUserEntry}
          isDeleteMyPending={isDeleteMyPending}
          isDeleteRoomPending={isDeleteRoomPending}
          isMoveMyPending={isMoveMyPending}
          isMoveRoomPending={isMoveRoomPending}
          isOwner={isOwner}
          hasNextAllQueuePage={hasNextAllQueuePage}
          hasNextMyQueuePage={hasNextMyQueuePage}
          myEntries={myEntries}
          onDeleteMyEntry={onDeleteMyEntry}
          onDeleteRoomEntry={onDeleteRoomEntry}
          onMoveMyEntry={onMoveMyEntry}
          onMoveRoomEntry={onMoveRoomEntry}
        />
      </div>
      {queueErrorMessage ? (
        <div className={styles.error}>{queueErrorMessage}</div>
      ) : null}
      {isMoveMyPending || isMoveRoomPending ? (
        <div className={styles.refreshing}>
          <LoadingSpinner ariaLabel="큐 순서 변경 중" size={14} />
        </div>
      ) : null}
      {isDeleteMyPending || isDeleteRoomPending ? (
        <div className={styles.refreshing}>
          <LoadingSpinner ariaLabel="큐 항목 삭제 중" size={14} />
        </div>
      ) : null}
      {isRefetching ? (
        <div className={styles.refreshing}>
          <LoadingSpinner ariaLabel="최신 큐 목록 갱신 중" size={14} />
        </div>
      ) : null}
      {activeTab === "all" && hasNextAllQueuePage ? (
        <button
          type="button"
          className={styles.loadMoreButton}
          disabled={isFetchingNextAllQueuePage}
          onClick={onLoadMoreAllQueue}
        >
          {isFetchingNextAllQueuePage ? (
            <LoadingSpinner ariaLabel="대기곡 더 불러오는 중" size={16} />
          ) : (
            "대기곡 더 보기"
          )}
        </button>
      ) : null}
      {activeTab === "mine" && hasNextMyQueuePage ? (
        <button
          type="button"
          className={styles.loadMoreButton}
          disabled={isFetchingNextMyQueuePage}
          onClick={onLoadMoreMyQueue}
        >
          {isFetchingNextMyQueuePage ? (
            <LoadingSpinner ariaLabel="내 노래 더 불러오는 중" size={16} />
          ) : (
            "내 노래 더 보기"
          )}
        </button>
      ) : null}
      <div className={styles.addTrackDock}>
        <AddTrackAction
          roomPassword={roomPassword}
          slug={roomSlug}
          variant="queueDock"
        />
      </div>
    </div>
  );
}
