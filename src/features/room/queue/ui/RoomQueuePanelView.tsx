"use client";

import { useMemo, useState } from "react";
import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import type {
  PlaylistEntry,
  RoomQueueHistoryEntry,
} from "@/src/features/playlist/model/types";
import type { QueueTab } from "../model/roomQueue";
import RoomQueueListSection from "./RoomQueueListSection";
import RoomQueueTabs from "./RoomQueueTabs";
import { useQueueBidirectionalScroll } from "./useQueueBidirectionalScroll";
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
  currentEntry?: PlaylistEntry | null;
  emptyMessage: string;
  hasNextHistoryPage: boolean;
  hasNextAllQueuePage: boolean;
  hasNextMyQueuePage: boolean;
  historyEntries: RoomQueueHistoryEntry[];
  historyErrorMessage: string;
  includesLatestHistoryPage: boolean;
  isDeleteMyPending: boolean;
  isDeleteRoomPending: boolean;
  isEmptyLoading: boolean;
  isAutomaticReplayActive: boolean;
  isCurrentUserEntry: (entry: PlaylistEntry) => boolean;
  isMoveMyPending: boolean;
  isMoveRoomPending: boolean;
  isOwner: boolean;
  isRefetching: boolean;
  isFetchingNextHistoryPage: boolean;
  isFetchingNextAllQueuePage: boolean;
  isFetchingNextMyQueuePage: boolean;
  isHistoryLoading: boolean;
  isQueueLoading: boolean;
  myEntries: PlaylistEntry[];
  myPendingCount: number | null;
  queueErrorMessage: string;
  roomAccessToken: string;
  roomSlug: string;
  onChangeTab: (tab: QueueTab) => void;
  onDeleteMyEntry: (entryId: string) => void;
  onDeleteRoomEntry: (entryId: string) => void;
  onMoveMyEntry: (payload: MovePayload) => Promise<void>;
  onMoveRoomEntry: (payload: MovePayload) => Promise<void>;
  onLoadMoreHistory: () => unknown;
  onLoadMoreAllQueue: () => unknown;
  onLoadMoreMyQueue: () => unknown;
  onResetHistoryToLatest: () => unknown;
  onRetryHistory: () => unknown;
  onRetryQueue: () => unknown;
};

