"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import { publishAddTrack } from "@/src/features/playlist/api/websocket/publishAddTrack";
import { fetchRoomQueuePage } from "@/src/features/playlist/api/fetchRoomQueue";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import type {
  RoomQueuePage,
  RoomQueuePageParam,
} from "@/src/features/playlist/model/types";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import { subscribeUserRoomEvents } from "@/src/features/room/api/websocket/subscribeUserRoomEvents";
import type { WsErrorData, WsEvent } from "@/src/features/room/model/types";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";
import {
  ADD_TRACK_STORY_MAX_LENGTH,
  useAddTrackForm,
} from "./useAddTrackForm";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

const ADD_TRACK_CONFIRM_TIMEOUT_MS = 15_000;
const TRACK_DURATION_LIMIT_ERROR_CODE = "room.track-duration-limit-exceeded";

type PendingAddTrack = {
  timeoutId: ReturnType<typeof setTimeout>;
  videoId: string;
};

type MyRoomQueueData = InfiniteData<
  RoomQueuePage,
  RoomQueuePageParam | null
>;

function parseWsEvent(body: string): WsEvent | null {
  try {
    return JSON.parse(body) as WsEvent;
  } catch {
    return null;
  }
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

function getEventRoomSlug(event: WsEvent, fallbackSlug: string) {
  return typeof event.roomSlug === "string"
    ? normalizeRoomSlug(event.roomSlug)
    : fallbackSlug;
}

function getAddTrackErrorMessage(errorData: WsErrorData) {
  if (errorData.message) {
    return errorData.message;
  }

  if (errorData.code === TRACK_DURATION_LIMIT_ERROR_CODE) {
    return "영상 길이가 방의 제한 시간을 초과했습니다.";
  }

  return "곡을 큐에 추가하지 못했습니다.";
}

export function useAddTrackAction(slug: string, roomAccessToken: string) {
  const queryClient = useQueryClient();
  const { notify } = useActionFeedback();
  const { data: me, isError, isLoading } = useMe();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const form = useAddTrackForm();
  const isLoggedIn = Boolean(me) && !isError;
  const setFormIsSubmitting = form.setIsSubmitting;
  const pendingAddTrackRef = useRef<PendingAddTrack | null>(null);
  const roomEventSubscriptionRef = useRef<StompSubscription | null>(null);
  const userEventSubscriptionRef = useRef<StompSubscription | null>(null);

  const cleanupResultSubscriptions = useCallback(() => {
    if (roomEventSubscriptionRef.current) {
      try {
        roomEventSubscriptionRef.current.unsubscribe();
      } catch {
        // The socket may already be closing while the page is leaving.
      }
      roomEventSubscriptionRef.current = null;
    }

    if (userEventSubscriptionRef.current) {
      try {
        userEventSubscriptionRef.current.unsubscribe();
      } catch {
        // The socket may already be closing while the page is leaving.
      }
      userEventSubscriptionRef.current = null;
    }
  }, []);

  const clearPendingAddTrack = useCallback(() => {
    if (pendingAddTrackRef.current) {
      clearTimeout(pendingAddTrackRef.current.timeoutId);
      pendingAddTrackRef.current = null;
    }

    cleanupResultSubscriptions();
    setFormIsSubmitting(false);
  }, [cleanupResultSubscriptions, setFormIsSubmitting]);

  const refreshInactiveMyQueueState = useCallback(
    (roomSlug: string) => {
      const queryKey = playlistKeys.roomQueue(roomSlug, true);
      const myQueueQuery = queryClient
        .getQueryCache()
        .find({ queryKey, exact: true });

      if (myQueueQuery?.isActive()) {
        return;
      }

      void fetchRoomQueuePage({
        accessToken: roomAccessToken,
        slug: roomSlug,
        mine: true,
      })
        .then((page) => {
          queryClient.setQueryData<MyRoomQueueData>(queryKey, {
            pages: [page],
            pageParams: [null],
          });
        })
        .catch(() => {
          // The regular invalidation remains as a fallback for the next tab visit.
        });
    },
    [queryClient, roomAccessToken],
  );

  const refreshQueueState = useCallback(
    (roomSlug: string) => {
      scheduleQueryInvalidation({
        queryClient,
        queryKeys: [
          playlistKeys.roomQueuePrefix(roomSlug),
          playlistKeys.roomPlaybackPrefix(roomSlug),
        ],
        scopeKey: getRoomReadInvalidationScope(roomSlug),
      });
      refreshInactiveMyQueueState(roomSlug);
    },
    [queryClient, refreshInactiveMyQueueState],
  );

  const closeModal = () => {
    clearPendingAddTrack();
    setIsModalOpen(false);
    form.reset();
  };

  const openModal = () => {
    setIsModalOpen(true);
    form.setErrorMessage("");
  };

  const showError = (
    field: "url" | "queueMode" | "story" | "form",
    message: string,
  ) => {
    form.setError(field, message);
    notify({
      dedupeKey: `add-track:${normalizeRoomSlug(slug) || slug}:${field}`,
      message,
      tone: "error",
    });
  };

  const submit = () => {
    if (!form.queueSource) {
      showError(
        "url",
        "올바른 유튜브 영상 또는 재생목록 링크를 입력해주세요.",
      );
      return;
    }

    if (!form.queueRequest) {
      const hasCurrentVideo =
        form.queueSource.kind === "playlist" &&
        Boolean(form.queueSource.currentVideoId);
      showError(
        "queueMode",
        hasCurrentVideo
          ? "현재 영상만 추가할지 재생목록 노래도 함께 추가할지 선택해주세요."
          : "재생목록 노래 추가 여부를 선택해주세요.",
      );
      return;
    }

    const queueRequest = form.queueRequest;

    const story = form.storyValue.trim();
    if (story.length > ADD_TRACK_STORY_MAX_LENGTH) {
      showError("story", "노래 선정 이유는 30자 이하로 입력해주세요.");
      return;
    }

    const normalizedSlug = normalizeRoomSlug(slug);
    if (!normalizedSlug) {
      showError("form", "방 정보를 확인하지 못했습니다.");
      return;
    }

    clearPendingAddTrack();
    form.setIsSubmitting(true);
    form.setErrorMessage("");

    try {
      roomEventSubscriptionRef.current = subscribeRoomEvents(
        normalizedSlug,
        ({ body }) => {
          if (!body || !pendingAddTrackRef.current) {
            return;
          }

          const event = parseWsEvent(body);
          if (
            !event ||
            getEventRoomSlug(event, normalizedSlug) !== normalizedSlug ||
            event.type !== "QUEUE_ADDED"
          ) {
            return;
          }

          refreshQueueState(normalizedSlug);
          clearPendingAddTrack();
          setIsModalOpen(false);
          form.reset();
        },
        roomAccessToken,
      );

      userEventSubscriptionRef.current = subscribeUserRoomEvents(({ body }) => {
        if (!body || !pendingAddTrackRef.current) {
          return;
        }

        const event = parseWsEvent(body);
        if (
          !event ||
          getEventRoomSlug(event, normalizedSlug) !== normalizedSlug ||
          event.type !== "ERROR" ||
          !isWsErrorData(event.data)
        ) {
          return;
        }

        clearPendingAddTrack();
        showError(
          event.data.code === TRACK_DURATION_LIMIT_ERROR_CODE
            ? "url"
            : "form",
          getAddTrackErrorMessage(event.data),
        );
      });

      const timeoutId = setTimeout(() => {
        if (!pendingAddTrackRef.current) {
          return;
        }

        refreshQueueState(normalizedSlug);
        clearPendingAddTrack();
        showError(
          "form",
          "큐잉 결과 확인이 지연되었습니다. 잠시 후 큐 목록을 확인해주세요.",
        );
      }, ADD_TRACK_CONFIRM_TIMEOUT_MS);

      pendingAddTrackRef.current = {
        timeoutId,
        videoId: queueRequest.videoId,
      };

      publishAddTrack(normalizedSlug, {
        story: story ? story : null,
        videoId: queueRequest.videoId,
        youtubePlaylist: queueRequest.youtubePlaylist,
      });
    } catch (error) {
      clearPendingAddTrack();
      showError(
        "form",
        error instanceof Error && error.message
          ? error.message
          : "곡 신청 요청을 보내지 못했습니다.",
      );
    }
  };

  useEffect(() => {
    return () => {
      clearPendingAddTrack();
    };
  }, [clearPendingAddTrack]);

  return {
    closeModal,
    form,
    isLoading,
    isLoggedIn,
    isModalOpen,
    openModal,
    submit,
  };
}
