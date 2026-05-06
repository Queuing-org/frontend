"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Room } from "@/src/entities/room/model/types";

type UseRoomEntryParams = {
  selectedRoomSlug: string | null;
  onSelectRoom: (roomSlug: string) => void;
};

export function useRoomEntry({
  selectedRoomSlug,
  onSelectRoom,
}: UseRoomEntryParams) {
  const router = useRouter();
  const [passwordRoom, setPasswordRoom] = useState<Room | null>(null);

  const requestRoomEntry = useCallback((room: Room) => {
    if (room.slug !== selectedRoomSlug) {
      onSelectRoom(room.slug);
      return;
    }

    if (room.isPrivate) {
      setPasswordRoom(room);
      return;
    }

    router.push(`/room/${encodeURIComponent(room.slug)}`);
  }, [onSelectRoom, router, selectedRoomSlug]);

  const closePasswordModal = useCallback(() => {
    setPasswordRoom(null);
  }, []);

  const completePasswordEntry = useCallback((room: Room) => {
    setPasswordRoom(null);
    router.push(`/room/${encodeURIComponent(room.slug)}`);
  }, [router]);

  return {
    passwordRoom,
    requestRoomEntry,
    closePasswordModal,
    completePasswordEntry,
  };
}
