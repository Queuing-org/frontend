"use client";

import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import type { QueueTab } from "../model/roomQueue";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import RoomQueueList from "./RoomQueueList";
import RoomQueueSortableList from "./RoomQueueSortableList";

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
  emptyMessage: string;
  isDeleteMyPending: boolean;
  isDeleteRoomPending: boolean;
  isEmptyLoading: boolean;
  isCurrentUserEntry: (entry: PlaylistEntry) => boolean;
  isMoveMyPending: boolean;
  isMoveRoomPending: boolean;
  isOwner: boolean;
  hasNextAllQueuePage: boolean;
  hasNextMyQueuePage: boolean;
  myEntries: PlaylistEntry[];
  onDeleteMyEntry: (entryId: string) => void;
  onDeleteRoomEntry: (entryId: string) => void;
  onMoveMyEntry: (payload: MovePayload) => Promise<void>;
  onMoveRoomEntry: (payload: MovePayload) => Promise<void>;
};

export default function RoomQueueListSection({
  activeTab,
  allEntries,
  canDeleteEntry,
  canDeleteEntryAsOwner,
  emptyMessage,
  isDeleteMyPending,
  isDeleteRoomPending,
  isEmptyLoading,
  isCurrentUserEntry,
  isMoveMyPending,
  isMoveRoomPending,
  isOwner,
  hasNextAllQueuePage,
  hasNextMyQueuePage,
  myEntries,
  onDeleteMyEntry,
  onDeleteRoomEntry,
  onMoveMyEntry,
  onMoveRoomEntry,
}: RoomQueueListSectionProps) {
  const isAnyMovePending = isMoveMyPending || isMoveRoomPending;
  const emptyContent = isEmptyLoading ? (
    <LoadingSpinner ariaLabel="내 노래 로딩 중" />
  ) : (
    emptyMessage
  );

  if (activeTab === "mine") {
    return (
      <RoomQueueSortableList
        canDeleteEntry={canDeleteEntry}
        emptyMessage={emptyContent}
        entries={myEntries}
        isDeletePending={isDeleteMyPending}
        isMovePending={isAnyMovePending}
        hasUnloadedEntries={hasNextMyQueuePage}
        onDelete={onDeleteMyEntry}
        onMove={onMoveMyEntry}
      />
    );
  }

  if (isOwner) {
    return (
      <RoomQueueSortableList
        canDeleteEntry={canDeleteEntryAsOwner}
        emptyMessage={emptyMessage}
        entries={allEntries}
        isDeletePending={isDeleteRoomPending}
        isMovePending={isAnyMovePending}
        hasUnloadedEntries={hasNextAllQueuePage}
        highlightEntry={isCurrentUserEntry}
        onDelete={onDeleteRoomEntry}
        onMove={onMoveRoomEntry}
      />
    );
  }

  return (
    <RoomQueueList
      canDeleteEntry={canDeleteEntry}
      emptyMessage={emptyMessage}
      entries={allEntries}
      highlightEntry={isCurrentUserEntry}
      isDeletePending={isDeleteMyPending}
      onDeleteEntry={onDeleteMyEntry}
    />
  );
}
