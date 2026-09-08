"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createRoomNicknameSession,
  EMPTY_ROOM_NICKNAMES,
} from "../../model/roomParticipantNicknames";

export function useRoomParticipantNicknames(slug: string) {
  const queryClient = useQueryClient();
  const session = useMemo(
    () => createRoomNicknameSession(queryClient, slug),
    [queryClient, slug],
  );
  const nicknames = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    () => EMPTY_ROOM_NICKNAMES,
  );
  useEffect(() => {
    const detach = session.attach();
    return () => {
      detach();
      session.clear();
    };
  }, [session]);
  return {
    nicknames,
    acceptNicknameEvent: session.accept,
    clearNicknames: session.clear,
  };
}