export default function RoomQueuePanelView({
  activeTab,
  allEntries,
  allPendingCount,
  canDeleteEntry,
  canDeleteEntryAsOwner,
  currentEntry,
  emptyMessage,
  hasNextHistoryPage,
  hasNextAllQueuePage,
  hasNextMyQueuePage,
  historyEntries,
  historyErrorMessage,
  includesLatestHistoryPage,
  isDeleteMyPending,
  isDeleteRoomPending,
  isEmptyLoading,
  isAutomaticReplayActive,
  isCurrentUserEntry,
  isMoveMyPending,
  isMoveRoomPending,
  isOwner,
  isRefetching,
  isFetchingNextHistoryPage,
  isFetchingNextAllQueuePage,
  isFetchingNextMyQueuePage,
  isHistoryLoading,
  isQueueLoading,
  myEntries,
  myPendingCount,
  queueErrorMessage,
  roomAccessToken,
  roomSlug,
  onChangeTab,
  onDeleteMyEntry,
  onDeleteRoomEntry,
  onMoveMyEntry,
  onMoveRoomEntry,
  onLoadMoreHistory,
  onLoadMoreAllQueue,
  onLoadMoreMyQueue,
  onResetHistoryToLatest,
  onRetryHistory,
  onRetryQueue,
}: RoomQueuePanelViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const historyEntryIds = useMemo(
    () => historyEntries.map((entry) => entry.id),
    [historyEntries],
  );
  const visibleQueueEntries =
    activeTab === "all" ? allEntries : myEntries;
  const queueEntryIds = useMemo(
    () => visibleQueueEntries.map((entry) => entry.entryId),
    [visibleQueueEntries],
  );
  const shouldCenterAutomaticReplay =
    isAutomaticReplayActive &&
    !currentEntry &&
    historyEntries.length === 0 &&
    visibleQueueEntries.length === 0;
  const hasNextQueuePage =
    activeTab === "all" ? hasNextAllQueuePage : hasNextMyQueuePage;
  const isFetchingNextQueuePage =
    activeTab === "all"
      ? isFetchingNextAllQueuePage
      : isFetchingNextMyQueuePage;
  const loadNextQueuePage =
    activeTab === "all" ? onLoadMoreAllQueue : onLoadMoreMyQueue;
  const isMutationPending =
    isMoveMyPending ||
    isMoveRoomPending ||
    isDeleteMyPending ||
    isDeleteRoomPending;
  const {
    handleReturnToCurrent,
    handleRetryHistory,
    handleScroll,
    handleWheel,
    scrollContainerRef,
  } = useQueueBidirectionalScroll({
    activeTab,
    currentEntryId: currentEntry?.entryId ?? null,
    hasHistoryError: Boolean(historyErrorMessage),
    hasNextHistoryPage,
    hasNextQueuePage,
    hasQueueError: Boolean(queueErrorMessage),
    historyEntryIds,
    isFetchingHistory: isFetchingNextHistoryPage || isHistoryLoading,
    isFetchingQueue: isFetchingNextQueuePage || isQueueLoading,
    isInteractionBusy: isDragging || isMutationPending || isRefetching,
    onLoadNextHistoryPage: onLoadMoreHistory,
    onLoadNextQueuePage: loadNextQueuePage,
    onResetHistoryToLatestPage: onResetHistoryToLatest,
    onRetryHistoryPage: onRetryHistory,
    queueEntryIds,
  });

  return (
    <div className={styles.root}>
      <RoomQueueTabs
        activeTab={activeTab}
        allCount={allPendingCount}
        myCount={myPendingCount}
        onChange={onChangeTab}
      />
      <div
        ref={scrollContainerRef}
        className={styles.listArea}
        data-center-automatic-replay={shouldCenterAutomaticReplay}
        data-queue-scroll-container
        aria-label="재생목록"
        tabIndex={0}
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {historyErrorMessage ? (
          <div className={styles.directionError} role="alert">
            <span>{historyErrorMessage}</span>
            <button
              type="button"
              className={styles.retryButton}
              onClick={handleRetryHistory}
            >
              지난 곡 다시 시도
            </button>
          </div>
        ) : isHistoryLoading || isFetchingNextHistoryPage ? (
          <div className={styles.directionState} role="status">
            <LoadingSpinner ariaLabel="지난 곡 불러오는 중" size={16} />
          </div>
        ) : null}
        <RoomQueueListSection
          activeTab={activeTab}
          allEntries={allEntries}
          canDeleteEntry={canDeleteEntry}
          canDeleteEntryAsOwner={canDeleteEntryAsOwner}
          currentEntry={currentEntry}
          emptyMessage={emptyMessage}
          isEmptyLoading={isEmptyLoading}
          isAutomaticReplayActive={isAutomaticReplayActive}
          isCurrentUserEntry={isCurrentUserEntry}
          isDeleteMyPending={isDeleteMyPending}
          isDeleteRoomPending={isDeleteRoomPending}
          isTimelineLoading={isHistoryLoading || isQueueLoading}
          isMoveMyPending={isMoveMyPending}
          isMoveRoomPending={isMoveRoomPending}
          isOwner={isOwner}
          hasNextAllQueuePage={hasNextAllQueuePage}
          hasNextMyQueuePage={hasNextMyQueuePage}
          historyEntries={historyEntries}
          includesLatestHistoryPage={includesLatestHistoryPage}
          myEntries={myEntries}
          onDeleteMyEntry={onDeleteMyEntry}
          onDeleteRoomEntry={onDeleteRoomEntry}
          onDragStateChange={setIsDragging}
          onMoveMyEntry={onMoveMyEntry}
          onMoveRoomEntry={onMoveRoomEntry}
          onReturnToCurrent={handleReturnToCurrent}
        />
        {queueErrorMessage ? (
          <div className={styles.directionError} role="alert">
            <span>{queueErrorMessage}</span>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => void onRetryQueue()}
            >
              {activeTab === "all"
                ? "대기곡 다시 시도"
                : "내 신청곡 다시 시도"}
            </button>
          </div>
        ) : isQueueLoading || isFetchingNextQueuePage ? (
          <div className={styles.directionState} role="status">
            <LoadingSpinner
              ariaLabel={
                activeTab === "all"
                  ? "대기곡 불러오는 중"
                  : "내 신청곡 불러오는 중"
              }
              size={16}
            />
          </div>
        ) : null}
        <div data-queue-content-end aria-hidden="true" />
        <div
          className={styles.scrollTail}
          data-queue-tail-spacer
          aria-hidden="true"
        />
      </div>
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
      <div className={styles.addTrackDock}>
        <AddTrackAction
          roomAccessToken={roomAccessToken}
          slug={roomSlug}
          variant="queueDock"
        />
      </div>
    </div>
  );
}
