"use client";

import { useState } from "react";
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

  function requestRoomEntry(room: Room) {
    if (room.slug !== selectedRoomSlug) {
      onSelectRoom(room.slug);
      return;
    }

    if (room.isPrivate) {
      setPasswordRoom(room);
      return;
    }

    router.push(`/room/${encodeURIComponent(room.slug)}`);
  }

  function closePasswordModal() {
    setPasswordRoom(null);
  }

  function completePasswordEntry(room: Room) {
    setPasswordRoom(null);
    router.push(`/room/${encodeURIComponent(room.slug)}`);
  }

  return {
    passwordRoom,
    requestRoomEntry,
    closePasswordModal,
    completePasswordEntry,
  };
}
