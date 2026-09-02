"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import { useRouter } from "next/navigation";
import type { RoomPlayback } from "@/src/features/playlist/model/types";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import type {
  PlaybackSyncData,
  RoomMeta,
  WsErrorData,
  WsEvent,
} from "@/src/features/room/model/types";
import { roomKeys } from "@/src/features/room/model/queryKeys";
import { fetchRoomMeta } from "@/src/features/room/api/fetchRoomMeta";
import {
  clearStoredRoomAccessToken,
  writeStoredRoomAccessToken,
} from "@/src/features/room/join/lib/roomAccessTokenStorage";
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
import { isRoomAccessDeniedError } from "@/src/features/room/join/model/roomJoinErrors";
import { ApiError } from "@/src/shared/api/api-error";
import {
  acquireSocketSession,
  addSocketListener,
  getSocketClient,
  stopSocketAutoReconnect,
} from "@/src/shared/api/websocket/stompConnection";
import { parseRoomJoinEvent } from "@/src/features/room/api/websocket/subscribeUserJoinEvents";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import {
  cancelScheduledQueryInvalidation,
  scheduleQueryInvalidation,
} from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import {
  applyMusicPowerChange,
  applyMusicPowerToProfile,
  applyRoomInfoUpdate,
  applyRoomOwnerChange,
  applyTrackStarted,
  isMusicPowerChangedData,
  isRoomInfoUpdatedData,
  isRoomOwnerChangedData,
  isTrackStartedData,
  parseRoomWsEvent,
} from "../model/roomRealtimeEvents";
import type { LivePlaybackState } from "./useRoomPlaybackViewModel";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";

const PARTICIPANT_KICKED_ERROR_CODE = "room.participant-kicked";
const SESSION_REPLACED_ERROR_CODE = "user.session-replaced";
const SESSION_REPLACED_MESSAGE =
  "현재 방은 다른 창에서 마지막으로 열렸습니다.";
const ignoreCurrentParticipantChange = () => undefined;
type RoomInvalidationTarget =
  | "meta"
  | "participants"
  | "playback"
  | "queue";

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

function isSessionReplacedData(
  data: unknown,
): data is { code: string; message: string } {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as { code?: unknown; message?: unknown };
  return (
    candidate.code === SESSION_REPLACED_ERROR_CODE &&
    typeof candidate.message === "string"
  );
}

type UseRoomRealtimeEventsParams = {
  cleanupChatSubscriptions: () => void;
  initializeChatStateFromJoinData: (
    data: JoinRoomResult["data"],
  ) => void;
  onCurrentParticipantChanged?: (
    participant: JoinRoomResult["data"]["participant"],
  ) => void;
  onRoomAccessTokenChanged?: (accessToken: string | null) => void;
  resetChatState: () => void;
  setJoinErrorMessage: (message: string) => void;
  setLivePlaybackStatus: Dispatch<SetStateAction<LivePlaybackState | null>>;
  setStatus: (status: JoinStatus) => void;
  slug: string;
};

type RoomSubscriptionConfig = {
  accessToken: string;
  slug: string;
};

