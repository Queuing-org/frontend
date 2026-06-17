"use client";

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import { useRouter } from "next/navigation";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import type {
  PlaybackSyncData,
  WsErrorData,
  WsEvent,
} from "@/src/features/room/model/types";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import { clearStoredRoomJoinPassword } from "@/src/features/room/join/lib/roomJoinPasswordStorage";
import { addSocketListener } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { LivePlaybackState } from "./useRoomPlaybackViewModel";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";

const PARTICIPANT_KICKED_ERROR_CODE = "room.participant-kicked";

function isPlaybackSyncData(data: unknown): data is PlaybackSyncData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<PlaybackSyncData>;

  return (
    typeof candidate.videoId === "string" &&
    ["PLAYING", "PAUSED", "BUFFERING", "ENDED"].includes(
      candidate.status ?? "",
    ) &&
    typeof candidate.currentTime === "number" &&
    typeof candidate.serverTimestamp === "number"
  );
}

function isWsErrorData(data: unknown): data is WsErrorData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<WsErrorData>;

  return (
    typeof candidate.statusCode === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}

type UseRoomRealtimeEventsParams = {
  cleanupChatSubscriptions: () => void;
  refetchRoomState: () => unknown;
  resetChatState: () => void;
  setJoinErrorMessage: (message: string) => void;
  setLivePlaybackStatus: Dispatch<SetStateAction<LivePlaybackState | null>>;
  setStatus: (status: JoinStatus) => void;
  slug: string;
};

export function useRoomRealtimeEvents({
  cleanupChatSubscriptions,
  refetchRoomState,
  resetChatState,
  setJoinErrorMessage,
  setLivePlaybackStatus,
  setStatus,
  slug,
}: UseRoomRealtimeEventsParams) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const roomSubscriptionRef = useRef<{
    password: string | null;
    slug: string;
    subscription: StompSubscription;
  } | null>(null);
  const hasRedirectedAfterKickRef = useRef(false);

  const cleanupRoomSubscription = useCallback(() => {
    if (!roomSubscriptionRef.current) {
      return;
    }

    try {
      roomSubscriptionRef.current.subscription.unsubscribe();
    } catch {
      // The socket may already be closing while the page is leaving.
    }

    roomSubscriptionRef.current = null;
  }, []);

  useEffect(() => {
    hasRedirectedAfterKickRef.current = false;
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    return addSocketListener({
      onStompError: (frame) => {
        if (hasRedirectedAfterKickRef.current || !frame.body) {
          return;
        }

        let errorData: unknown;
        try {
          errorData = JSON.parse(frame.body);
        } catch {
          return;
        }

        if (
          !isWsErrorData(errorData) ||
          errorData.code !== PARTICIPANT_KICKED_ERROR_CODE
        ) {
          return;
        }

        hasRedirectedAfterKickRef.current = true;
        cleanupRoomSubscription();
        cleanupChatSubscriptions();
        clearStoredRoomJoinPassword(slug);
        resetChatState();
        setStatus("error");
        setJoinErrorMessage(errorData.message);
        void queryClient.removeQueries({
          queryKey: playlistKeys.roomStatePrefix(slug),
        });
        void queryClient.removeQueries({
          queryKey: playlistKeys.roomQueuePrefix(slug),
        });
        void queryClient.invalidateQueries({ queryKey: roomKeys.meta(slug) });
        router.replace("/home");
      },
    });
  }, [
    cleanupChatSubscriptions,
    cleanupRoomSubscription,
    queryClient,
    resetChatState,
    router,
    setJoinErrorMessage,
    setStatus,
    slug,
  ]);

  const ensureRoomSubscription = useCallback(
    (roomSlug: string, password?: string | null) => {
      const subscriptionPassword = password ?? null;

      if (
        roomSubscriptionRef.current?.slug === roomSlug &&
        roomSubscriptionRef.current.password === subscriptionPassword
      ) {
        return;
      }

      cleanupRoomSubscription();

      roomSubscriptionRef.current = {
        password: subscriptionPassword,
        slug: roomSlug,
        subscription: subscribeRoomEvents(
          roomSlug,
          ({ body }) => {
            if (!body) return;

            let event: WsEvent;
            try {
              event = JSON.parse(body) as WsEvent;
            } catch {
              return;
            }

            const eventRoomSlug =
              typeof event.roomSlug === "string"
                ? normalizeRoomSlug(event.roomSlug)
                : roomSlug;

            if (eventRoomSlug !== roomSlug) {
              return;
            }

            if (
              event.type === "PLAYBACK_SYNC" &&
              isPlaybackSyncData(event.data)
            ) {
              const syncedPlayback: LivePlaybackState = {
                roomSlug,
                videoId: event.data.videoId,
                status: event.data.status,
                currentTime: event.data.currentTime,
                serverTimestamp: event.data.serverTimestamp,
              };

              setLivePlaybackStatus((previous) => {
                if (
                  previous &&
                  previous.roomSlug === syncedPlayback.roomSlug &&
                  previous.serverTimestamp > syncedPlayback.serverTimestamp
                ) {
                  return previous;
                }

                return syncedPlayback;
              });
              return;
            }

            if (
              event.type === "QUEUE_ADDED" ||
              event.type === "QUEUE_REMOVED" ||
              event.type === "QUEUE_REORDERED" ||
              event.type === "TRACK_STARTED" ||
              event.type === "TRACK_ENDED"
            ) {
              void queryClient.invalidateQueries({
                queryKey: playlistKeys.roomQueuePrefix(roomSlug),
              });
              void refetchRoomState();
              return;
            }

            if (event.type === "ROOM_JOINED" || event.type === "ROOM_LEFT") {
              void queryClient.invalidateQueries({
                queryKey: roomKeys.meta(roomSlug),
              });
              void refetchRoomState();
            }
          },
          subscriptionPassword,
        ),
      };
    },
    [
      cleanupRoomSubscription,
      queryClient,
      refetchRoomState,
      setLivePlaybackStatus,
    ],
  );

  return {
    cleanupRoomSubscription,
    ensureRoomSubscription,
  };
}
