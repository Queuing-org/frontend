"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { useRandomEntryRoom } from "./useRandomEntryRoom";

function getRandomEntryErrorMessage(error: ApiError) {
  if (error.code === "room.random-join-unavailable") {
    return "입장 가능한 공개방이 없어요";
  }

  return error.message || "랜덤 입장에 실패했습니다.";
}

export const RANDOM_ENTRY_ERROR_DURATION_MS = 3_000;

export function useRandomEntryNavigation() {
  const router = useRouter();
  const randomEntryRoom = useRandomEntryRoom();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSequenceRef = useRef(0);

  const clearErrorTimer = useCallback(() => {
    if (errorTimerRef.current !== null) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  const showErrorMessage = useCallback(
    (message: string) => {
      clearErrorTimer();
      setErrorMessage(message);
      errorTimerRef.current = setTimeout(() => {
        errorTimerRef.current = null;
        setErrorMessage(null);
      }, RANDOM_ENTRY_ERROR_DURATION_MS);
    },
    [clearErrorTimer],
  );

  useEffect(
    () => () => {
      requestSequenceRef.current += 1;
      clearErrorTimer();
    },
    [clearErrorTimer],
  );

  function requestRandomEntry() {
    const requestSequence = ++requestSequenceRef.current;
    clearErrorTimer();
    setErrorMessage(null);
    randomEntryRoom.mutate(undefined, {
      onSuccess: (room) => {
        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        const slug = normalizeRoomSlug(room.slug);

        if (!slug) {
          showErrorMessage("랜덤 입장에 실패했습니다.");
          return;
        }

        clearErrorTimer();
        setErrorMessage(null);
        router.push(`/room/${encodeURIComponent(slug)}`);
      },
      onError: (error) => {
        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        showErrorMessage(getRandomEntryErrorMessage(error));
      },
    });
  }

  return {
    errorMessage,
    isPending: randomEntryRoom.isPending,
    requestRandomEntry,
  };
}
