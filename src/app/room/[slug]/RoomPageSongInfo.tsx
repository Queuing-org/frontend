"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import { useParams } from "next/navigation";
import { useRoomState } from "@/src/entities/playlist/model/useRoomState";
import type { RoomStateSnapshot } from "@/src/entities/playlist/model/types";
import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/entities/room/api/joinRoom";
import { publishChatMessage } from "@/src/entities/room/api/websocket/publishChatMessage";
import { subscribeRoomChatEvents } from "@/src/entities/room/api/websocket/subscribeRoomChatEvents";
import { subscribeRoomEvents } from "@/src/entities/room/api/websocket/subscribeRoomEvents";
import { subscribeUserRoomEvents } from "@/src/entities/room/api/websocket/subscribeUserRoomEvents";
import { useRoomChats } from "@/src/entities/room/hooks/useRoomChats";
import type {
  ChatMessage,
  ChatMessageEventData,
  PlaybackSyncData,
  PlaybackStatus,
  WsErrorData,
  WsEvent,
} from "@/src/entities/room/model/types";
import { isRoomOwner } from "@/src/entities/room/lib/isRoomOwner";
import { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import {
  clearStoredRoomJoinPassword,
  readStoredRoomJoinPassword,
  writeStoredRoomJoinPassword,
} from "@/src/features/room/join/lib/roomJoinPasswordStorage";
import YouTubePlayer from "@/src/features/playlist/player/ui/YouTubePlayer";
import RoomPasswordInput from "@/src/features/room/join/ui/roomPasswordInput";
import UpdateRoomButton from "@/src/features/room/update/ui/UpdateRoomButton";
import CurrentRequesterCard from "@/src/features/room/current-requester/ui/CurrentRequesterCard";
import styles from "./RoomPageSongInfo.module.css";
import RoomInfo from "@/src/entities/room/ui/RoomInfo";
import RoomButtonControlBar from "@/src/widgets/room/ui/RoomControlBar";
import { useFloatingWidgetsState } from "@/src/widgets/room/model/useFloatingWidgetsState";
import RoomFloatingWidgets from "@/src/widgets/room/ui/RoomFloatingWidgets";
import ChatArea from "@/src/features/room/chat/ui/ChatArea";
import type { CurrentRequesterProfile } from "@/src/features/room/profile/model/types";
import { useMe } from "@/src/entities/user/hooks/useMe";
import type { User } from "@/src/entities/user/model/types";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";

type PlaybackState = {
  roomSlug: string;
  status: PlaybackStatus;
  videoId: string;
  currentTime: number;
  serverTimestamp: number;
};

const CHAT_HISTORY_PAGE_SIZE = 30;
const MAX_CHAT_CONTENT_LENGTH = 200;

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

function isChatMessageData(data: unknown): data is ChatMessageEventData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<ChatMessageEventData>;

  return (
    typeof candidate.messageId === "number" &&
    typeof candidate.messageType === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.senderId === "number" &&
    typeof candidate.senderNickname === "string" &&
    (candidate.senderProfileImageUrl === null ||
      typeof candidate.senderProfileImageUrl === "string") &&
    typeof candidate.sentAt === "number"
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

function getRecentChatMessages(
  data: JoinRoomResult["data"],
): ChatMessage[] {
  if (!Array.isArray(data?.recentChatMessages)) {
    return [];
  }

  return data.recentChatMessages.filter(isChatMessageData);
}

function mergeUniqueChatMessages(messages: ChatMessage[]) {
  const seenMessageIds = new Set<number>();
  const uniqueMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (seenMessageIds.has(message.messageId)) {
      continue;
    }

    seenMessageIds.add(message.messageId);
    uniqueMessages.push(message);
  }

  return uniqueMessages;
}

function getOldestMessageId(messages: ChatMessage[]) {
  return messages[0]?.messageId ?? null;
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
    if (typeof requester.userId === "number") {
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

export default function RoomPageSongInfo() {
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const slug = normalizeRoomSlug(params.slug ?? "");
  const joinRequestRef = useRef<{
    slug: string;
    password: string | null;
    promise: Promise<JoinRoomResult>;
  } | null>(null);
  const roomSubscriptionRef = useRef<{
    slug: string;
    subscription: StompSubscription;
  } | null>(null);
  const chatSubscriptionRef = useRef<{
    slug: string;
    subscription: StompSubscription;
  } | null>(null);
  const userEventSubscriptionRef = useRef<{
    slug: string;
    subscription: StompSubscription;
  } | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const pendingChatSendCountRef = useRef(0);

  const [status, setStatus] = useState<JoinStatus>("joining");
  const [joinErrorMessage, setJoinErrorMessage] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
  const [livePlaybackStatus, setLivePlaybackStatus] =
    useState<PlaybackState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatHistoryCursor, setChatHistoryCursor] = useState<number | null>(
    null,
  );
  const [hasOlderChatMessages, setHasOlderChatMessages] = useState(false);
  const [chatHistoryErrorMessage, setChatHistoryErrorMessage] = useState("");
  const [chatSendErrorMessage, setChatSendErrorMessage] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const floatingWidgets = useFloatingWidgetsState();

  const { data: roomState, refetch: refetchRoomState } = useRoomState(
    slug,
    roomPassword,
    status === "joined",
  );
  const { data: roomMeta } = useRoomMeta(status === "joined" ? slug : null);
  const { data: currentUser, isLoading: isCurrentUserLoading } = useMe();
  const {
    mutateAsync: loadRoomChats,
    isPending: isLoadingOlderChatMessages,
  } = useRoomChats();
  const playbackStatus = getLatestPlaybackState(
    roomState?.playbackStatus,
    livePlaybackStatus?.roomSlug === slug ? livePlaybackStatus : null,
  );
  const isCurrentUserRoomOwner = isRoomOwner(roomMeta?.owner, currentUser);
  const currentVideoId = getCurrentVideoId(roomState, playbackStatus);
  const currentRequester = getCurrentRequesterProfile(roomState);
  const currentTrack = roomState?.currentEntry?.track ?? null;
  const currentTrackTitle = currentTrack?.title ?? null;
  const currentTrackDurationMs = currentTrack?.durationMs ?? null;
  const isCurrentRequesterRoomOwner = isRoomOwner(
    roomMeta?.owner,
    currentRequester,
  );

  const resetChatState = useCallback(() => {
    pendingChatSendCountRef.current = 0;
    setChatMessages([]);
    setChatHistoryCursor(null);
    setHasOlderChatMessages(false);
    setChatHistoryErrorMessage("");
    setChatSendErrorMessage("");
    setIsChatSending(false);
  }, []);

  const initializeChatState = useCallback((messages: ChatMessage[]) => {
    const recentMessages = mergeUniqueChatMessages(messages);

    pendingChatSendCountRef.current = 0;
    setChatMessages(recentMessages);
    setChatHistoryCursor(getOldestMessageId(recentMessages));
    setHasOlderChatMessages(recentMessages.length > 0);
    setChatHistoryErrorMessage("");
    setChatSendErrorMessage("");
    setIsChatSending(false);
  }, []);

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

  const cleanupChatSubscription = useCallback(() => {
    if (!chatSubscriptionRef.current) {
      return;
    }

    try {
      chatSubscriptionRef.current.subscription.unsubscribe();
    } catch {
      // The socket may already be closing while the page is leaving.
    }

    chatSubscriptionRef.current = null;
  }, []);

  const cleanupUserEventSubscription = useCallback(() => {
    if (!userEventSubscriptionRef.current) {
      return;
    }

    try {
      userEventSubscriptionRef.current.subscription.unsubscribe();
    } catch {
      // The socket may already be closing while the page is leaving.
    }

    userEventSubscriptionRef.current = null;
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
            event.type === "QUEUE_REORDERED" ||
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
            void refetchRoomState();
          }
        }),
      };
    },
    [cleanupRoomSubscription, queryClient, refetchRoomState],
  );

  const ensureChatSubscription = useCallback(
    (roomSlug: string) => {
      if (chatSubscriptionRef.current?.slug === roomSlug) {
        return;
      }

      cleanupChatSubscription();

      chatSubscriptionRef.current = {
        slug: roomSlug,
        subscription: subscribeRoomChatEvents(roomSlug, ({ body }) => {
          if (!body) return;

          let event: WsEvent;
          try {
            event = JSON.parse(body) as WsEvent;
          } catch {
            return;
          }

          if (
            event.roomSlug !== roomSlug ||
            event.type !== "CHAT_MESSAGE" ||
            !isChatMessageData(event.data)
          ) {
            return;
          }

          const chatMessage = event.data;
          setChatMessages((currentMessages) =>
            mergeUniqueChatMessages([...currentMessages, chatMessage]),
          );

          const currentUserValue = currentUserRef.current;
          if (
            currentUserValue?.userId != null &&
            currentUserValue.userId === chatMessage.senderId
          ) {
            setChatSendErrorMessage("");
            pendingChatSendCountRef.current = Math.max(
              0,
              pendingChatSendCountRef.current - 1,
            );
          }
        }),
      };
    },
    [cleanupChatSubscription],
  );

  const ensureUserEventSubscription = useCallback(
    (roomSlug: string) => {
      if (userEventSubscriptionRef.current?.slug === roomSlug) {
        return;
      }

      cleanupUserEventSubscription();

      userEventSubscriptionRef.current = {
        slug: roomSlug,
        subscription: subscribeUserRoomEvents(({ body }) => {
          if (!body) return;

          let event: WsEvent;
          try {
            event = JSON.parse(body) as WsEvent;
          } catch {
            return;
          }

          if (
            event.roomSlug !== roomSlug ||
            event.type !== "ERROR" ||
            pendingChatSendCountRef.current <= 0 ||
            !isWsErrorData(event.data)
          ) {
            return;
          }

          pendingChatSendCountRef.current = Math.max(
            0,
            pendingChatSendCountRef.current - 1,
          );
          setIsChatSending(false);
          setChatSendErrorMessage(
            event.data.message || "채팅을 전송하지 못했습니다.",
          );
        }),
      };
    },
    [cleanupUserEventSubscription],
  );

  const handleLoadOlderChatMessages = useCallback(() => {
    if (
      !slug ||
      !currentUser ||
      !hasOlderChatMessages ||
      isLoadingOlderChatMessages
    ) {
      return;
    }

    if (typeof chatHistoryCursor !== "number") {
      setHasOlderChatMessages(false);
      return;
    }

    setChatHistoryErrorMessage("");

    void (async () => {
      try {
        const result = await loadRoomChats({
          cursorId: chatHistoryCursor,
          size: CHAT_HISTORY_PAGE_SIZE,
          slug,
        });
        const olderMessages = result.items
          .filter(isChatMessageData)
          .reverse();

        setChatMessages((currentMessages) =>
          mergeUniqueChatMessages([...olderMessages, ...currentMessages]),
        );
        setChatHistoryCursor(result.nextCursor);
        setHasOlderChatMessages(
          result.hasNext && typeof result.nextCursor === "number",
        );
      } catch (error) {
        const err = error as ApiError;
        setChatHistoryErrorMessage(
          err.message || "이전 채팅을 불러오지 못했습니다.",
        );
      }
    })();
  }, [
    chatHistoryCursor,
    currentUser,
    hasOlderChatMessages,
    isLoadingOlderChatMessages,
    loadRoomChats,
    slug,
  ]);

  const handleSendChatMessage = useCallback(
    (message: string) => {
      const trimmedMessage = message.trim();

      if (!slug || status !== "joined") {
        setChatSendErrorMessage("방 입장 후 채팅할 수 있습니다.");
        return false;
      }

      if (!currentUser) {
        setChatSendErrorMessage("로그인 후 채팅할 수 있습니다.");
        return false;
      }

      if (!trimmedMessage) {
        setChatSendErrorMessage("채팅 내용을 입력해주세요.");
        return false;
      }

      if (trimmedMessage.length > MAX_CHAT_CONTENT_LENGTH) {
        setChatSendErrorMessage("채팅은 200자 이하로 입력해주세요.");
        return false;
      }

      setChatSendErrorMessage("");
      setIsChatSending(true);
      pendingChatSendCountRef.current += 1;

      try {
        publishChatMessage(slug, {
          content: trimmedMessage,
          messageType: "TEXT",
        });
        setIsChatSending(false);
        return true;
      } catch (error) {
        pendingChatSendCountRef.current = Math.max(
          0,
          pendingChatSendCountRef.current - 1,
        );
        setIsChatSending(false);
        setChatSendErrorMessage(
          error instanceof Error
            ? error.message
            : "채팅 전송 요청을 보내지 못했습니다.",
        );
        return false;
      }
    },
    [currentUser, slug, status],
  );

  async function handlePasswordSubmit(password: string) {
    if (!slug) return;

    setIsSubmittingPassword(true);
    setJoinErrorMessage("");

    try {
      const joinResult = await joinRoom(slug, { password });
      writeStoredRoomJoinPassword(slug, password);
      initializeChatState(getRecentChatMessages(joinResult.data));
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
    const storedPassword = readStoredRoomJoinPassword(slug);
    setRoomPassword(null);
    setJoinErrorMessage("");
    resetChatState();

    if (
      joinRequestRef.current?.slug !== slug ||
      joinRequestRef.current.password !== storedPassword
    ) {
      joinRequestRef.current = {
        slug,
        password: storedPassword,
        promise: joinRoom(slug, { password: storedPassword }),
      };
    }

    const currentJoinRequest = joinRequestRef.current;
    if (!currentJoinRequest) return;

    (async () => {
      try {
        const joinResult = await currentJoinRequest.promise;
        if (!isActive) return;

        initializeChatState(getRecentChatMessages(joinResult.data));
        ensureRoomSubscription(slug);
        setRoomPassword(storedPassword);
        setStatus("joined");
        setJoinErrorMessage("");
      } catch (error) {
        if (!isActive) return;

        const err = error as ApiError;
        setJoinErrorMessage(err.message ?? "방에 입장할 수 없습니다.");

        if (storedPassword) {
          clearStoredRoomJoinPassword(slug);
          setStatus("needs-password");
          return;
        }

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
  }, [
    cleanupRoomSubscription,
    ensureRoomSubscription,
    initializeChatState,
    resetChatState,
    slug,
  ]);

  useEffect(() => {
    currentUserRef.current = currentUser ?? null;
  }, [currentUser]);

  useEffect(() => {
    if (status !== "joined" || !slug || !currentUser) {
      cleanupChatSubscription();
      cleanupUserEventSubscription();
      return;
    }

    ensureChatSubscription(slug);
    ensureUserEventSubscription(slug);

    return () => {
      cleanupChatSubscription();
      cleanupUserEventSubscription();
    };
  }, [
    cleanupChatSubscription,
    cleanupUserEventSubscription,
    currentUser,
    ensureChatSubscription,
    ensureUserEventSubscription,
    slug,
    status,
  ]);

  useEffect(() => {
    if (!slug || status !== "joined") {
      return;
    }

    void refetchRoomState();
  }, [refetchRoomState, slug, status]);

  useEffect(() => {
    setLivePlaybackStatus(null);
  }, [slug]);

  const chatDisabledReason = isCurrentUserLoading
    ? "로그인 상태 확인 중입니다."
    : currentUser
      ? undefined
      : "로그인 후 채팅할 수 있습니다.";

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
          <RoomInfo
            slug={slug}
            isRoom
            trailingContent={
              isCurrentUserRoomOwner ? (
                <div className={styles.roomActions}>
                  <UpdateRoomButton slug={slug} />
                </div>
              ) : null
            }
          />
          <div className={styles.songInfoStack}>
            <YouTubePlayer
              key={slug}
              videoId={currentVideoId}
              playbackStatus={playbackStatus?.status ?? null}
              currentTimeMs={playbackStatus?.currentTime ?? null}
            />
            {currentRequester ? (
              <CurrentRequesterCard
                durationMs={currentTrackDurationMs}
                isOwner={isCurrentRequesterRoomOwner}
                requester={currentRequester}
                roomSlug={slug}
                trackTitle={currentTrackTitle}
              />
            ) : null}
          </div>
          <div className={styles.chatSection}>
            <ChatArea
              errorMessage={chatHistoryErrorMessage}
              hasOlderMessages={Boolean(currentUser) && hasOlderChatMessages}
              isLoadingOlderMessages={isLoadingOlderChatMessages}
              messages={chatMessages}
              onLoadOlderMessages={handleLoadOlderChatMessages}
            />
          </div>
          <div className={styles.controlBarDock}>
            <RoomButtonControlBar
              isChatOpen={floatingWidgets.widgets.chat.isOpen}
              isParticipantsOpen={floatingWidgets.widgets.participants.isOpen}
              isProfileOpen={floatingWidgets.widgets.profile.isOpen}
              isQueueOpen={floatingWidgets.widgets.queue.isOpen}
              onToggleChat={() => floatingWidgets.toggleWidget("chat")}
              onToggleParticipants={() =>
                floatingWidgets.toggleWidget("participants")
              }
              onToggleProfile={() => floatingWidgets.toggleWidget("profile")}
              onToggleQueue={() => floatingWidgets.toggleWidget("queue")}
            />
          </div>
        </div>
      </div>
      <RoomFloatingWidgets
        chatDisabledReason={chatDisabledReason}
        chatErrorMessage={chatSendErrorMessage}
        currentRequester={currentRequester}
        currentTrackTitle={currentTrackTitle}
        currentUser={currentUser ?? null}
        isChatSending={isChatSending}
        isCurrentUserLoading={isCurrentUserLoading}
        onSendChatMessage={handleSendChatMessage}
        participants={roomState?.participants ?? []}
        roomMeta={roomMeta ?? null}
        roomPassword={roomPassword}
        roomSlug={slug}
        widgets={floatingWidgets.widgets}
        onActivateWidget={floatingWidgets.activateWidget}
        onWidgetStop={floatingWidgets.handleWidgetStop}
      />
    </div>
  );
}
