"use client";

import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import type { QueueTab } from "../model/roomQueue";
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
  errorMessage?: string;
  isDeleteMyPending: boolean;
  isDeleteRoomPending: boolean;
  isLoading: boolean;
  isMoveMyPending: boolean;
  isMoveRoomPending: boolean;
  isOwner: boolean;
  myEntries: PlaylistEntry[];
  onDeleteMyEntry: (entryId: string) => void;
  onDeleteRoomEntry: (entryId: string) => void;
  onMoveMyEntry: (payload: MovePayload) => void;
  onMoveRoomEntry: (payload: MovePayload) => void;
};

export default function RoomQueueListSection({
  activeTab,
  allEntries,
  canDeleteEntry,
  canDeleteEntryAsOwner,
  emptyMessage,
  errorMessage,
  isDeleteMyPending,
  isDeleteRoomPending,
  isLoading,
  isMoveMyPending,
  isMoveRoomPending,
  isOwner,
  myEntries,
  onDeleteMyEntry,
  onDeleteRoomEntry,
  onMoveMyEntry,
  onMoveRoomEntry,
}: RoomQueueListSectionProps) {
  if (activeTab === "mine") {
    return (
      <RoomQueueSortableList
        canDeleteEntry={canDeleteEntry}
        emptyMessage={emptyMessage}
        entries={myEntries}
        errorMessage={errorMessage}
        isDeletePending={isDeleteMyPending}
        isLoading={isLoading}
        isMovePending={isMoveMyPending}
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
        errorMessage={errorMessage}
        isDeletePending={isDeleteRoomPending}
        isLoading={isLoading}
        isMovePending={isMoveRoomPending}
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
      errorMessage={errorMessage}
      isDeletePending={isDeleteMyPending}
      isLoading={isLoading}
      onDeleteEntry={onDeleteMyEntry}
    />
  );
}
