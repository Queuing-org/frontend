"use client";

import type { RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import { useRoomQueuePanel } from "../hooks/useRoomQueuePanel";
import RoomQueuePanelView from "./RoomQueuePanelView";

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
      errorMessage={queuePanel.error ? queuePanel.errorMessage : undefined}
      isDeleteMyPending={queuePanel.deleteMyQueueEntry.isPending}
      isDeleteRoomPending={queuePanel.deleteRoomQueueEntries.isPending}
      isLoading={queuePanel.isLoading}
      isMoveMyPending={queuePanel.moveMyQueueEntry.isPending}
      isMoveRoomPending={queuePanel.moveRoomQueueEntry.isPending}
      isOwner={queuePanel.isOwner}
      isRefetching={queuePanel.isRefetching}
      moveErrorMessage={queuePanel.moveErrorMessage}
      myEntries={queuePanel.myEntries}
      roomSlug={roomSlug}
      onChangeTab={queuePanel.setActiveTab}
      onDeleteMyEntry={queuePanel.handleDeleteMyEntry}
      onDeleteRoomEntry={queuePanel.handleDeleteRoomEntry}
      onMoveMyEntry={queuePanel.handleMoveMyEntry}
      onMoveRoomEntry={queuePanel.handleMoveRoomEntry}
    />
  );
}
