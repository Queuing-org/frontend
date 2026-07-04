"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import { publishAddTrack } from "@/src/features/playlist/api/websocket/publishAddTrack";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import { subscribeUserRoomEvents } from "@/src/features/room/api/websocket/subscribeUserRoomEvents";
import type { WsErrorData, WsEvent } from "@/src/features/room/model/types";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import {
  ADD_TRACK_STORY_MAX_LENGTH,
  useAddTrackForm,
} from "./useAddTrackForm";

const ADD_TRACK_CONFIRM_TIMEOUT_MS = 15_000;
const TRACK_DURATION_LIMIT_ERROR_CODE = "room.track-duration-limit-exceeded";

type PendingAddTrack = {
  timeoutId: ReturnType<typeof setTimeout>;
  videoId: string;
};

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

export function useAddTrackAction(slug: string, roomPassword?: string | null) {
  const queryClient = useQueryClient();
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

  const refreshQueueState = useCallback(
    (roomSlug: string) => {
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.roomQueuePrefix(roomSlug),
      });
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.roomStatePrefix(roomSlug),
      });
    },
    [queryClient],
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

  const submit = () => {
    if (!form.videoId) {
      form.setErrorMessage("올바른 유튜브 링크를 입력해주세요.");
      return;
    }

    const story = form.storyValue.trim();
    if (story.length > ADD_TRACK_STORY_MAX_LENGTH) {
      form.setErrorMessage("사연은 300자 이하로 입력해주세요.");
      return;
    }

    const normalizedSlug = normalizeRoomSlug(slug);
    if (!normalizedSlug) {
      form.setErrorMessage("방 정보를 확인하지 못했습니다.");
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
        roomPassword,
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
        form.setErrorMessage(getAddTrackErrorMessage(event.data));
      });

      const timeoutId = setTimeout(() => {
        if (!pendingAddTrackRef.current) {
          return;
        }

        refreshQueueState(normalizedSlug);
        clearPendingAddTrack();
        form.setErrorMessage(
          "큐잉 결과 확인이 지연되었습니다. 잠시 후 큐 목록을 확인해주세요.",
        );
      }, ADD_TRACK_CONFIRM_TIMEOUT_MS);

      pendingAddTrackRef.current = {
        timeoutId,
        videoId: form.videoId,
      };

      publishAddTrack(normalizedSlug, {
        story: story ? story : null,
        videoId: form.videoId,
      });
    } catch (error) {
      clearPendingAddTrack();
      form.setErrorMessage(
        error instanceof Error
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
