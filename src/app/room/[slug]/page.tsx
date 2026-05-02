"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useRoomState } from "@/src/entities/playlist/model/useRoomState";
import type { RoomStateSnapshot } from "@/src/entities/playlist/model/types";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/entities/room/api/joinRoom";
import { subscribeRoomEvents } from "@/src/entities/room/api/websocket/subscribeRoomEvents";
import type {
  PlaybackSyncData,
  PlaybackStatus,
  WsEvent,
} from "@/src/entities/room/model/types";
import { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import YouTubePlayer from "@/src/features/playlist/player/ui/YouTubePlayer";
import RoomPasswordInput from "@/src/features/room/join/ui/roomPasswordInput";
import styles from "./page.module.css";
import RoomInfo from "@/src/entities/room/ui/RoomInfo";
import RoomButtonControlBar from "@/src/widgets/room/ui/RoomControlBar";
import { useFloatingWidgetsState } from "@/src/widgets/room/model/useFloatingWidgetsState";
import RoomFloatingWidgets from "@/src/widgets/room/ui/RoomFloatingWidgets";
import ChatArea from "@/src/features/room/chat/ui/ChatArea";
import type { CurrentRequesterProfile } from "@/src/features/room/profile/model/types";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";

type PlaybackState = {
  roomSlug: string;
  status: PlaybackStatus;
  videoId: string;
  currentTime: number;
  serverTimestamp: number;
};

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

function getLatestPlaybackState(
  roomStatePlayback: RoomStateSnapshot["playbackStatus"] | null | undefined,
  livePlayback: PlaybackState | null,
) {
  if (!roomStatePlayback) {
    return livePlayback;
  }

  if (!livePlayback) {
    return roomStatePlayback;
  }

  return roomStatePlayback.serverTimestamp >= livePlayback.serverTimestamp
    ? roomStatePlayback
    : livePlayback;
}

function getCurrentVideoId(
  roomState: RoomStateSnapshot | undefined,
  playbackStatus: PlaybackState | RoomStateSnapshot["playbackStatus"] | null,
) {
  const playbackVideoId = playbackStatus?.videoId;
  if (typeof playbackVideoId === "string" && playbackVideoId.trim()) {
    return playbackVideoId.trim();
  }

  const currentTrackVideoId = roomState?.currentEntry?.track.videoId;
  if (typeof currentTrackVideoId === "string" && currentTrackVideoId.trim()) {
    return currentTrackVideoId.trim();
  }

  return null;
}

function getCurrentRequesterProfile(
  roomState: RoomStateSnapshot | undefined,
): CurrentRequesterProfile | null {
  const requester = roomState?.currentEntry?.addedBy;
  if (!requester) {
    return null;
  }

  const matchedParticipant = roomState?.participants.find((participant) => {
    if (requester.userId !== null) {
      return participant.userId === requester.userId;
    }

    return participant.nickname === requester.nickname;
  });

  return {
    avatarUrl: requester.avatarUrl ?? matchedParticipant?.profileImageUrl ?? null,
    nickname: requester.nickname,
    slug: matchedParticipant?.slug ?? null,
    userId: requester.userId,
  };
}

export default function RoomPage() {
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
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
  const [joinErrorMessage, setJoinErrorMessage] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
  const [livePlaybackStatus, setLivePlaybackStatus] =
    useState<PlaybackState | null>(null);
  const floatingWidgets = useFloatingWidgetsState();

  const { data: roomState, refetch: refetchRoomState } = useRoomState(
    slug,
    roomPassword,
    status === "joined",
  );
  const playbackStatus = getLatestPlaybackState(
    roomState?.playbackStatus,
    livePlaybackStatus?.roomSlug === slug ? livePlaybackStatus : null,
  );
  const currentVideoId = getCurrentVideoId(roomState, playbackStatus);
  const currentRequester = getCurrentRequesterProfile(roomState);
  const currentTrackTitle = roomState?.currentEntry?.track.title ?? null;

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

          if (event.roomSlug !== roomSlug) {
            return;
          }

          if (
            event.type === "PLAYBACK_SYNC" &&
            isPlaybackSyncData(event.data)
          ) {
            const syncedPlayback: PlaybackState = {
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
            event.type === "TRACK_STARTED" ||
            event.type === "TRACK_ENDED"
          ) {
            void queryClient.invalidateQueries({
              queryKey: ["roomQueue", roomSlug],
            });
            void refetchRoomState();
            return;
          }

          if (event.type === "ROOM_JOINED" || event.type === "ROOM_LEFT") {
            void queryClient.invalidateQueries({
              queryKey: ["roomMeta", roomSlug],
            });
          }
        }),
      };
    },
    [cleanupRoomSubscription, queryClient, refetchRoomState],
  );

  async function handlePasswordSubmit(password: string) {
    if (!slug) return;

    setIsSubmittingPassword(true);
    setJoinErrorMessage("");

    try {
      await joinRoom(slug, { password });
      setRoomPassword(password);
      ensureRoomSubscription(slug);
      setStatus("joined");
      setJoinErrorMessage("");
    } catch (error) {
      const err = error as ApiError;
      setJoinErrorMessage(err.message ?? "방에 입장할 수 없습니다.");

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
    setJoinErrorMessage("");

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
        await currentJoinRequest.promise;
        if (!isActive) return;

        ensureRoomSubscription(slug);
        setRoomPassword(null);
        setStatus("joined");
        setJoinErrorMessage("");
      } catch (error) {
        if (!isActive) return;

        const err = error as ApiError;
        setJoinErrorMessage(err.message ?? "방에 입장할 수 없습니다.");

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

  useEffect(() => {
    setLivePlaybackStatus(null);
  }, [slug]);

  if (status === "needs-password") {
    return (
      <div className={styles.passwordState}>
        <RoomPasswordInput
          message={joinErrorMessage}
          onSubmit={handlePasswordSubmit}
          submitting={isSubmittingPassword}
        />
      </div>
    );
  }

  if (status === "joining") {
    return <div className={styles.statusState}>입장 중...</div>;
  }

  if (status === "error") {
    return (
      <div className={styles.statusState}>
        {joinErrorMessage || "방에 입장할 수 없습니다."}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.mainArea}>
          <RoomInfo slug={slug} isRoom />
          <YouTubePlayer
            key={slug}
            videoId={currentVideoId}
            playbackStatus={playbackStatus?.status ?? null}
            currentTimeMs={playbackStatus?.currentTime ?? null}
          />
          {currentRequester ? (
            <div className={styles.requesterCard}>
              {currentRequester.avatarUrl ? (
                <Image
                  src={currentRequester.avatarUrl}
                  alt={`${currentRequester.nickname} avatar`}
                  width={44}
                  height={44}
                  unoptimized
                  className={styles.requesterAvatar}
                />
              ) : (
                <div
                  className={styles.requesterAvatarFallback}
                  aria-hidden="true"
                >
                  {currentRequester.nickname.slice(0, 1)}
                </div>
              )}
              <div className={styles.requesterMeta}>
                <div className={styles.requesterLabel}>현재 신청자</div>
                <div className={styles.requesterName}>
                  {currentRequester.nickname}
                </div>
              </div>
            </div>
          ) : null}
          <div className={styles.actionBar}>
            <AddTrackAction slug={slug} />
          </div>
          <div className={styles.chatSection}>
            <ChatArea />
          </div>
          <div className={styles.controlBarDock}>
            <RoomButtonControlBar
              isChatOpen={floatingWidgets.widgets.chat.isOpen}
              isProfileOpen={floatingWidgets.widgets.profile.isOpen}
              isQueueOpen={floatingWidgets.widgets.queue.isOpen}
              onToggleChat={() => floatingWidgets.toggleWidget("chat")}
              onToggleProfile={() => floatingWidgets.toggleWidget("profile")}
              onToggleQueue={() => floatingWidgets.toggleWidget("queue")}
            />
          </div>
        </div>
      </div>
      <RoomFloatingWidgets
        currentRequester={currentRequester}
        currentTrackTitle={currentTrackTitle}
        roomPassword={roomPassword}
        roomSlug={slug}
        widgets={floatingWidgets.widgets}
        onActivateWidget={floatingWidgets.activateWidget}
        onWidgetStop={floatingWidgets.handleWidgetStop}
      />
    </div>
  );
}
