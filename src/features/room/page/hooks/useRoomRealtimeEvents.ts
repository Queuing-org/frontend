"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import { useRouter } from "next/navigation";
import type { RoomPlayback } from "@/src/features/playlist/model/types";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import type {
  PlaybackSyncData,
  WsErrorData,
  WsEvent,
} from "@/src/features/room/model/types";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import { clearStoredRoomJoinPassword } from "@/src/features/room/join/lib/roomJoinPasswordStorage";
import { badgeKeys } from "@/src/features/badge/model/queryKeys";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { User } from "@/src/features/user/model/types";
import type {
  MusicPowerResponse,
  UserProfile,
} from "@/src/features/user/profile/model/types";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/features/room/api/joinRoom";
import { publishLeaveRequest } from "@/src/features/room/api/websocket/publishLeaveRequest";
import {
  isPasswordRequiredError,
  shouldKeepPasswordFormAfterSubmit,
} from "@/src/features/room/join/model/roomJoinErrors";
import { ApiError } from "@/src/shared/api/api-error";
import { addSocketListener } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import {
  applyMusicPowerChange,
  applyMusicPowerToProfile,
  applyTrackStarted,
  isMusicPowerChangedData,
  isTrackStartedData,
  parseRoomWsEvent,
} from "../model/roomRealtimeEvents";
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
  initializeChatStateFromJoinData: (
    data: JoinRoomResult["data"],
  ) => void;
  resetChatState: () => void;
  setJoinErrorMessage: (message: string) => void;
  setLivePlaybackStatus: Dispatch<SetStateAction<LivePlaybackState | null>>;
  setStatus: (status: JoinStatus) => void;
  slug: string;
};

type RoomSubscriptionConfig = {
  password: string | null;
  slug: string;
};

