"use client";

import { useRef } from "react";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { useRandomEntryRoom } from "./useRandomEntryRoom";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

function getRandomEntryErrorMessage(error: ApiError) {
  if (error.status === 404) {
    return error.message?.trim() || "입장 가능한 공개방이 없어요";
  }

  return error.message || "랜덤 입장에 실패했습니다.";
}

type UseRandomEntryNavigationParams = {
  isRoomEntryPending: boolean;
  requestRoomEntry: (roomSlug: string) => Promise<unknown>;
};

export function useRandomEntryNavigation({
  isRoomEntryPending,
  requestRoomEntry,
}: UseRandomEntryNavigationParams) {
  const randomEntryRoom = useRandomEntryRoom();
  const { notify } = useActionFeedback();
  const requestSequenceRef = useRef(0);

  function showError(error: ApiError) {
    notify({
      dedupeKey: "room:random-entry",
      message: getRandomEntryErrorMessage(error),
      tone: error.status === 404 ? "default" : "error",
    });
  }

  function requestRandomEntry() {
    const requestSequence = ++requestSequenceRef.current;
    randomEntryRoom.mutate(undefined, {
      onSuccess: (room) => {
        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        const slug = normalizeRoomSlug(room.slug);
        if (!slug) {
          notify({
            dedupeKey: "room:random-entry",
            message: "랜덤 입장에 실패했습니다.",
            tone: "error",
          });
          return;
        }

        void requestRoomEntry(slug).catch((error: ApiError) => {
          if (requestSequence === requestSequenceRef.current) {
            showError(error);
          }
        });
      },
      onError: (error) => {
        if (requestSequence === requestSequenceRef.current) {
          showError(error);
        }
      },
    });
  }

  return {
    isPending: randomEntryRoom.isPending || isRoomEntryPending,
    requestRandomEntry,
  };
}
