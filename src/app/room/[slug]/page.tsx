"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import { useParams } from "next/navigation";
import { useRoomState } from "@/src/entities/playlist/model/useRoomState";
import type { RoomStateSnapshot } from "@/src/entities/playlist/model/types";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/entities/room/api/joinRoom";
import { subscribeRoomEvents } from "@/src/entities/room/api/websocket/subscribeRoomEvents";
import type { WsEvent } from "@/src/entities/room/model/types";
import { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import YouTubePlayer from "@/src/features/playlist/player/ui/YouTubePlayer";
import RoomPasswordInput from "@/src/features/room/join/ui/roomPasswordInput";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";
type RoomEventLog = {
  id: string;
  type: string;
  receivedAt: string;
  body: string;
};

function shouldRefetchRoomState(eventType: string) {
  return [
    "QUEUE_ADDED",
    "QUEUE_REMOVED",
    "TRACK_STARTED",
    "TRACK_ENDED",
    "ROOM_JOINED",
    "ROOM_LEFT",
  ].includes(eventType);
}

function getCurrentVideoId(roomState: RoomStateSnapshot | undefined) {
  if (!roomState) {
    return null;
  }

  const currentTrackVideoId = roomState.currentEntry?.track.videoId;
  if (typeof currentTrackVideoId === "string" && currentTrackVideoId.trim()) {
    return currentTrackVideoId.trim();
  }

  const playbackVideoId = roomState.playbackStatus?.videoId;
  return typeof playbackVideoId === "string" && playbackVideoId.trim()
    ? playbackVideoId.trim()
    : null;
}

export default function RoomPage() {
  const params = useParams<{ slug: string }>();
  const slug = normalizeRoomSlug(params.slug ?? "");
  const joinRequestRef = useRef<{
    slug: string;
    promise: Promise<JoinRoomResult>;
  } | null>(null);
  const roomSubscriptionRef = useRef<{
    slug: string;
    subscription: StompSubscription;
  } | null>(null);

  const [status, setStatus] = useState<JoinStatus>("joining");
  const [message, setMessage] = useState("joining...");
  const [code, setErrorCode] = useState("joining...");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
  const [lastRoomEventType, setLastRoomEventType] = useState("없음");
  const [lastRoomEventTime, setLastRoomEventTime] = useState("");
  const [roomEventLogs, setRoomEventLogs] = useState<RoomEventLog[]>([]);
  const {
    data: roomState,
    error: roomStateError,
    isFetching: isRoomStateFetching,
    isLoading: isRoomStateLoading,
    refetch: refetchRoomState,
  } = useRoomState(slug, roomPassword, status === "joined");
  const currentVideoId = getCurrentVideoId(roomState);
  const currentEntry = roomState?.currentEntry ?? null;
  const queue = roomState?.queue ?? [];
  const participants = roomState?.participants ?? [];
  const playbackStatus = roomState?.playbackStatus ?? null;

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

  const ensureRoomSubscription = useCallback(
    (roomSlug: string) => {
      if (roomSubscriptionRef.current?.slug === roomSlug) {
        return;
      }

      cleanupRoomSubscription();

      roomSubscriptionRef.current = {
        slug: roomSlug,
        subscription: subscribeRoomEvents(roomSlug, ({ body }) => {
          if (!body) return;

          const receivedAt = new Date().toLocaleTimeString();

          let event: WsEvent;
          try {
            event = JSON.parse(body) as WsEvent;
          } catch {
            setRoomEventLogs((prev) =>
              [
                {
                  id: `${Date.now()}-${Math.random()}`,
                  type: "INVALID_JSON",
                  receivedAt,
                  body,
                },
                ...prev,
              ].slice(0, 20),
            );
            return;
          }

          setLastRoomEventType(event.type);
          setLastRoomEventTime(new Date(event.timestamp).toLocaleTimeString());
          setRoomEventLogs((prev) =>
            [
              {
                id: `${Date.now()}-${event.type}`,
                type: event.type,
                receivedAt,
                body: JSON.stringify(event, null, 2),
              },
              ...prev,
            ].slice(0, 20),
          );

          if (shouldRefetchRoomState(event.type)) {
            void refetchRoomState();
          }
        }),
      };
    },
    [cleanupRoomSubscription, refetchRoomState],
  );

  async function handlePasswordSubmit(password: string) {
    if (!slug) return;

    setIsSubmittingPassword(true);
    setMessage("비밀번호를 확인하는 중입니다...");

    try {
      const result = await joinRoom(slug, { password });
      setRoomPassword(password);
      ensureRoomSubscription(slug);
      setStatus("joined");
      setMessage(
        `joined at ${new Date(result.timestamp).toLocaleTimeString()}`,
      );
      setErrorCode("");
    } catch (error) {
      const err = error as ApiError;
      setMessage(err.message ?? "join failed");
      setErrorCode(err.code ?? "join failed");

      if (err.code === "room.password-required") {
        setStatus("needs-password");
        return;
      }

      setStatus("error");
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  useEffect(() => {
    if (!slug) return;

    let isActive = true;
    setRoomPassword(null);

    if (joinRequestRef.current?.slug !== slug) {
      joinRequestRef.current = {
        slug,
        promise: joinRoom(slug, { password: null }),
      };
    }

    const currentJoinRequest = joinRequestRef.current;
    if (!currentJoinRequest) return;

    (async () => {
      try {
        const result = await currentJoinRequest.promise;
        if (!isActive) return;

        ensureRoomSubscription(slug);
        setRoomPassword(null);
        setStatus("joined");
        setMessage(
          `joined at ${new Date(result.timestamp).toLocaleTimeString()}`,
        );
        setErrorCode("");
      } catch (error) {
        if (!isActive) return;

        const err = error as ApiError;
        setMessage(err.message ?? "join failed");
        setErrorCode(err.code ?? "join failed");

        if (err.code === "room.password-required") {
          setStatus("needs-password");
          return;
        }

        setStatus("error");
      }
    })();

    return () => {
      isActive = false;
      cleanupRoomSubscription();
    };
  }, [slug, cleanupRoomSubscription, ensureRoomSubscription]);

  useEffect(() => {
    if (!slug || status !== "joined") {
      return;
    }

    void refetchRoomState();
  }, [refetchRoomState, slug, status]);

  if (status === "needs-password") {
    return (
      <RoomPasswordInput
        message={message}
        onSubmit={handlePasswordSubmit}
        submitting={isSubmittingPassword}
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>room: {slug}</div>
      <div>join: {status}</div>
      <div>message: {message}</div>
      <div>Error Code: {code}</div>
      <div>last room event: {lastRoomEventType}</div>
      <div>last room event time: {lastRoomEventTime || "-"}</div>
      <YouTubePlayer
        videoId={currentVideoId}
        playbackStatus={playbackStatus?.status ?? null}
        currentTimeMs={playbackStatus?.currentTime ?? null}
      />
      {status === "joined" ? <AddTrackAction slug={slug} /> : null}
      <div>
        state loading: {isRoomStateLoading || isRoomStateFetching ? "yes" : "no"}
      </div>
      <div>state error: {roomStateError?.message ?? "-"}</div>
      <div>participants count: {participants.length}</div>
      <div>current entry id: {currentEntry?.entryId ?? "-"}</div>
      <div>current track videoId: {currentEntry?.track.videoId ?? "-"}</div>
      <div>playback status: {playbackStatus?.status ?? "-"}</div>
      <div>playback currentTime(ms): {playbackStatus?.currentTime ?? "-"}</div>
      <div>queue count: {queue.length}</div>
      {participants.length ? (
        <ul>
          {participants.map((participant, index) => (
            <li key={participant.participantId ?? participant.id ?? index}>
              {participant.nickname ?? participant.participantId ?? "unknown"}
            </li>
          ))}
        </ul>
      ) : null}
      {currentEntry ? (
        <div>
          current entry:
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-xs text-gray-700">
            {JSON.stringify(currentEntry, null, 2)}
          </pre>
        </div>
      ) : null}
      <div>
        queue entries:
      </div>
      {queue.length ? (
        <ul>
          {queue.map((entry) => (
            <li key={entry.entryId}>
              {entry.order}. {entry.entryId} ({entry.track.videoId})
            </li>
          ))}
        </ul>
      ) : null}
      <div className="space-y-2">
        <div className="font-semibold">room event logs</div>
        {roomEventLogs.length ? (
          <ul className="space-y-2">
            {roomEventLogs.map((eventLog) => (
              <li
                key={eventLog.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="text-sm font-medium text-gray-900">
                  {eventLog.type}
                </div>
                <div className="text-xs text-gray-500">
                  received at {eventLog.receivedAt}
                </div>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-xs text-gray-700">
                  {eventLog.body}
                </pre>
              </li>
            ))}
          </ul>
        ) : (
          <div>아직 받은 방 이벤트 없음</div>
        )}
      </div>
    </div>
  );
}
