"use client";

import { useState } from "react";
import { useRoomQueue } from "@/src/features/playlist/model/useRoomQueue";
import { useMyRoomQueue } from "@/src/features/playlist/model/useMyRoomQueue";
import { useRoomHistory } from "@/src/features/playlist/model/useRoomHistory";
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
  const { data: entries, isRefetching: isAllRefetching } = useRoomQueue(
    roomSlug,
    roomPassword,
  );
  const {
    data: myQueueEntries = [],
    isLoading: isMyQueueLoading,
    isRefetching: isMyRefetching,
  } = useMyRoomQueue(roomSlug, roomPassword, Boolean(currentUser));
  const historyQuery = useRoomHistory(
    roomSlug,
    roomPassword,
    activeTab === "history",
  );
  const moveMyQueueEntry = useMoveMyQueueEntry();
  const moveRoomQueueEntry = useMoveRoomQueueEntry();
  const deleteMyQueueEntry = useDeleteMyQueueEntry();
  const deleteRoomQueueEntries = useDeleteRoomQueueEntries();

  const allEntries = entries;
  const isOwner = isRoomOwner(roomMeta?.owner, currentUser);
  const myEntries = myQueueEntries;
  const canDeleteEntry = (entry: PlaylistEntry) =>
    isPendingQueueEntry(entry) && isEntryRequestedByUser(entry, currentUser);
  const canDeleteEntryAsOwner = (entry: PlaylistEntry) =>
    isPendingQueueEntry(entry);

  let emptyMessage = "플레이리스트가 아직 비어 있습니다.";
  if (activeTab === "mine") {
    if (isCurrentUserLoading) {
      emptyMessage = "내 신청곡 정보를 확인하는 중입니다.";
    } else if (isMyQueueLoading) {
      emptyMessage = "내 신청곡을 불러오는 중입니다.";
    } else if (!currentUser) {
      emptyMessage = "내 신청곡을 확인할 수 없습니다.";
    } else {
      emptyMessage = "내가 신청한 곡이 아직 없습니다.";
    }
  } else if (activeTab === "history") {
    emptyMessage = "아직 지난 곡이 없습니다.";
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
    handleDeleteMyEntry,
    handleDeleteRoomEntry,
    handleMoveMyEntry,
    handleMoveRoomEntry,
    hasNextHistoryPage: historyQuery.hasNextPage,
    historyEntries:
      historyQuery.data?.flatMap((page) => page.items) ?? [],
    historyErrorMessage: historyQuery.error?.message ?? "",
    isFetchingNextHistoryPage: historyQuery.isFetchingNextPage,
    isOwner,
    isRefetching: isAllRefetching || isMyRefetching,
    moveErrorMessage,
    moveMyQueueEntry,
    moveRoomQueueEntry,
    myEntries,
    loadNextHistoryPage: () => {
      void historyQuery.fetchNextPage();
    },
    setActiveTab,
  };
}
