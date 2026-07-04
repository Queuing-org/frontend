"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { useRandomEntryRoom } from "./useRandomEntryRoom";

function getRandomEntryErrorMessage(error: ApiError) {
  if (error.code === "room.random-entry-unavailable" || error.status === 404) {
    return "입장 가능한 공개 방이 없어요.";
  }

  return error.message || "랜덤 입장에 실패했습니다.";
}

export function useRandomEntryNavigation() {
  const router = useRouter();
  const randomEntryRoom = useRandomEntryRoom();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function requestRandomEntry() {
    setErrorMessage(null);
    randomEntryRoom.mutate(undefined, {
      onSuccess: (room) => {
        const slug = normalizeRoomSlug(room.slug);

        if (!slug) {
          setErrorMessage("랜덤 입장에 실패했습니다.");
          return;
        }

        router.push(`/room/${encodeURIComponent(slug)}`);
      },
      onError: (error) => {
        setErrorMessage(getRandomEntryErrorMessage(error));
      },
    });
  }

  return {
    errorMessage,
    isPending: randomEntryRoom.isPending,
    requestRandomEntry,
  };
}
