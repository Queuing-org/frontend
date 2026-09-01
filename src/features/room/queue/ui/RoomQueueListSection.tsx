"use client";

import type {
  PlaylistEntry,
  RoomQueueHistoryEntry,
} from "@/src/features/playlist/model/types";
import {
  mergeCurrentEntryWithQueue,
  type QueueTab,
} from "../model/roomQueue";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import RoomQueueHistoryList from "./RoomQueueHistoryList";
import RoomQueueList from "./RoomQueueList";
import RoomQueueSortableList from "./RoomQueueSortableList";
import listStyles from "./RoomQueueList.module.css";
import styles from "./RoomQueueListSection.module.css";

type MovePayload = {
  movedEntryId: string;
  beforeEntryId: string | null;
  orderedPendingEntryIds: string[];
};

type RoomQueueListSectionProps = {
  activeTab: QueueTab;
  allEntries: PlaylistEntry[];
  canDeleteEntry: (entry: PlaylistEntry) => boolean;
  canDeleteEntryAsOwner: (entry: PlaylistEntry) => boolean;
  currentEntry?: PlaylistEntry | null;
  emptyMessage: string;
  isDeleteMyPending: boolean;
  isDeleteRoomPending: boolean;
  isTimelineLoading?: boolean;
  isEmptyLoading: boolean;
  isAutomaticReplayActive: boolean;
  isCurrentUserEntry: (entry: PlaylistEntry) => boolean;
  isMoveMyPending: boolean;
  isMoveRoomPending: boolean;
  isOwner: boolean;
  hasNextAllQueuePage: boolean;
  hasNextMyQueuePage: boolean;
  historyEntries: RoomQueueHistoryEntry[];
  includesLatestHistoryPage: boolean;
  myEntries: PlaylistEntry[];
  onDeleteMyEntry: (entryId: string) => void;
  onDeleteRoomEntry: (entryId: string) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  onMoveMyEntry: (payload: MovePayload) => Promise<void>;
  onMoveRoomEntry: (payload: MovePayload) => Promise<void>;
  onReturnToCurrent: () => void;
};

export default function RoomQueueListSection({
  activeTab,
  allEntries,
  canDeleteEntry,
  canDeleteEntryAsOwner,
  currentEntry,
  emptyMessage,
  isDeleteMyPending,
  isDeleteRoomPending,
  isTimelineLoading = false,
  isEmptyLoading,
  isAutomaticReplayActive,
  isCurrentUserEntry,
  isMoveMyPending,
  isMoveRoomPending,
  isOwner,
  hasNextAllQueuePage,
  hasNextMyQueuePage,
  historyEntries,
  includesLatestHistoryPage,
  myEntries,
  onDeleteMyEntry,
  onDeleteRoomEntry,
  onDragStateChange,
  onMoveMyEntry,
  onMoveRoomEntry,
  onReturnToCurrent,
}: RoomQueueListSectionProps) {
  const isAnyMovePending = isMoveMyPending || isMoveRoomPending;
  const emptyContent = isEmptyLoading ? (
    <LoadingSpinner ariaLabel="내 노래 로딩 중" />
  ) : (
    emptyMessage
  );

  const activeCurrentEntry = currentEntry && !isAutomaticReplayActive
    ? mergeCurrentEntryWithQueue(currentEntry, [])[0]
    : null;
  const pendingEntries = activeTab === "mine" ? myEntries : allEntries;
  const hasTimelineEntries =
    historyEntries.length > 0 ||
    Boolean(activeCurrentEntry) ||
    pendingEntries.length > 0;

  if (!hasTimelineEntries) {
    if (isTimelineLoading) {
      return null;
    }

    return isAutomaticReplayActive ? (
      <AutomaticReplayState fillAvailableSpace />
    ) : (
      <div className={listStyles.state}>{emptyContent}</div>
    );
  }

  const pendingQueue = activeTab === "mine" ? (
    <RoomQueueSortableList
      canDeleteEntry={canDeleteEntry}
      emptyMessage={null}
      entries={myEntries}
      isDeletePending={isDeleteMyPending}
      isMovePending={isAnyMovePending}
      hasUnloadedEntries={hasNextMyQueuePage}
      onDragStateChange={onDragStateChange}
      onDelete={onDeleteMyEntry}
      onMove={onMoveMyEntry}
    />
  ) : isOwner ? (
    <RoomQueueSortableList
      canDeleteEntry={canDeleteEntryAsOwner}
      emptyMessage={null}
      entries={allEntries}
      isDeletePending={isDeleteRoomPending}
      isMovePending={isAnyMovePending}
      hasUnloadedEntries={hasNextAllQueuePage}
      highlightEntry={isCurrentUserEntry}
      onDragStateChange={onDragStateChange}
      onDelete={onDeleteRoomEntry}
      onMove={onMoveRoomEntry}
    />
  ) : (
    <RoomQueueList
      canDeleteEntry={canDeleteEntry}
      emptyMessage={null}
      entries={allEntries}
      highlightEntry={isCurrentUserEntry}
      isDeletePending={isDeleteMyPending}
      onDeleteEntry={onDeleteMyEntry}
    />
  );

  return (
    <div className={styles.timeline}>
      <RoomQueueHistoryList entries={historyEntries} />
      {!includesLatestHistoryPage && historyEntries.length > 0 ? (
        <div className={styles.discontinuity} role="status">
          <span>최신 재생 기록과 떨어진 구간입니다.</span>
          <button
            type="button"
            className={styles.returnButton}
            onClick={onReturnToCurrent}
          >
            현재 곡으로 돌아가기
          </button>
        </div>
      ) : null}
      <div data-queue-current-boundary aria-hidden="true" />
      {activeCurrentEntry ? (
        <RoomQueueList
          currentAnchorEntryId={activeCurrentEntry.entryId}
          emptyMessage={null}
          entries={[activeCurrentEntry]}
          highlightEntry={isCurrentUserEntry}
        />
      ) : null}
      {isAutomaticReplayActive ? (
        <AutomaticReplayState fillAvailableSpace />
      ) : null}
      {pendingEntries.length > 0 ? pendingQueue : null}
    </div>
  );
}

function AutomaticReplayState({
  fillAvailableSpace = false,
}: {
  fillAvailableSpace?: boolean;
}) {
  return (
    <div
      className={styles.automaticReplayState}
      data-fill-available-space={fillAvailableSpace}
      role="status"
    >
      <span className={styles.automaticReplayIcon} aria-hidden="true">
        <span className={styles.automaticReplayBar} data-bar="first" />
        <span className={styles.automaticReplayBar} data-bar="second" />
        <span className={styles.automaticReplayBar} data-bar="third" />
      </span>
      <span className={styles.automaticReplayMessage}>
        현재 자동 재생 중입니다
      </span>
    </div>
  );
}
