"use client";

import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import type { RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useRoomQueuePanel } from "../hooks/useRoomQueuePanel";
import RoomQueuePanelView from "./RoomQueuePanelView";
import styles from "./RoomQueuePanel.module.css";

type Props = {
  currentEntry?: PlaylistEntry | null;
  currentUser: User | null;
  isCurrentUserLoading: boolean;
  roomMeta: RoomMeta | null;
  roomAccessToken: string;
  roomSlug: string;
};

export default function RoomQueuePanel({
  currentEntry,
  currentUser,
  isCurrentUserLoading,
  roomMeta,
  roomAccessToken,
  roomSlug,
}: Props) {
  return (
    <QueryBoundary
      fallback={
        <div className={styles.root}>
          <div className={styles.listArea}>
            <div className={styles.state}>
              <LoadingSpinner ariaLabel="플레이리스트 로딩 중" />
            </div>
          </div>
        </div>
      }
      errorTitle="플레이리스트를 불러오지 못했습니다."
      resetKeys={[roomSlug]}
    >
      <RoomQueuePanelContent
        currentEntry={currentEntry}
        currentUser={currentUser}
        isCurrentUserLoading={isCurrentUserLoading}
        roomMeta={roomMeta}
        roomAccessToken={roomAccessToken}
        roomSlug={roomSlug}
      />
    </QueryBoundary>
  );
}

function RoomQueuePanelContent({
  currentEntry,
  currentUser,
  isCurrentUserLoading,
  roomMeta,
  roomAccessToken,
  roomSlug,
}: Props) {
  const queuePanel = useRoomQueuePanel({
    currentEntry,
    currentUser,
    isCurrentUserLoading,
    roomMeta,
    roomAccessToken,
    roomSlug,
  });

  return (
    <RoomQueuePanelView
      activeTab={queuePanel.activeTab}
      allEntries={queuePanel.allEntries}
      allPendingCount={queuePanel.allPendingCount}
      canDeleteEntry={queuePanel.canDeleteEntry}
      canDeleteEntryAsOwner={queuePanel.canDeleteEntryAsOwner}
      currentEntry={queuePanel.currentEntry}
      emptyMessage={queuePanel.emptyMessage}
      hasNextHistoryPage={queuePanel.hasNextHistoryPage}
      hasNextAllQueuePage={queuePanel.hasNextAllQueuePage}
      hasNextMyQueuePage={queuePanel.hasNextMyQueuePage}
      historyEntries={queuePanel.historyEntries}
      historyErrorMessage={queuePanel.historyErrorMessage}
      includesLatestHistoryPage={queuePanel.includesLatestHistoryPage}
      isDeleteMyPending={queuePanel.deleteMyQueueEntry.isPending}
      isDeleteRoomPending={queuePanel.deleteRoomQueueEntries.isPending}
      isEmptyLoading={queuePanel.isEmptyLoading}
      isCurrentUserEntry={queuePanel.isCurrentUserEntry}
      isMoveMyPending={queuePanel.moveMyQueueEntry.isPending}
      isMoveRoomPending={queuePanel.moveRoomQueueEntry.isPending}
      isOwner={queuePanel.isOwner}
      isRefetching={queuePanel.isRefetching}
      isFetchingNextHistoryPage={queuePanel.isFetchingNextHistoryPage}
      isFetchingNextAllQueuePage={queuePanel.isFetchingNextAllQueuePage}
      isFetchingNextMyQueuePage={queuePanel.isFetchingNextMyQueuePage}
      isHistoryLoading={queuePanel.isHistoryLoading}
      isQueueLoading={queuePanel.isQueueLoading}
      myEntries={queuePanel.myEntries}
      myPendingCount={queuePanel.myPendingCount}
      queueErrorMessage={queuePanel.queueErrorMessage}
      roomAccessToken={roomAccessToken}
      roomSlug={roomSlug}
      onChangeTab={queuePanel.setActiveTab}
      onDeleteMyEntry={queuePanel.handleDeleteMyEntry}
      onDeleteRoomEntry={queuePanel.handleDeleteRoomEntry}
      onMoveMyEntry={queuePanel.handleMoveMyEntry}
      onMoveRoomEntry={queuePanel.handleMoveRoomEntry}
      onLoadMoreHistory={queuePanel.loadNextHistoryPage}
      onLoadMoreAllQueue={queuePanel.loadNextAllQueuePage}
      onLoadMoreMyQueue={queuePanel.loadNextMyQueuePage}
      onResetHistoryToLatest={queuePanel.resetHistoryToLatestPage}
      onRetryHistory={queuePanel.retryHistory}
      onRetryQueue={queuePanel.retryQueue}
    />
  );
}
