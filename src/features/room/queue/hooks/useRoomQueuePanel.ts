"use client";

import { useState } from "react";
import { useRoomQueue } from "@/src/features/playlist/model/useRoomQueue";
import { useMoveMyQueueEntry } from "@/src/features/playlist/model/useMoveMyQueueEntry";
import { useMoveRoomQueueEntry } from "@/src/features/playlist/model/useMoveRoomQueueEntry";
import { useDeleteMyQueueEntry } from "@/src/features/playlist/model/useDeleteMyQueueEntry";
import { useDeleteRoomQueueEntries } from "@/src/features/playlist/model/useDeleteRoomQueueEntries";
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import type { RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import {
  isEntryRequestedByUser,
  isPendingQueueEntry,
  type QueueTab,
} from "../model/roomQueue";

type UseRoomQueuePanelParams = {
  currentUser: User | null;
  isCurrentUserLoading: boolean;
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
};

type MovePayload = {
  movedEntryId: string;
  beforeEntryId: string | null;
  orderedPendingEntryIds: string[];
};

export function useRoomQueuePanel({
  currentUser,
  isCurrentUserLoading,
  roomMeta,
  roomPassword,
  roomSlug,
}: UseRoomQueuePanelParams) {
  const [activeTab, setActiveTab] = useState<QueueTab>("all");
  const [moveErrorMessage, setMoveErrorMessage] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const {
    data: entries,
    error,
    isLoading,
    isRefetching,
  } = useRoomQueue(roomSlug, roomPassword, 0, 200);
  const moveMyQueueEntry = useMoveMyQueueEntry();
  const moveRoomQueueEntry = useMoveRoomQueueEntry();
  const deleteMyQueueEntry = useDeleteMyQueueEntry();
  const deleteRoomQueueEntries = useDeleteRoomQueueEntries();

  const allEntries = entries ?? [];
  const isOwner = isRoomOwner(roomMeta?.owner, currentUser);
  const myEntries = allEntries.filter((entry) =>
    isEntryRequestedByUser(entry, currentUser),
  );
  const errorMessage = error?.message || "플레이리스트를 불러오지 못했습니다.";
  const canDeleteEntry = (entry: PlaylistEntry) =>
    isPendingQueueEntry(entry) && isEntryRequestedByUser(entry, currentUser);
  const canDeleteEntryAsOwner = (entry: PlaylistEntry) =>
    isPendingQueueEntry(entry);

  let emptyMessage = "플레이리스트가 아직 비어 있습니다.";
  if (activeTab === "mine") {
    if (isCurrentUserLoading) {
      emptyMessage = "내 신청곡 정보를 확인하는 중입니다.";
    } else if (!currentUser) {
      emptyMessage = "내 신청곡을 확인할 수 없습니다.";
    } else {
      emptyMessage = "내가 신청한 곡이 아직 없습니다.";
    }
  }

  const handleDeleteRoomEntry = (entryId: string) => {
    setDeleteErrorMessage("");
    deleteRoomQueueEntries.mutate(
      {
        entryIds: [entryId],
        password: roomPassword,
        slug: roomSlug,
      },
      {
        onError: (deleteError) => {
          setDeleteErrorMessage(
            deleteError.message || "큐 항목을 삭제하지 못했습니다.",
          );
        },
      },
    );
  };

  const handleDeleteMyEntry = (entryId: string) => {
    setDeleteErrorMessage("");
    deleteMyQueueEntry.mutate(
      {
        entryId,
        password: roomPassword,
        slug: roomSlug,
      },
      {
        onError: (deleteError) => {
          setDeleteErrorMessage(
            deleteError.message || "큐 항목을 삭제하지 못했습니다.",
          );
        },
      },
    );
  };

  const handleMoveRoomEntry = ({
    beforeEntryId,
    movedEntryId,
    orderedPendingEntryIds,
  }: MovePayload) => {
    setMoveErrorMessage("");
    moveRoomQueueEntry.mutate(
      {
        beforeEntryId,
        movedEntryId,
        orderedPendingEntryIds,
        password: roomPassword,
        slug: roomSlug,
      },
      {
        onError: (moveError) => {
          setMoveErrorMessage(
            moveError.message || "큐 순서를 변경하지 못했습니다.",
          );
        },
      },
    );
  };

  const handleMoveMyEntry = ({
    beforeEntryId,
    movedEntryId,
    orderedPendingEntryIds,
  }: MovePayload) => {
    setMoveErrorMessage("");
    moveMyQueueEntry.mutate(
      {
        beforeEntryId,
        movedEntryId,
        orderedPendingEntryIds,
        password: roomPassword,
        slug: roomSlug,
      },
      {
        onError: (moveError) => {
          setMoveErrorMessage(
            moveError.message || "큐 순서를 변경하지 못했습니다.",
          );
        },
      },
    );
  };

  return {
    activeTab,
    allEntries,
    canDeleteEntry,
    canDeleteEntryAsOwner,
    deleteErrorMessage,
    deleteMyQueueEntry,
    deleteRoomQueueEntries,
    emptyMessage,
    error,
    errorMessage,
    handleDeleteMyEntry,
    handleDeleteRoomEntry,
    handleMoveMyEntry,
    handleMoveRoomEntry,
    isLoading,
    isOwner,
    isRefetching,
    moveErrorMessage,
    moveMyQueueEntry,
    moveRoomQueueEntry,
    myEntries,
    setActiveTab,
  };
}