export function useRoomRealtimeEvents({
  cleanupChatSubscriptions,
  initializeChatStateFromJoinData,
  onCurrentParticipantChanged = ignoreCurrentParticipantChange,
  onRoomAccessTokenChanged = () => undefined,
  resetChatState,
  setJoinErrorMessage,
  setLivePlaybackStatus,
  setStatus,
  slug,
}: UseRoomRealtimeEventsParams) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { notify } = useActionFeedback();
  const roomSubscriptionRef = useRef<StompSubscription | null>(null);
  const userSubscriptionRef = useRef<StompSubscription | null>(null);
  const roomSubscriptionConfigRef = useRef<RoomSubscriptionConfig | null>(null);
  const reconnectPendingRef = useRef(false);
  const rejoinAbortControllerRef = useRef<AbortController | null>(null);
  const hasRedirectedAfterKickRef = useRef(false);
  const scheduledRoomInvalidationScopesRef = useRef(new Set<string>());
  const hasTerminatedRoomRef = useRef(false);
  const terminateDeletedRoomRef = useRef<(roomSlug: string) => void>(() => undefined);
  const roomMetaRefreshAbortControllerRef = useRef<AbortController | null>(null);
  const roomMetaRefreshGenerationRef = useRef(0);

  const cancelRoomMetaRefresh = useCallback(() => {
    roomMetaRefreshGenerationRef.current += 1;
    roomMetaRefreshAbortControllerRef.current?.abort();
    roomMetaRefreshAbortControllerRef.current = null;
  }, []);

  const clearScheduledRoomInvalidations = useCallback(() => {
    for (const scopeKey of scheduledRoomInvalidationScopesRef.current) {
      cancelScheduledQueryInvalidation(queryClient, scopeKey);
    }
    scheduledRoomInvalidationScopesRef.current.clear();
  }, [queryClient]);

  const cleanupBrokerSubscription = useCallback(() => {
    try {
      roomSubscriptionRef.current?.unsubscribe();
    } catch {
      // The socket may already be closing or reconnecting.
    }
    roomSubscriptionRef.current = null;
  }, []);

  const cleanupUserSubscription = useCallback(() => {
    try {
      userSubscriptionRef.current?.unsubscribe();
    } catch {
      // The socket may already be closing or reconnecting.
    }
    userSubscriptionRef.current = null;
  }, []);

  const cancelRejoin = useCallback(() => {
    rejoinAbortControllerRef.current?.abort();
    rejoinAbortControllerRef.current = null;
  }, []);

  const cleanupRoomSubscription = useCallback(() => {
    cancelRoomMetaRefresh();
    clearScheduledRoomInvalidations();
    cancelRejoin();
    cleanupBrokerSubscription();
    cleanupUserSubscription();
    roomSubscriptionConfigRef.current = null;
    reconnectPendingRef.current = false;
  }, [
    cancelRejoin,
    cancelRoomMetaRefresh,
    cleanupBrokerSubscription,
    cleanupUserSubscription,
    clearScheduledRoomInvalidations,
  ]);

  const leaveRoomSession = useCallback(
    (
      { requirePublishSuccess = false }: { requirePublishSuccess?: boolean } = {},
    ) => {
      const config = roomSubscriptionConfigRef.current;
      const didPublish = config ? publishLeaveRequest(config.slug) : false;

      if (requirePublishSuccess && !didPublish) {
        return false;
      }

      cancelRoomMetaRefresh();
      clearScheduledRoomInvalidations();
      cancelRejoin();
      cleanupBrokerSubscription();
      cleanupUserSubscription();
      roomSubscriptionConfigRef.current = null;
      reconnectPendingRef.current = false;
      if (config) {
        clearStoredRoomAccessToken(config.slug);
      }

      return didPublish;
    },
    [
      cancelRejoin,
      cancelRoomMetaRefresh,
      cleanupBrokerSubscription,
      cleanupUserSubscription,
      clearScheduledRoomInvalidations,
    ],
  );

  const scheduleRoomInvalidation = useCallback(
    (roomSlug: string, targets: readonly RoomInvalidationTarget[]) => {
      const queryKeys: QueryKey[] = targets.map((target) => {
        switch (target) {
          case "playback":
            return playlistKeys.roomPlaybackPrefix(roomSlug);
          case "participants":
            return playlistKeys.roomParticipantsPrefix(roomSlug);
          case "queue":
            return playlistKeys.roomQueuePrefix(roomSlug);
          case "meta":
            return roomKeys.meta(roomSlug);
        }
      });
      const scopeKey = getRoomReadInvalidationScope(roomSlug);
      scheduledRoomInvalidationScopesRef.current.add(scopeKey);
      scheduleQueryInvalidation({ queryClient, queryKeys, scopeKey });
    },
    [queryClient],
  );

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
      void queryClient.refetchQueries({
        queryKey: roomKeys.meta(roomSlug),
        type: "all",
      });
    },
    [queryClient],
  );

  const resetRoomQueueHistory = useCallback(
    (roomSlug: string) =>
      queryClient.resetQueries({
        queryKey: playlistKeys.roomQueueHistoryPrefix(roomSlug),
        exact: true,
      }),
    [queryClient],
  );

  const handleRoomEvent = useCallback(
    (roomSlug: string, event: WsEvent) => {
      if (event.type === "ROOM_DELETED") {
        terminateDeletedRoomRef.current(roomSlug);
        return;
      }
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
        queryClient.setQueriesData<MusicPowerResponse>(
          { queryKey: userKeys.musicPowerUserRoot(change.targetUserSlug) },
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

      if (
        event.type === "ROOM_OWNER_CHANGED" &&
        isRoomOwnerChangedData(event.data)
      ) {
        const change = event.data;
        queryClient.setQueryData<RoomMeta>(
          roomKeys.meta(roomSlug),
          (current) => applyRoomOwnerChange(current, change),
        );
        scheduleRoomInvalidation(roomSlug, ["meta"]);
        return;
      }

      if (
        event.type === "ROOM_INFO_UPDATED" &&
        isRoomInfoUpdatedData(event.data)
      ) {
        const change = event.data;
        queryClient.setQueryData<RoomMeta>(
          roomKeys.meta(roomSlug),
          (current) => applyRoomInfoUpdate(current, change),
        );
        roomMetaRefreshAbortControllerRef.current?.abort();
        const abortController = new AbortController();
        const generation = roomMetaRefreshGenerationRef.current + 1;
        roomMetaRefreshGenerationRef.current = generation;
        roomMetaRefreshAbortControllerRef.current = abortController;
        void fetchRoomMeta(roomSlug, abortController.signal)
          .then((meta) => {
            if (
              !abortController.signal.aborted &&
              !hasTerminatedRoomRef.current &&
              roomMetaRefreshGenerationRef.current === generation
            ) {
              queryClient.setQueryData(roomKeys.meta(roomSlug), meta);
            }
          })
          .catch(() => undefined)
          .finally(() => {
            if (roomMetaRefreshAbortControllerRef.current === abortController) {
              roomMetaRefreshAbortControllerRef.current = null;
            }
          });
        void queryClient.invalidateQueries({ queryKey: roomKeys.all() });
        notify({
          dedupeKey: `room-update:${roomSlug}`,
          message: "방 정보가 변경되었어요",
          tone: "default",
        });
        return;
      }

      if (event.type === "TRACK_STARTED" && isTrackStartedData(event.data)) {
        const trackStarted = event.data;
        queryClient.setQueriesData<RoomPlayback>(
          { queryKey: playlistKeys.roomPlaybackPrefix(roomSlug) },
          (current) =>
            applyTrackStarted(current, trackStarted, event.timestamp),
        );
        scheduleRoomInvalidation(roomSlug, ["playback", "queue", "meta"]);
        void resetRoomQueueHistory(roomSlug);
        return;
      }

      if (
        event.type === "QUEUE_ADDED" ||
        event.type === "QUEUE_REMOVED" ||
        event.type === "QUEUE_REORDERED" ||
        event.type === "TRACK_ENDED"
      ) {
        if (event.type === "TRACK_ENDED") {
          void resetRoomQueueHistory(roomSlug);
        }
        scheduleRoomInvalidation(
          roomSlug,
          event.type === "TRACK_ENDED"
            ? ["queue", "playback", "meta"]
            : ["queue", "playback"],
        );
        return;
      }

      if (event.type === "ROOM_JOINED" || event.type === "ROOM_LEFT") {
        scheduleRoomInvalidation(roomSlug, ["meta", "participants"]);
        return;
      }

      if (event.type === "BADGE_AWARDED") {
        void queryClient.invalidateQueries({ queryKey: badgeKeys.me() });
      }
    },
    [
      notify,
      queryClient,
      resetRoomQueueHistory,
      scheduleRoomInvalidation,
      setLivePlaybackStatus,
    ],
  );

  const terminateDeletedRoom = useCallback((roomSlug: string) => {
    if (hasTerminatedRoomRef.current) return;
    hasTerminatedRoomRef.current = true;
    cancelRoomMetaRefresh();
    clearScheduledRoomInvalidations();
    cancelRejoin();
    cleanupBrokerSubscription();
    cleanupUserSubscription();
    roomSubscriptionConfigRef.current = null;
    reconnectPendingRef.current = false;
    cleanupChatSubscriptions();
    resetChatState();
    setLivePlaybackStatus(null);
    clearStoredRoomAccessToken(roomSlug);
    onRoomAccessTokenChanged(null);
    queryClient.removeQueries({ queryKey: playlistKeys.roomPlaybackPrefix(roomSlug) });
    queryClient.removeQueries({ queryKey: playlistKeys.roomParticipantsPrefix(roomSlug) });
    queryClient.removeQueries({ queryKey: playlistKeys.roomQueuePrefix(roomSlug) });
    queryClient.removeQueries({ queryKey: playlistKeys.roomQueueHistoryPrefix(roomSlug) });
    queryClient.removeQueries({ queryKey: roomKeys.meta(roomSlug) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.all() });
    notify({
      dedupeKey: `room-delete:${roomSlug}`,
      message: "방이 삭제되어 홈으로 이동했습니다.",
      tone: "default",
    });
    setStatus("error");
    router.replace("/");
  }, [
    cancelRejoin,
    cancelRoomMetaRefresh,
    clearScheduledRoomInvalidations,
    cleanupBrokerSubscription,
    cleanupChatSubscriptions,
    cleanupUserSubscription,
    notify,
    onRoomAccessTokenChanged,
    queryClient,
    resetChatState,
    router,
    setLivePlaybackStatus,
    setStatus,
  ]);

  useEffect(() => {
    terminateDeletedRoomRef.current = terminateDeletedRoom;
  }, [terminateDeletedRoom]);

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
        config.accessToken,
      );
    },
    [cleanupBrokerSubscription, handleRoomEvent],
  );

  const handleSessionReplaced = useCallback(
    (roomSlug: string) => {
      const config = roomSubscriptionConfigRef.current;
      if (!config || config.slug !== roomSlug) {
        return;
      }

      cancelRejoin();
      cancelRoomMetaRefresh();
      clearScheduledRoomInvalidations();
      cleanupBrokerSubscription();
      cleanupUserSubscription();
      roomSubscriptionConfigRef.current = null;
      reconnectPendingRef.current = false;
      cleanupChatSubscriptions();
      resetChatState();
      setLivePlaybackStatus(null);
      clearStoredRoomAccessToken(roomSlug);
      onRoomAccessTokenChanged(null);
      setJoinErrorMessage(SESSION_REPLACED_MESSAGE);
      setStatus("error");
      void queryClient.removeQueries({
        queryKey: playlistKeys.roomPlaybackPrefix(roomSlug),
      });
      void queryClient.removeQueries({
        queryKey: playlistKeys.roomParticipantsPrefix(roomSlug),
      });
      void queryClient.removeQueries({
        queryKey: playlistKeys.roomQueuePrefix(roomSlug),
      });
      void queryClient.removeQueries({
        queryKey: playlistKeys.roomQueueHistoryPrefix(roomSlug),
      });
      void queryClient.removeQueries({
        queryKey: roomKeys.meta(roomSlug),
      });
      stopSocketAutoReconnect();
    },
    [
      cancelRejoin,
      cancelRoomMetaRefresh,
      clearScheduledRoomInvalidations,
      cleanupBrokerSubscription,
      cleanupChatSubscriptions,
      cleanupUserSubscription,
      queryClient,
      onRoomAccessTokenChanged,
      resetChatState,
      setJoinErrorMessage,
      setLivePlaybackStatus,
      setStatus,
    ],
  );

  const handleParticipantKicked = useCallback(
    (roomSlug: string, message: string) => {
      if (hasRedirectedAfterKickRef.current) {
        return;
      }

      hasRedirectedAfterKickRef.current = true;
      cleanupRoomSubscription();
      cleanupChatSubscriptions();
      clearStoredRoomAccessToken(roomSlug);
      onRoomAccessTokenChanged(null);
      resetChatState();
      setStatus("error");
      setJoinErrorMessage(message);
      void queryClient.removeQueries({
        queryKey: playlistKeys.roomPlaybackPrefix(roomSlug),
      });
      void queryClient.removeQueries({
        queryKey: playlistKeys.roomParticipantsPrefix(roomSlug),
      });
      void queryClient.removeQueries({
        queryKey: playlistKeys.roomQueuePrefix(roomSlug),
      });
      void queryClient.removeQueries({
        queryKey: playlistKeys.roomQueueHistoryPrefix(roomSlug),
      });
      void queryClient.invalidateQueries({ queryKey: roomKeys.meta(roomSlug) });
      router.replace("/");
    },
    [
      cleanupChatSubscriptions,
      cleanupRoomSubscription,
      onRoomAccessTokenChanged,
      queryClient,
      resetChatState,
      router,
      setJoinErrorMessage,
      setStatus,
    ],
  );

  const subscribeUserEvents = useCallback(
    (config: RoomSubscriptionConfig) => {
      cleanupUserSubscription();
      userSubscriptionRef.current = getSocketClient().subscribe(
        "/user/playlist/events",
        ({ body }) => {
          if (!body) {
            return;
          }

          const event = parseRoomJoinEvent(body);
          if (
            !event ||
            event.roomSlug !== config.slug ||
            event.type !== "ERROR"
          ) {
            return;
          }

          if (isSessionReplacedData(event.data)) {
            handleSessionReplaced(config.slug);
            return;
          }

          if (
            isWsErrorData(event.data) &&
            event.data.code === PARTICIPANT_KICKED_ERROR_CODE
          ) {
            handleParticipantKicked(config.slug, event.data.message);
          }
        },
      );
    },
    [
      cleanupUserSubscription,
      handleParticipantKicked,
      handleSessionReplaced,
    ],
  );

  const activateJoinedConfig = useCallback(
    (config: RoomSubscriptionConfig, joinResult: JoinRoomResult) => {
      const accessToken = joinResult.data.roomAccessToken.trim();
      const nextConfig = { accessToken, slug: config.slug };
      writeStoredRoomAccessToken(config.slug, accessToken);
      roomSubscriptionConfigRef.current = nextConfig;
      onCurrentParticipantChanged(joinResult.data.participant);
      onRoomAccessTokenChanged(accessToken);
      initializeChatStateFromJoinData(joinResult.data);
      subscribeWithConfig(nextConfig, true);
      subscribeUserEvents(nextConfig);
      invalidateRoomReads(config.slug);
      setJoinErrorMessage("");
      setStatus("joined");
    },
    [
      initializeChatStateFromJoinData,
      invalidateRoomReads,
      onCurrentParticipantChanged,
      onRoomAccessTokenChanged,
      setJoinErrorMessage,
      setStatus,
      subscribeUserEvents,
      subscribeWithConfig,
    ],
  );

  useEffect(() => {
    hasRedirectedAfterKickRef.current = false;
    hasTerminatedRoomRef.current = false;
  }, [slug]);

  useEffect(() => clearScheduledRoomInvalidations, [
    clearScheduledRoomInvalidations,
    slug,
  ]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    return acquireSocketSession();
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

        void (async () => {
          try {
            return await joinRoom(
              config.slug,
              { accessToken: config.accessToken },
              {
                leaveOnAbort: false,
                signal: abortController.signal,
              },
            );
          } catch (error) {
            if (!isRoomAccessDeniedError(error)) {
              throw error;
            }

            clearStoredRoomAccessToken(config.slug);
            onRoomAccessTokenChanged(null);
            const roomMeta = await fetchRoomMeta(
              config.slug,
              abortController.signal,
            );
            queryClient.setQueryData(roomKeys.meta(config.slug), roomMeta);
            if (!roomMeta.isPublic) {
              throw error;
            }

            return joinRoom(
              config.slug,
              {},
              {
                leaveOnAbort: false,
                signal: abortController.signal,
              },
            );
          }
        })()
          .then((joinResult) => {
            if (
              abortController.signal.aborted ||
              roomSubscriptionConfigRef.current !== config
            ) {
              return;
            }

            activateJoinedConfig(config, joinResult);
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
            if (joinError.code === "room.not-found") {
              terminateDeletedRoom(config.slug);
              return;
            }
            const roomMeta = queryClient.getQueryData<RoomMeta>(
              roomKeys.meta(config.slug),
            );
            const shouldRequestPassword =
              isRoomAccessDeniedError(joinError) && roomMeta?.isPublic !== true;

            if (shouldRequestPassword) {
              clearStoredRoomAccessToken(config.slug);
              onRoomAccessTokenChanged(null);
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
        cancelRoomMetaRefresh();
        clearScheduledRoomInvalidations();
        cleanupBrokerSubscription();
        cleanupUserSubscription();
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

        const parsedError = isWsErrorData(errorData)
          ? errorData
          : errorData && typeof errorData === "object" && "error" in errorData &&
              isWsErrorData((errorData as { error: unknown }).error)
            ? (errorData as { error: WsErrorData }).error
            : null;
        if (!parsedError) {
          return;
        }

        if (parsedError.code === "room.not-found") {
          terminateDeletedRoom(slug);
          return;
        }
        if (parsedError.code === SESSION_REPLACED_ERROR_CODE) {
          handleSessionReplaced(slug);
          return;
        }
        if (parsedError.code === PARTICIPANT_KICKED_ERROR_CODE) {
          handleParticipantKicked(slug, parsedError.message);
        }
      },
    });
  }, [
    cleanupChatSubscriptions,
    cleanupRoomSubscription,
    cancelRejoin,
    cancelRoomMetaRefresh,
    clearScheduledRoomInvalidations,
    cleanupBrokerSubscription,
    cleanupUserSubscription,
    activateJoinedConfig,
    handleSessionReplaced,
    handleParticipantKicked,
    onRoomAccessTokenChanged,
    queryClient,
    setJoinErrorMessage,
    setStatus,
    slug,
    terminateDeletedRoom,
  ]);

  const ensureRoomSubscription = useCallback(
    (roomSlug: string, accessToken: string) => {
      const config = {
        accessToken,
        slug: roomSlug,
      };
      const currentConfig = roomSubscriptionConfigRef.current;
      if (
        currentConfig?.slug === config.slug &&
        currentConfig.accessToken === config.accessToken &&
        roomSubscriptionRef.current
      ) {
        return;
      }

      roomSubscriptionConfigRef.current = config;
      subscribeWithConfig(config, true);
      subscribeUserEvents(config);
    },
    [subscribeUserEvents, subscribeWithConfig],
  );

  return {
    cleanupRoomSubscription,
    ensureRoomSubscription,
    leaveRoomSession,
  };
}
