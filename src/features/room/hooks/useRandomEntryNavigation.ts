"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { useRandomEntryRoom } from "./useRandomEntryRoom";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

function getRandomEntryErrorMessage(error: ApiError) {
  if (error.code === "room.random-join-unavailable") {
    return "입장 가능한 공개방이 없어요";
  }

  return error.message || "랜덤 입장에 실패했습니다.";
}

export function useRandomEntryNavigation() {
  const router = useRouter();
  const randomEntryRoom = useRandomEntryRoom();
  const { notify } = useActionFeedback();
  const requestSequenceRef = useRef(0);

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

        router.push(`/room/${encodeURIComponent(slug)}`);
      },
      onError: (error) => {
        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        notify({
          dedupeKey: "room:random-entry",
          message: getRandomEntryErrorMessage(error),
          tone: error.code === "room.random-join-unavailable" ? "default" : "error",
        });
      },
    });
  }

  return {
    isPending: randomEntryRoom.isPending,
    requestRandomEntry,
  };
}
