"use client";

import type { RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import { useRoomQueuePanel } from "../hooks/useRoomQueuePanel";
import RoomQueuePanelView from "./RoomQueuePanelView";
import styles from "./RoomQueuePanel.module.css";

type Props = {
  currentUser: User | null;
  isCurrentUserLoading: boolean;
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
};

export default function RoomQueuePanel({
  currentUser,
  isCurrentUserLoading,
  roomMeta,
  roomPassword,
  roomSlug,
}: Props) {
  return (
    <QueryBoundary
      fallback={
        <div className={styles.root}>
          <div className={styles.listArea}>
            <div className={styles.state}>
              플레이리스트를 불러오는 중입니다.
            </div>
          </div>
        </div>
      }
      errorTitle="플레이리스트를 불러오지 못했습니다."
      resetKeys={[roomSlug, roomPassword ?? null]}
    >
      <RoomQueuePanelContent
        currentUser={currentUser}
        isCurrentUserLoading={isCurrentUserLoading}
        roomMeta={roomMeta}
        roomPassword={roomPassword}
        roomSlug={roomSlug}
      />
    </QueryBoundary>
  );
}

function RoomQueuePanelContent({
  currentUser,
  isCurrentUserLoading,
  roomMeta,
  roomPassword,
  roomSlug,
}: Props) {
  const queuePanel = useRoomQueuePanel({
    currentUser,
    isCurrentUserLoading,
    roomMeta,
    roomPassword,
    roomSlug,
  });

  return (
    <RoomQueuePanelView
      activeTab={queuePanel.activeTab}
      allEntries={queuePanel.allEntries}
      canDeleteEntry={queuePanel.canDeleteEntry}
      canDeleteEntryAsOwner={queuePanel.canDeleteEntryAsOwner}
      deleteErrorMessage={queuePanel.deleteErrorMessage}
      emptyMessage={queuePanel.emptyMessage}
      isDeleteMyPending={queuePanel.deleteMyQueueEntry.isPending}
      isDeleteRoomPending={queuePanel.deleteRoomQueueEntries.isPending}
      isMoveMyPending={queuePanel.moveMyQueueEntry.isPending}
      isMoveRoomPending={queuePanel.moveRoomQueueEntry.isPending}
      isOwner={queuePanel.isOwner}
      isRefetching={queuePanel.isRefetching}
      moveErrorMessage={queuePanel.moveErrorMessage}
      myEntries={queuePanel.myEntries}
      roomPassword={roomPassword}
      roomSlug={roomSlug}
      onChangeTab={queuePanel.setActiveTab}
      onDeleteMyEntry={queuePanel.handleDeleteMyEntry}
      onDeleteRoomEntry={queuePanel.handleDeleteRoomEntry}
      onMoveMyEntry={queuePanel.handleMoveMyEntry}
      onMoveRoomEntry={queuePanel.handleMoveRoomEntry}
    />
  );
}
