"use client";
import { createContext, useContext } from "react";
import { EMPTY_ROOM_NICKNAMES } from "./roomParticipantNicknames";
export const RoomNicknamesContext = createContext(EMPTY_ROOM_NICKNAMES);
export function useRoomNickname(
  userSlug: string | null | undefined,
  fallback: string,
) {
  const names = useContext(RoomNicknamesContext);
  return (userSlug ? names.get(userSlug)?.nickname : undefined) ?? fallback;
}
