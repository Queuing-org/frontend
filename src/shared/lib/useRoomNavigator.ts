"use client";

import { useState } from "react";
import type { Room } from "@/src/entities/room/model/types";

export function useRoomNavigator(rooms: Room[]) {
  const [currentRoomSlug, setCurrentRoomSlug] = useState<string | null>(null);

  const currentRoom =
    rooms.find((room) => room.slug === currentRoomSlug) ?? rooms[0] ?? null;

  const selectedRoomSlug = currentRoom?.slug ?? null;

  const currentRoomIndex = currentRoom
    ? rooms.findIndex((room) => room.slug === currentRoom.slug)
    : -1;

  const previousRoom =
    currentRoomIndex > 0 ? rooms[currentRoomIndex - 1] : null;

  const nextRoom =
    currentRoomIndex >= 0 && currentRoomIndex < rooms.length - 1
      ? rooms[currentRoomIndex + 1]
      : null;

  function goPrevious() {
    if (!previousRoom) {
      return;
    }

    setCurrentRoomSlug(previousRoom.slug);
  }

  function goNext() {
    if (!nextRoom) {
      return;
    }

    setCurrentRoomSlug(nextRoom.slug);
  }

  return {
    currentRoom,
    selectedRoomSlug,
    setCurrentRoomSlug,
    previousRoom,
    nextRoom,
    goPrevious,
    goNext,
  };
}
