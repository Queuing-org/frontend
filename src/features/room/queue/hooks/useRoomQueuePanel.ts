"use client";

import { useCallback, useMemo, useState } from "react";
import { ApiError } from "@/src/shared/api/api-error";
import { useRoomQueue } from "@/src/features/playlist/model/useRoomQueue";
import { useMyRoomQueue } from "@/src/features/playlist/model/useMyRoomQueue";
import { useRoomQueueHistory } from "@/src/features/playlist/model/useRoomQueueHistory";
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
  getPendingPersonalQueueEntryIds,
  isHistoryEntryRequestedByUser,
  isPendingQueueEntry,
  isValidPersonalQueueMove,
  type QueueTab,
} from "../model/roomQueue";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

type UseRoomQueuePanelParams = {
  currentEntry?: PlaylistEntry | null;
  currentUser: User | null;
  isCurrentUserLoading: boolean;
  roomMeta: RoomMeta | null;
  roomAccessToken: string;
  roomSlug: string;
};

type MovePayload = {
  movedEntryId: string;
  beforeEntryId: string | null;
  orderedPendingEntryIds: string[];
};

function getQueueErrorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    error.code === "room.queue-update-conflict"
  ) {
    return "";
  }

  return error instanceof Error ? error.message : "";
}

export function useRoomQueuePanel({
  currentEntry,
  currentUser,
  isCurrentUserLoading,
  roomMeta,
  roomAccessToken,
  roomSlug,
}: UseRoomQueuePanelParams) {
  const [activeTab, setActiveTab] = useState<QueueTab>("all");
  const { notify } = useActionFeedback();
  const allQueueQuery = useRoomQueue(roomSlug, roomAccessToken);
  const isHistoryEnabled = activeTab === "all" || Boolean(currentUser);
  const historyQuery = useRoomQueueHistory(
    roomSlug,
    roomAccessToken,
    isHistoryEnabled,
  );
  const {
    data: myQueueData,
    error: myQueueError,
    fetchNextQueuePage: fetchNextMyQueuePage,
    hasNextPage: hasNextMyQueuePage,
    isFetchNextPageError: isMyQueueLoadMoreError,
    isFetchingNextPage: isFetchingNextMyQueuePage,
    isLoading: isMyQueueLoading,
    isRefetching: isMyRefetching,
    refetch: refetchMyQueue,
  } = useMyRoomQueue(
    roomSlug,
    roomAccessToken,
    Boolean(currentUser),
  );
  const moveMyQueueEntry = useMoveMyQueueEntry();
  const moveRoomQueueEntry = useMoveRoomQueueEntry();
  const deleteMyQueueEntry = useDeleteMyQueueEntry();
  const deleteRoomQueueEntries = useDeleteRoomQueueEntries();

  const queueErrorMessage =
    activeTab === "all"
      ? getQueueErrorMessage(allQueueQuery.error)
      : getQueueErrorMessage(myQueueError);

  const allEntries = useMemo(
    () =>
      allQueueQuery.data?.pages
        .flatMap((page) => page.items)
        .filter((entry) => entry.entryId !== currentEntry?.entryId) ?? [],
    [allQueueQuery.data?.pages, currentEntry?.entryId],
  );
  const allPendingCount =
    allQueueQuery.data?.pages[0]?.totalPendingCount ?? 0;
  const isOwner = isRoomOwner(roomMeta?.owner, currentUser);
  const myEntries = useMemo(
    () => myQueueData?.pages.flatMap((page) => page.items) ?? [],
    [myQueueData?.pages],
  );
  const myPendingCount =
    isCurrentUserLoading || (Boolean(currentUser) && !myQueueData)
      ? null
      : (myQueueData?.pages[0]?.totalPendingCount ?? 0);
  const isCurrentUserEntry = useCallback(
    (entry: PlaylistEntry) => isEntryRequestedByUser(entry, currentUser),
    [currentUser],
  );
  const isAutomaticReplay =
    currentEntry?.status.playbackOrigin === "AUTOMATIC_REPLAY";
  const shouldShowCurrentEntry =
    !isAutomaticReplay &&
    (activeTab === "all" ||
      Boolean(currentEntry && isCurrentUserEntry(currentEntry)));
  const visibleCurrentEntry = shouldShowCurrentEntry ? currentEntry : null;
  const visibleCurrentEntryId = visibleCurrentEntry?.entryId;
  const historyEntries = useMemo(
    () => {
      const tabHistoryEntries = activeTab === "all"
        ? historyQuery.entries
        : historyQuery.entries.filter((entry) =>
            isHistoryEntryRequestedByUser(entry, currentUser),
          );

      return visibleCurrentEntryId
        ? tabHistoryEntries.filter(
            (entry) => entry.entryId !== visibleCurrentEntryId,
          )
        : tabHistoryEntries;
    },
    [activeTab, currentUser, historyQuery.entries, visibleCurrentEntryId],
  );
  const canDeleteEntry = (entry: PlaylistEntry) =>
    isPendingQueueEntry(entry) && isCurrentUserEntry(entry);
  const canDeleteEntryAsOwner = (entry: PlaylistEntry) =>
    isPendingQueueEntry(entry);

  let emptyMessage = "플레이리스트가 아직 비어 있습니다.";
  const isEmptyLoading =
    activeTab === "mine" &&
    (isCurrentUserLoading || isMyQueueLoading || historyQuery.isLoading);
  if (activeTab === "mine") {
    if (!isEmptyLoading && !currentUser) {
      emptyMessage = "내 노래를 확인할 수 없습니다.";
    } else if (!isEmptyLoading) {
      emptyMessage = "내가 신청한 곡이 아직 없습니다.";
    }
  }

  const handleDeleteRoomEntry = (entryId: string) => {
    deleteRoomQueueEntries.mutate(
      {
        entryIds: [entryId],
        accessToken: roomAccessToken,
        slug: roomSlug,
      },
      {
        onError: (deleteError) => {
          notify({
            dedupeKey: `queue-delete:${roomSlug}:${entryId}`,
            message: deleteError.message || "곡을 삭제하지 못했습니다.",
            tone: "error",
          });
        },
      },
    );
  };

  const handleDeleteMyEntry = (entryId: string) => {
    deleteMyQueueEntry.mutate(
      {
        entryId,
        accessToken: roomAccessToken,
        slug: roomSlug,
      },
      {
        onError: (deleteError) => {
          notify({
            dedupeKey: `queue-delete:${roomSlug}:${entryId}`,
            message: deleteError.message || "곡을 삭제하지 못했습니다.",
            tone: "error",
          });
        },
      },
    );
  };

  const handleMoveRoomEntry = async ({
    beforeEntryId,
    movedEntryId,
    orderedPendingEntryIds,
  }: MovePayload) => {
    try {
      await moveRoomQueueEntry.mutateAsync({
        beforeEntryId,
        movedEntryId,
        orderedPendingEntryIds,
        accessToken: roomAccessToken,
        slug: roomSlug,
      });
    } catch (moveError) {
      const isConflict =
        moveError instanceof ApiError &&
        moveError.code === "room.queue-update-conflict";
      notify({
        dedupeKey: `queue-move:${roomSlug}`,
        message: isConflict
          ? "큐가 변경되어 최신 순서로 다시 불러왔습니다."
          : moveError instanceof Error && moveError.message
            ? moveError.message
            : "큐 순서를 변경하지 못했습니다.",
        tone: isConflict ? "default" : "error",
      });
    }
  };

  const handleMoveMyEntry = async ({
    beforeEntryId,
    movedEntryId,
    orderedPendingEntryIds,
  }: MovePayload) => {
    const pendingEntryIds = getPendingPersonalQueueEntryIds(myEntries);
    const pendingEntryIdSet = new Set(pendingEntryIds);
    if (!isValidPersonalQueueMove(
      pendingEntryIdSet,
      movedEntryId,
      beforeEntryId,
    )) {
      return;
    }

    try {
      await moveMyQueueEntry.mutateAsync({
        beforeEntryId,
        movedEntryId,
        orderedPendingEntryIds: orderedPendingEntryIds.filter((entryId) =>
          pendingEntryIdSet.has(entryId),
        ),
        accessToken: roomAccessToken,
        slug: roomSlug,
      });
    } catch (moveError) {
      const isConflict =
        moveError instanceof ApiError &&
        moveError.code === "room.queue-update-conflict";
      notify({
        dedupeKey: `queue-move:${roomSlug}`,
        message: isConflict
          ? "큐가 변경되어 최신 순서로 다시 불러왔습니다."
          : moveError instanceof Error && moveError.message
            ? moveError.message
            : "큐 순서를 변경하지 못했습니다.",
        tone: isConflict ? "default" : "error",
      });
    }
  };

  return {
    activeTab,
    allEntries,
    allPendingCount,
    canDeleteEntry,
    canDeleteEntryAsOwner,
    currentEntry: visibleCurrentEntry,
    deleteMyQueueEntry,
    deleteRoomQueueEntries,
    emptyMessage,
    handleDeleteMyEntry,
    handleDeleteRoomEntry,
    handleMoveMyEntry,
    handleMoveRoomEntry,
    hasNextHistoryPage:
      isHistoryEnabled && Boolean(historyQuery.hasNextPage),
    hasNextAllQueuePage: allQueueQuery.hasNextPage,
    hasNextMyQueuePage,
    historyEntries,
    historyErrorMessage:
      activeTab === "mine" && !currentUser
        ? ""
        : getQueueErrorMessage(historyQuery.error),
    includesLatestHistoryPage:
      !isHistoryEnabled || historyQuery.includesLatestPage,
    isEmptyLoading,
    isAutomaticReplayActive: activeTab === "all" && isAutomaticReplay,
    isCurrentUserEntry,
    isOwner,
    isFetchingNextHistoryPage:
      isHistoryEnabled && historyQuery.isFetchingNextPage,
    isFetchingNextAllQueuePage: allQueueQuery.isFetchingNextPage,
    isFetchingNextMyQueuePage,
    isHistoryLoading: isHistoryEnabled && historyQuery.isLoading,
    isQueueLoading:
      activeTab === "all" ? allQueueQuery.isLoading : isMyQueueLoading,
    isRefetching:
      (allQueueQuery.isRefetching && !allQueueQuery.isFetchingNextPage) ||
      (isHistoryEnabled &&
        historyQuery.isRefetching &&
        !historyQuery.isFetchingNextPage) ||
      (isMyRefetching && !isFetchingNextMyQueuePage),
    moveMyQueueEntry,
    moveRoomQueueEntry,
    myEntries,
    myPendingCount,
    queueErrorMessage,
    loadNextHistoryPage: () =>
      isHistoryEnabled ? historyQuery.fetchNextPage() : undefined,
    loadNextAllQueuePage: () => {
      return allQueueQuery.fetchNextQueuePage();
    },
    loadNextMyQueuePage: () => {
      return fetchNextMyQueuePage();
    },
    resetHistoryToLatestPage: () =>
      isHistoryEnabled ? historyQuery.resetToLatestPage() : undefined,
    retryHistory: () =>
      isHistoryEnabled
        ? historyQuery.isFetchNextPageError
          ? historyQuery.fetchNextPage()
          : historyQuery.refetch()
        : undefined,
    retryQueue: () => {
      if (activeTab === "all") {
        return allQueueQuery.isFetchNextPageError
          ? allQueueQuery.fetchNextQueuePage()
          : allQueueQuery.refetch();
      }

      return isMyQueueLoadMoreError
        ? fetchNextMyQueuePage()
        : refetchMyQueue();
    },
    setActiveTab,
  };
}
