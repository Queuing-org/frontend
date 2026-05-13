"use client";

import { useEffect } from "react";
import type { Room } from "@/src/entities/room/model/types";

const DEFAULT_LOAD_MORE_THRESHOLD = 3;

type Params = {
  rooms: Room[];
  selectedRoomSlug: string | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  threshold?: number;
};

export function useLoadMoreRoomsNearEnd({
  rooms,
  selectedRoomSlug,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = DEFAULT_LOAD_MORE_THRESHOLD,
}: Params) {
  useEffect(() => {
    if (
      !hasNextPage ||
      isFetchingNextPage ||
      rooms.length === 0 ||
      !selectedRoomSlug
    ) {
      return;
    }

    const selectedIndex = rooms.findIndex(
      (room) => room.slug === selectedRoomSlug,
    );

    if (selectedIndex < 0) {
      return;
    }

    const remainingRoomCount = rooms.length - selectedIndex - 1;

    if (remainingRoomCount >= threshold) {
      return;
    }

    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    rooms,
    selectedRoomSlug,
    threshold,
  ]);
}
