"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import { useParams } from "next/navigation";
import { useGetPlayList } from "@/src/entities/playlist/model/useGetPlayList";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/entities/room/api/joinRoom";
import { subscribeRoomEvents } from "@/src/entities/room/api/websocket/subscribeRoomEvents";
import type { WsEvent } from "@/src/entities/room/model/types";
import { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import RoomPasswordInput from "@/src/features/room/join/ui/roomPasswordInput";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";

function shouldRefetchPlaylist(eventType: string) {
  return eventType === "QUEUE_ADDED";
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
  const [lastRoomEventType, setLastRoomEventType] = useState("없음");
  const [lastRoomEventTime, setLastRoomEventTime] = useState("");
  const {
    data: playlist,
    error: playlistError,
    isFetching: isPlaylistFetching,
    isLoading: isPlaylistLoading,
    refetch: refetchPlaylist,
  } = useGetPlayList(slug, false);

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

          let event: WsEvent;
          try {
            event = JSON.parse(body) as WsEvent;
          } catch {
            return;
          }

          setLastRoomEventType(event.type);
          setLastRoomEventTime(new Date(event.timestamp).toLocaleTimeString());

          if (status === "joined" && shouldRefetchPlaylist(event.type)) {
            void refetchPlaylist();
          }
        }),
      };
    },
    [cleanupRoomSubscription, refetchPlaylist, status],
  );

  async function handlePasswordSubmit(password: string) {
    if (!slug) return;

    setIsSubmittingPassword(true);
    setMessage("비밀번호를 확인하는 중입니다...");

    try {
      const result = await joinRoom(slug, { password });
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
        setStatus("joined");
        setMessage(
          `joined at ${new Date(result.timestamp).toLocaleTimeString()}`,
        );
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

    void refetchPlaylist();
  }, [refetchPlaylist, slug, status]);

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
      {status === "joined" ? <AddTrackAction slug={slug} /> : null}
      <div>
        playlist loading:{" "}
        {isPlaylistLoading || isPlaylistFetching ? "yes" : "no"}
      </div>
      <div>playlist count: {playlist?.length ?? 0}</div>
      <div>playlist error: {playlistError?.message ?? "-"}</div>
      {playlist?.length ? (
        <ul>
          {playlist.map((entry) => (
            <li key={entry.entryId}>
              {entry.order}. {entry.entryId}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
