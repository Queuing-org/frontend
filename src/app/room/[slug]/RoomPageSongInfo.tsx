"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import { useParams, useRouter } from "next/navigation";
import { useRoomState } from "@/src/entities/playlist/model/useRoomState";
import type { RoomStateSnapshot } from "@/src/entities/playlist/model/types";
import { getDefaultRoomImage } from "@/src/entities/room/lib/getDefaultRoomImage";
import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/entities/room/api/joinRoom";
import { subscribeRoomEvents } from "@/src/entities/room/api/websocket/subscribeRoomEvents";
import type {
  PlaybackSyncData,
  PlaybackStatus,
  WsErrorData,
  WsEvent,
} from "@/src/entities/room/model/types";
import { isRoomOwner } from "@/src/entities/room/lib/isRoomOwner";
import { ApiError } from "@/src/shared/api/api-error";
import { addSocketListener } from "@/src/shared/api/websocket/stompConnection";
import { useMediaQuery } from "@/src/shared/lib/useMediaQuery";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import {
  clearStoredRoomJoinPassword,
  readStoredRoomJoinPassword,
  writeStoredRoomJoinPassword,
} from "@/src/features/room/join/lib/roomJoinPasswordStorage";
import YouTubePlayer from "@/src/features/playlist/player/ui/YouTubePlayer";
import AddTrackAction from "@/src/features/playlist/add-track/ui/AddTrackAction";
import RoomPasswordInput from "@/src/features/room/join/ui/roomPasswordInput";
import UpdateRoomButton from "@/src/features/room/update/ui/UpdateRoomButton";
import CurrentRequesterCard from "@/src/features/room/current-requester/ui/CurrentRequesterCard";
import styles from "./RoomPageSongInfo.module.css";
import RoomInfo from "@/src/entities/room/ui/RoomInfo";
import RoomButtonControlBar from "@/src/widgets/room/ui/RoomControlBar";
import { useFloatingWidgetsState } from "@/src/widgets/room/model/useFloatingWidgetsState";
import RoomFloatingWidgets from "@/src/widgets/room/ui/RoomFloatingWidgets";
import ChatArea from "@/src/features/room/chat/ui/ChatArea";
import RoomChatComposer from "@/src/features/room/chat/ui/RoomChatComposer";
import { useRoomChat } from "@/src/features/room/chat/hooks/useRoomChat";
import type { CurrentRequesterProfile } from "@/src/features/room/profile/model/types";
import { useMe } from "@/src/entities/user/hooks/useMe";
import RoomQueuePanel from "@/src/features/room/queue/ui/RoomQueuePanel";
import RoomParticipantsPanel from "@/src/features/room/participants/ui/RoomParticipantsPanel";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";
type MobileRoomTab = "playback" | "queue" | "participants";

type PlaybackState = {
  roomSlug: string;
  status: PlaybackStatus;
  videoId: string;
  currentTime: number;
  serverTimestamp: number;
};

const PARTICIPANT_KICKED_ERROR_CODE = "room.participant-kicked";
const MOBILE_ROOM_TABS: {
  id: MobileRoomTab;
  iconSrc: string;
  label: string;
}[] = [
  { id: "playback", iconSrc: "/icons/round_arrow.svg", label: "재생" },
  { id: "queue", iconSrc: "/icons/queue.svg", label: "큐" },
  { id: "participants", iconSrc: "/icons/hambuger.svg", label: "참가자" },
];

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

