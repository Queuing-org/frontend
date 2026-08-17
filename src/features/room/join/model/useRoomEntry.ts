"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Room } from "@/src/features/room/model/types";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import { writeStoredRoomJoinPassword } from "../lib/roomJoinPasswordStorage";
import { useRoomJoinTransition } from "./useRoomJoinTransition";

type UseRoomEntryParams = {
  selectedRoomSlug: string | null;
  onSelectRoom: (roomSlug: string) => void;
};

export function useRoomEntry({
  selectedRoomSlug,
  onSelectRoom,
}: UseRoomEntryParams) {
  const router = useRouter();
  const { notify } = useActionFeedback();
  const [passwordRoom, setPasswordRoom] = useState<Room | null>(null);
  const joinTransition = useRoomJoinTransition({
    handoffOnSuccess: true,
    onJoined: (_result, target) => {
      if (target.password) {
        writeStoredRoomJoinPassword(target.slug, target.password);
      }
      router.push(`/room/${encodeURIComponent(target.slug)}`);
    },
  });

  const notifyJoinError = useCallback((roomSlug: string, error: unknown) => {
    notify({
      dedupeKey: `room-join:${roomSlug}`,
      message:
        error instanceof Error && error.message
          ? error.message
          : "방에 입장할 수 없습니다.",
      tone: "error",
    });
  }, [notify]);

  const requestRoomEntry = useCallback((room: Room) => {
    if (room.slug !== selectedRoomSlug) {
      onSelectRoom(room.slug);
      return;
    }

    if (room.isPrivate) {
      setPasswordRoom(room);
      return;
    }

    void joinTransition.requestJoin({ slug: room.slug }).catch((error) => {
      notifyJoinError(room.slug, error);
    });
  }, [joinTransition, notifyJoinError, onSelectRoom, selectedRoomSlug]);

  const closePasswordModal = useCallback(() => {
    setPasswordRoom(null);
  }, []);

  const submitPasswordEntry = useCallback(async (room: Room, password: string) => {
    const outcome = await joinTransition.requestJoin({
      password,
      slug: room.slug,
    });
    if (outcome.status === "joined" || outcome.status === "conflict") {
      setPasswordRoom(null);
    }
  }, [joinTransition]);

  const requestRoomEntryBySlug = useCallback(
    (roomSlug: string) => joinTransition.requestJoin({ slug: roomSlug }),
    [joinTransition],
  );

  return {
    closePasswordModal,
    confirmConflict: joinTransition.confirmJoin,
    conflict: joinTransition.conflict,
    isJoining: joinTransition.isPending,
    passwordRoom,
    requestRoomEntry,
    requestRoomEntryBySlug,
    returnToCurrentRoom: joinTransition.returnToCurrentRoom,
    submitPasswordEntry,
  };
}