export function useRoomRealtimeEvents({
  cleanupChatSubscriptions,
  initializeChatStateFromJoinData,
  resetChatState,
  setJoinErrorMessage,
  setLivePlaybackStatus,
  setStatus,
  slug,
}: UseRoomRealtimeEventsParams) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const roomSubscriptionRef = useRef<StompSubscription | null>(null);
  const roomSubscriptionConfigRef = useRef<RoomSubscriptionConfig | null>(null);
  const reconnectPendingRef = useRef(false);
  const rejoinAbortControllerRef = useRef<AbortController | null>(null);
  const hasRedirectedAfterKickRef = useRef(false);

  const cleanupBrokerSubscription = useCallback(() => {
    try {
      roomSubscriptionRef.current?.unsubscribe();
    } catch {
      // The socket may already be closing or reconnecting.
    }
    roomSubscriptionRef.current = null;
  }, []);

  const cancelRejoin = useCallback(() => {
    rejoinAbortControllerRef.current?.abort();
    rejoinAbortControllerRef.current = null;
  }, []);

  const cleanupRoomSubscription = useCallback(() => {
    cancelRejoin();
    cleanupBrokerSubscription();
    roomSubscriptionConfigRef.current = null;
    reconnectPendingRef.current = false;
  }, [cancelRejoin, cleanupBrokerSubscription]);

  const leaveRoomSession = useCallback(() => {
    const config = roomSubscriptionConfigRef.current;
    cancelRejoin();
    cleanupBrokerSubscription();
    roomSubscriptionConfigRef.current = null;
    reconnectPendingRef.current = false;

    if (config) {
      publishLeaveRequest(config.slug);
    }
  }, [cancelRejoin, cleanupBrokerSubscription]);

  const invalidateRoomReads = useCallback(
    (roomSlug: string) => {
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.roomPlaybackPrefix(roomSlug),
      });
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.roomParticipantsPrefix(roomSlug),
      });
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.roomQueuePrefix(roomSlug),
      });
    },
    [queryClient],
  );

  const handleRoomEvent = useCallback(
    (roomSlug: string, event: WsEvent) => {
      if (event.type === "PLAYBACK_SYNC" && isPlaybackSyncData(event.data)) {
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
        event.type === "MUSIC_POWER_CHANGED" &&
        isMusicPowerChangedData(event.data)
      ) {
        const change = event.data;
        queryClient.setQueryData<MusicPowerResponse>(
          userKeys.musicPower(change.targetUserSlug),
          (current) => applyMusicPowerChange(current, change),
        );
        queryClient.setQueryData<UserProfile>(
          userKeys.profile(change.targetUserSlug),
          (current) => applyMusicPowerToProfile(current, change),
        );
        queryClient.setQueryData<User | null>(userKeys.me(), (current) =>
          applyMusicPowerToProfile(current, change),
        );
        return;
      }

      if (event.type === "TRACK_STARTED" && isTrackStartedData(event.data)) {
        const trackStarted = event.data;
        queryClient.setQueriesData<RoomPlayback>(
          { queryKey: playlistKeys.roomPlaybackPrefix(roomSlug) },
          (current) =>
            applyTrackStarted(current, trackStarted, event.timestamp),
        );
        void queryClient.invalidateQueries({
          queryKey: playlistKeys.roomPlaybackPrefix(roomSlug),
        });
        void queryClient.invalidateQueries({
          queryKey: playlistKeys.roomQueuePrefix(roomSlug),
        });
        void queryClient.invalidateQueries({
          queryKey: playlistKeys.roomHistoryPrefix(roomSlug),
        });
        return;
      }

      if (
        event.type === "QUEUE_ADDED" ||
        event.type === "QUEUE_REMOVED" ||
        event.type === "QUEUE_REORDERED" ||
        event.type === "TRACK_ENDED"
      ) {
        void queryClient.invalidateQueries({
          queryKey: playlistKeys.roomQueuePrefix(roomSlug),
        });
        void queryClient.invalidateQueries({
          queryKey: playlistKeys.roomPlaybackPrefix(roomSlug),
        });
        if (event.type === "TRACK_ENDED") {
          void queryClient.invalidateQueries({
            queryKey: playlistKeys.roomHistoryPrefix(roomSlug),
          });
        }
        return;
      }

      if (event.type === "ROOM_JOINED" || event.type === "ROOM_LEFT") {
        void queryClient.invalidateQueries({
          queryKey: roomKeys.meta(roomSlug),
        });
        void queryClient.invalidateQueries({
          queryKey: playlistKeys.roomParticipantsPrefix(roomSlug),
        });
        return;
      }

      if (event.type === "BADGE_AWARDED") {
        void queryClient.invalidateQueries({ queryKey: badgeKeys.catalog() });
        void queryClient.invalidateQueries({ queryKey: badgeKeys.me() });
      }
    },
    [queryClient, setLivePlaybackStatus],
  );

  const subscribeWithConfig = useCallback(
    (config: RoomSubscriptionConfig, force = false) => {
      if (!force && roomSubscriptionRef.current) {
        return;
      }

      cleanupBrokerSubscription();
      roomSubscriptionRef.current = subscribeRoomEvents(
        config.slug,
        ({ body }) => {
          if (!body) {
            return;
          }

          const event = parseRoomWsEvent(body);
          if (!event) {
            return;
          }

          const eventRoomSlug = normalizeRoomSlug(event.roomSlug);
          if (eventRoomSlug !== config.slug) {
            return;
          }

          handleRoomEvent(config.slug, event);
        },
        config.password,
      );
    },
    [cleanupBrokerSubscription, handleRoomEvent],
  );

  useEffect(() => {
    hasRedirectedAfterKickRef.current = false;
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    return addSocketListener({
      onConnect: () => {
        const config = roomSubscriptionConfigRef.current;
        if (!config || !reconnectPendingRef.current) {
          return;
        }

        reconnectPendingRef.current = false;
        cancelRejoin();
        const abortController = new AbortController();
        rejoinAbortControllerRef.current = abortController;

        void joinRoom(
          config.slug,
          config.password ? { password: config.password } : {},
          {
            leaveOnAbort: false,
            signal: abortController.signal,
          },
        )
          .then((joinResult) => {
            if (
              abortController.signal.aborted ||
              roomSubscriptionConfigRef.current !== config
            ) {
              return;
            }

            initializeChatStateFromJoinData(joinResult.data);
            subscribeWithConfig(config, true);
            invalidateRoomReads(config.slug);
            setJoinErrorMessage("");
            setStatus("joined");
          })
          .catch((error: unknown) => {
            if (
              abortController.signal.aborted ||
              roomSubscriptionConfigRef.current !== config
            ) {
              return;
            }

            const joinError =
              error instanceof ApiError
                ? error
                : new ApiError({
                    status: 503,
                    code: "room.rejoin-failed",
                    message: "방 연결을 복구하지 못했습니다.",
                  });
            const shouldRequestPassword =
              isPasswordRequiredError(joinError) ||
              (config.password !== null &&
                shouldKeepPasswordFormAfterSubmit(joinError));

            if (shouldRequestPassword) {
              clearStoredRoomJoinPassword(config.slug);
              cleanupRoomSubscription();
            }

            setJoinErrorMessage(joinError.message);
            setStatus(shouldRequestPassword ? "needs-password" : "error");
          })
          .finally(() => {
            if (rejoinAbortControllerRef.current === abortController) {
              rejoinAbortControllerRef.current = null;
            }
          });
      },
      onWebSocketClose: () => {
        if (!roomSubscriptionConfigRef.current) {
          return;
        }

        cancelRejoin();
        cleanupBrokerSubscription();
        cleanupChatSubscriptions();
        reconnectPendingRef.current = true;
        setJoinErrorMessage("");
        setStatus("joining");
      },
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
          queryKey: playlistKeys.roomPlaybackPrefix(slug),
        });
        void queryClient.removeQueries({
          queryKey: playlistKeys.roomParticipantsPrefix(slug),
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
    cancelRejoin,
    cleanupBrokerSubscription,
    initializeChatStateFromJoinData,
    invalidateRoomReads,
    queryClient,
    resetChatState,
    router,
    setJoinErrorMessage,
    setStatus,
    slug,
    subscribeWithConfig,
  ]);

  const ensureRoomSubscription = useCallback(
    (roomSlug: string, password?: string | null) => {
      const config = {
        password: password ?? null,
        slug: roomSlug,
      };
      const currentConfig = roomSubscriptionConfigRef.current;
      if (
        currentConfig?.slug === config.slug &&
        currentConfig.password === config.password &&
        roomSubscriptionRef.current
      ) {
        return;
      }

      roomSubscriptionConfigRef.current = config;
      subscribeWithConfig(config, true);
    },
    [subscribeWithConfig],
  );

  return {
    cleanupRoomSubscription,
    ensureRoomSubscription,
    leaveRoomSession,
  };
}