function getStableRoomImageIndex(slug: string) {
  let hash = 0;

  for (let index = 0; index < slug.length; index += 1) {
    hash += slug.charCodeAt(index);
  }

  return hash;
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobileLayout = useMediaQuery("(max-width: 760px)");
  const slug = normalizeRoomSlug(params.slug ?? "");
  const backgroundImageSrc = getDefaultRoomImage(getStableRoomImageIndex(slug));
  const joinRequestRef = useRef<{
    slug: string;
    password: string | null;
    promise: Promise<JoinRoomResult>;
  } | null>(null);
  const roomSubscriptionRef = useRef<{
    slug: string;
    subscription: StompSubscription;
  } | null>(null);
  const hasRedirectedAfterKickRef = useRef(false);

  const [status, setStatus] = useState<JoinStatus>("joining");
  const [joinErrorMessage, setJoinErrorMessage] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
  const [livePlaybackStatus, setLivePlaybackStatus] =
    useState<PlaybackState | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileRoomTab>("playback");
  const floatingWidgets = useFloatingWidgetsState();

  const { data: roomState, refetch: refetchRoomState } = useRoomState(
    slug,
    roomPassword,
    status === "joined",
  );
  const { data: roomMeta } = useRoomMeta(status === "joined" ? slug : null);
  const { data: currentUser, isLoading: isCurrentUserLoading } = useMe();
  const {
    cleanupSubscriptions: cleanupChatSubscriptions,
    hasOlderMessages: hasOlderChatMessages,
    historyErrorMessage: chatHistoryErrorMessage,
    initializeFromJoinData: initializeChatStateFromJoinData,
    isLoadingOlderMessages,
    isSending: isChatSending,
    loadOlderMessages: handleLoadOlderChatMessages,
    messages: chatMessages,
    reset: resetChatState,
    scrollToLatestKey: chatScrollToLatestKey,
    sendErrorMessage: chatSendErrorMessage,
    sendMessage: handleSendChatMessage,
  } = useRoomChat({
    currentUser: currentUser ?? null,
    isEnabled: status === "joined",
    slug,
  });
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
        void queryClient.removeQueries({ queryKey: ["roomState", slug] });
        void queryClient.removeQueries({ queryKey: ["roomQueue", slug] });
        void queryClient.invalidateQueries({ queryKey: ["roomMeta", slug] });
        router.replace("/home");
      },
    });
  }, [
    cleanupChatSubscriptions,
    cleanupRoomSubscription,
    queryClient,
    resetChatState,
    router,
    slug,
  ]);

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

  async function handlePasswordSubmit(password: string) {
    if (!slug) return;

    setIsSubmittingPassword(true);
    setJoinErrorMessage("");

    try {
      const joinResult = await joinRoom(slug, { password });
      writeStoredRoomJoinPassword(slug, password);
      initializeChatStateFromJoinData(joinResult.data);
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

    hasRedirectedAfterKickRef.current = false;
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

        initializeChatStateFromJoinData(joinResult.data);
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
    initializeChatStateFromJoinData,
    resetChatState,
    slug,
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

  if (isMobileLayout) {
    const mobileRoomTitle = roomMeta?.title ?? "방 정보";
    const mobileActiveUsersCount = roomMeta?.activeUsersCount ?? "-";
    const mobileTags = roomMeta?.tags ?? [];

    return (
      <div className={`${styles.page} ${styles.mobilePage}`}>
        <div className={styles.mobileRoomShell}>
          <header className={styles.mobileRoomHeader}>
            <div className={styles.mobileTitleRow}>
              <h1 className={styles.mobileRoomTitle}>{mobileRoomTitle}</h1>
              <div className={styles.mobileRoomActions}>
                {isCurrentUserRoomOwner ? (
                  <UpdateRoomButton slug={slug} />
                ) : null}
                <Link
                  href="/home"
                  replace
                  className={styles.mobileExitLink}
                  aria-label="방 나가기"
                >
                  나가기
                </Link>
              </div>
            </div>
            <div className={styles.mobileMetaRow}>
              <div className={styles.mobileMetaChips}>
                <span className={styles.mobileUsersChip}>
                  {mobileActiveUsersCount}명
                </span>
                {roomMeta?.hasPassword ? (
                  <span className={styles.mobileLockChip}>비공개</span>
                ) : null}
                {mobileTags.length > 0 ? (
                  mobileTags.map((tag) => (
                    <span key={tag.slug} className={styles.mobileTagChip}>
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className={styles.mobileTagChip}>태그없음</span>
                )}
              </div>
              <AddTrackAction
                className={styles.mobileHeaderAddTrack}
                label="노래 신청"
                loginLabel="로그인"
                slug={slug}
                variant="queueDock"
              />
            </div>
          </header>
          <main className={styles.mobileRoomContent}>
            {mobileTab === "playback" ? (
              <section
                className={styles.mobilePlaybackPanel}
                aria-label="재생 화면"
              >
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
                <div className={styles.mobileInlineChat} aria-label="채팅">
                  <div className={styles.mobileChatList}>
                    <ChatArea
                      errorMessage={chatHistoryErrorMessage}
                      hasOlderMessages={
                        Boolean(currentUser) && hasOlderChatMessages
                      }
                      isLoadingOlderMessages={isLoadingOlderMessages}
                      messages={chatMessages}
                      onLoadOlderMessages={handleLoadOlderChatMessages}
                      scrollToLatestKey={chatScrollToLatestKey}
                    />
                  </div>
                  <div className={styles.mobileChatComposer}>
                    <RoomChatComposer
                      disabledReason={chatDisabledReason}
                      errorMessage={chatSendErrorMessage}
                      isSending={isChatSending}
                      onSendMessage={handleSendChatMessage}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {mobileTab === "queue" ? (
              <section className={styles.mobilePanel} aria-label="큐">
                <RoomQueuePanel
                  currentUser={currentUser ?? null}
                  isCurrentUserLoading={isCurrentUserLoading}
                  roomMeta={roomMeta ?? null}
                  roomPassword={roomPassword}
                  roomSlug={slug}
                />
              </section>
            ) : null}

            {mobileTab === "participants" ? (
              <section className={styles.mobilePanel} aria-label="참가자">
                <RoomParticipantsPanel
                  currentUser={currentUser ?? null}
                  participants={roomState?.participants ?? []}
                  roomMeta={roomMeta ?? null}
                  roomPassword={roomPassword}
                  roomSlug={slug}
                />
              </section>
            ) : null}
          </main>
          <nav className={styles.mobileTabBar} aria-label="방 기능 탭">
            {MOBILE_ROOM_TABS.map((tab) => {
              const isActive = mobileTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={styles.mobileTabButton}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileTab(tab.id)}
                  data-active={isActive}
                >
                  <Image
                    src={tab.iconSrc}
                    alt=""
                    width={20}
                    height={20}
                    className={styles.mobileTabIcon}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.backgroundImageFrame} aria-hidden="true">
        <Image
          key={backgroundImageSrc}
          src={backgroundImageSrc}
          alt=""
          fill
          priority
          className={styles.backgroundImage}
        />
      </div>
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
              isLoadingOlderMessages={isLoadingOlderMessages}
              messages={chatMessages}
              onLoadOlderMessages={handleLoadOlderChatMessages}
              scrollToLatestKey={chatScrollToLatestKey}
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
