"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useParams } from "next/navigation";
import { useRoomState } from "@/src/features/playlist/model/useRoomState";
import { fetchRoomMeta } from "@/src/features/room/api/fetchRoomMeta";
import { useRoomMeta } from "@/src/features/room/hooks/useRoomMeta";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/features/room/api/joinRoom";
import { ApiError } from "@/src/shared/api/api-error";
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
import styles from "./RoomPlaybackScreen.module.css";
import RoomInfo from "@/src/features/room/info/ui/RoomInfo";
import RoomButtonControlBar from "@/src/features/room/control-bar/ui/RoomControlBar";
import { useFloatingWidgetsState } from "@/src/features/room/floating/model/useFloatingWidgetsState";
import RoomFloatingWidgets from "@/src/features/room/floating/ui/RoomFloatingWidgets";
import ChatArea from "@/src/features/room/chat/ui/ChatArea";
import RoomChatComposer from "@/src/features/room/chat/ui/RoomChatComposer";
import { useRoomChat } from "@/src/features/room/chat/hooks/useRoomChat";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import type { RoomStateSnapshot } from "@/src/features/playlist/model/types";
import type { User } from "@/src/features/user/model/types";
import type { RoomMeta } from "@/src/features/room/model/types";
import RoomQueuePanel from "@/src/features/room/queue/ui/RoomQueuePanel";
import RoomParticipantsPanel from "@/src/features/room/participants/ui/RoomParticipantsPanel";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import SkipTrackButton from "@/src/features/playlist/skip-track/ui/SkipTrackButton";
import {
  useRoomPlaybackViewModel,
  type LivePlaybackState,
} from "../hooks/useRoomPlaybackViewModel";
import { useRoomRealtimeEvents } from "../hooks/useRoomRealtimeEvents";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";
type MobileRoomTab = "playback" | "queue" | "participants";

const MOBILE_ROOM_TABS: {
  id: MobileRoomTab;
  iconSrc: string;
  label: string;
}[] = [
  { id: "playback", iconSrc: "/icons/round_arrow.svg", label: "재생" },
  { id: "queue", iconSrc: "/icons/queue.svg", label: "큐" },
  { id: "participants", iconSrc: "/icons/hambuger.svg", label: "참가자" },
];

function roomRequiresPassword(roomMeta: RoomMeta) {
  return !roomMeta.isPublic;
}

function isPasswordRequiredError(error: ApiError) {
  return (
    error.code === "room.password-required" ||
    error.code === "room.invalid-password" ||
    error.code === "room.password-invalid" ||
    error.message.includes("비밀번호")
  );
}

function shouldKeepPasswordFormAfterSubmit(error: ApiError) {
  return (
    isPasswordRequiredError(error) ||
    error.status === 400 ||
    error.status === 403
  );
}

export default function RoomPlaybackScreen() {
  const params = useParams<{ slug: string }>();
  const isMobileLayout = useMediaQuery("(max-width: 760px)");
  const slug = normalizeRoomSlug(params.slug ?? "");
  const joinRequestRef = useRef<{
    slug: string;
    password: string | null;
    promise: Promise<JoinRoomResult>;
  } | null>(null);
  const [joinStateSlug, setJoinStateSlug] = useState(slug);
  const [status, setStatus] = useState<JoinStatus>("joining");
  const [joinErrorMessage, setJoinErrorMessage] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
  const [livePlaybackStatus, setLivePlaybackStatus] =
    useState<LivePlaybackState | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileRoomTab>("playback");
  const floatingWidgets = useFloatingWidgetsState();
  const isJoinStateForCurrentSlug = joinStateSlug === slug;
  const currentStatus = isJoinStateForCurrentSlug ? status : "joining";
  const currentJoinErrorMessage = isJoinStateForCurrentSlug
    ? joinErrorMessage
    : "";
  const currentRoomPassword = isJoinStateForCurrentSlug ? roomPassword : null;

  const {
    data: roomState,
    error: roomStateError,
    isError: isRoomStateError,
    isLoading: isRoomStateLoading,
    refetch: refetchRoomState,
  } = useRoomState(slug, currentRoomPassword, currentStatus === "joined");
  const { data: currentUser, isLoading: isCurrentUserLoading } = useMe();
  const roomChat = useRoomChat({
    currentUser: currentUser ?? null,
    isEnabled: currentStatus === "joined",
    roomPassword: currentRoomPassword,
    slug,
  });
  const {
    cleanupSubscriptions: cleanupChatSubscriptions,
    initializeFromJoinData: initializeChatStateFromJoinData,
    reset: resetChatState,
  } = roomChat;
  const { cleanupRoomSubscription, ensureRoomSubscription } =
    useRoomRealtimeEvents({
      cleanupChatSubscriptions,
      refetchRoomState,
      resetChatState,
      setJoinErrorMessage,
      setLivePlaybackStatus,
      setStatus,
      slug,
    });

  async function handlePasswordSubmit(password: string) {
    if (!slug) return;

    setJoinStateSlug(slug);
    setIsSubmittingPassword(true);
    setJoinErrorMessage("");

    try {
      const joinResult = await joinRoom(slug, { password });
      writeStoredRoomJoinPassword(slug, password);
      initializeChatStateFromJoinData(joinResult.data);
      setJoinStateSlug(slug);
      setRoomPassword(password);
      ensureRoomSubscription(slug, password);
      setStatus("joined");
      setJoinErrorMessage("");
    } catch (error) {
      const err = error as ApiError;
      setJoinErrorMessage(err.message ?? "방에 입장할 수 없습니다.");

      if (shouldKeepPasswordFormAfterSubmit(err)) {
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
    joinRequestRef.current = null;
    resetChatState();

    (async () => {
      let requiresPassword = false;
      let joinPassword: string | null = null;

      try {
        const roomMeta = await fetchRoomMeta(slug);
        if (!isActive) return;

        requiresPassword = roomRequiresPassword(roomMeta);
        joinPassword = requiresPassword ? storedPassword : null;

        if (!requiresPassword && storedPassword) {
          clearStoredRoomJoinPassword(slug);
        }

        if (requiresPassword && !joinPassword) {
          joinRequestRef.current = null;
          setJoinStateSlug(slug);
          setRoomPassword(null);
          setJoinErrorMessage("비밀번호 입력이 필요한 방입니다.");
          setStatus("needs-password");
          return;
        }

        if (
          joinRequestRef.current?.slug !== slug ||
          joinRequestRef.current.password !== joinPassword
        ) {
          joinRequestRef.current = {
            slug,
            password: joinPassword,
            promise: joinRoom(
              slug,
              joinPassword ? { password: joinPassword } : {},
            ),
          };
        }

        const currentJoinRequest = joinRequestRef.current;
        if (!currentJoinRequest) return;

        const joinResult = await currentJoinRequest.promise;
        if (!isActive) return;

        initializeChatStateFromJoinData(joinResult.data);
        ensureRoomSubscription(slug, joinPassword);
        setJoinStateSlug(slug);
        setRoomPassword(joinPassword);
        setStatus("joined");
        setJoinErrorMessage("");
      } catch (error) {
        if (!isActive) return;

        const err = error as ApiError;

        if (joinPassword) {
          clearStoredRoomJoinPassword(slug);
          setJoinStateSlug(slug);
          setRoomPassword(null);
          setJoinErrorMessage(err.message ?? "방에 입장할 수 없습니다.");
          setStatus("needs-password");
          return;
        }

        if (requiresPassword && isPasswordRequiredError(err)) {
          setJoinStateSlug(slug);
          setRoomPassword(null);
          setJoinErrorMessage("비밀번호 입력이 필요한 방입니다.");
          setStatus("needs-password");
          return;
        }

        setJoinStateSlug(slug);
        setRoomPassword(null);
        setJoinErrorMessage(err.message ?? "방에 입장할 수 없습니다.");
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
    if (!slug || currentStatus !== "joined") {
      return;
    }

    void refetchRoomState();
  }, [currentStatus, refetchRoomState, slug]);

  if (currentStatus === "needs-password") {
    return (
      <div className={styles.passwordState}>
        <RoomPasswordInput
          message={currentJoinErrorMessage}
          onSubmit={handlePasswordSubmit}
          submitting={isSubmittingPassword}
        />
      </div>
    );
  }

  if (currentStatus === "joining") {
    return <div className={styles.statusState}>입장 중...</div>;
  }

  if (currentStatus === "error") {
    return (
      <div className={styles.statusState}>
        {currentJoinErrorMessage || "방에 입장할 수 없습니다."}
      </div>
    );
  }

  if (isRoomStateLoading) {
    return <div className={styles.statusState}>방 상태를 불러오는 중...</div>;
  }

  if (isRoomStateError) {
    return (
      <div className={styles.statusState} role="alert">
        <span>
          {roomStateError?.message || "방 상태를 불러오지 못했습니다."}
        </span>
        <button
          type="button"
          className={styles.statusRetryButton}
          onClick={() => {
            void refetchRoomState();
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <QueryBoundary
      fallback={<div className={styles.statusState}>방 정보를 불러오는 중...</div>}
      errorTitle="방 정보를 불러오지 못했습니다."
      resetKeys={[slug]}
    >
      <RoomPlaybackJoinedContent
        currentUser={currentUser ?? null}
        floatingWidgets={floatingWidgets}
        isCurrentUserLoading={isCurrentUserLoading}
        isMobileLayout={isMobileLayout}
        livePlaybackStatus={livePlaybackStatus}
        mobileTab={mobileTab}
        roomChat={roomChat}
        roomPassword={currentRoomPassword}
        roomState={roomState}
        setMobileTab={setMobileTab}
        slug={slug}
      />
    </QueryBoundary>
  );
}

type RoomPlaybackJoinedContentProps = {
  currentUser: User | null;
  floatingWidgets: ReturnType<typeof useFloatingWidgetsState>;
  isCurrentUserLoading: boolean;
  isMobileLayout: boolean;
  livePlaybackStatus: LivePlaybackState | null;
  mobileTab: MobileRoomTab;
  roomChat: ReturnType<typeof useRoomChat>;
  roomPassword: string | null;
  roomState?: RoomStateSnapshot;
  setMobileTab: Dispatch<SetStateAction<MobileRoomTab>>;
  slug: string;
};

function RoomPlaybackJoinedContent({
  currentUser,
  floatingWidgets,
  isCurrentUserLoading,
  isMobileLayout,
  livePlaybackStatus,
  mobileTab,
  roomChat,
  roomPassword,
  roomState,
  setMobileTab,
  slug,
}: RoomPlaybackJoinedContentProps) {
  const { data: roomMeta } = useRoomMeta(slug);
  const playback = useRoomPlaybackViewModel({
    currentUser,
    livePlaybackStatus,
    roomMeta,
    roomState,
    slug,
  });
  const chatDisabledReason = isCurrentUserLoading
    ? "로그인 상태 확인 중입니다."
    : currentUser
      ? undefined
      : "로그인 후 채팅할 수 있습니다.";
  const showChatLoginAction = !isCurrentUserLoading && !currentUser;
  const {
    hasOlderMessages: hasOlderChatMessages,
    historyErrorMessage: chatHistoryErrorMessage,
    isLoadingOlderMessages,
    isSending: isChatSending,
    loadOlderMessages: handleLoadOlderChatMessages,
    messages: chatMessages,
    scrollToLatestKey: chatScrollToLatestKey,
    sendErrorMessage: chatSendErrorMessage,
    sendMessage: handleSendChatMessage,
  } = roomChat;
  const desktopWheelRegionRef = useRef<HTMLDivElement>(null);
  const mobileInlineChatRef = useRef<HTMLDivElement>(null);

  if (isMobileLayout) {
    const mobileRoomTitle = roomMeta.title;
    const mobileActiveUsersCount = roomMeta.activeUsersCount;
    const mobileTags = roomMeta.tags;

    return (
      <div className={`${styles.page} ${styles.mobilePage}`}>
        <div className={styles.mobileRoomShell}>
          <header className={styles.mobileRoomHeader}>
            <div className={styles.mobileTitleRow}>
              <h1 className={styles.mobileRoomTitle}>{mobileRoomTitle}</h1>
              <div className={styles.mobileRoomActions}>
                {playback.isCurrentUserRoomOwner ? (
                  <UpdateRoomButton
                    currentUser={currentUser}
                    roomMeta={roomMeta}
                  />
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
                {roomMeta.hasPassword ? (
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
                  videoId={playback.currentVideoId}
                  playbackStatus={playback.playbackStatus?.status ?? null}
                  currentTimeMs={playback.playbackStatus?.currentTime ?? null}
                />
                {playback.currentRequester ? (
                  <CurrentRequesterCard
                    durationMs={playback.currentTrackDurationMs}
                    isOwner={playback.isCurrentRequesterRoomOwner}
                    requester={playback.currentRequester}
                    skipAction={
                      <SkipTrackButton
                        isVisible={playback.isCurrentUserRoomOwner}
                        slug={slug}
                      />
                    }
                    trackTitle={playback.currentTrackTitle}
                  />
                ) : null}
                <div
                  ref={mobileInlineChatRef}
                  className={styles.mobileInlineChat}
                  aria-label="채팅"
                >
                  <div className={styles.mobileChatList}>
                    <ChatArea
                      errorMessage={chatHistoryErrorMessage}
                      hasOlderMessages={hasOlderChatMessages}
                      isLoadingOlderMessages={isLoadingOlderMessages}
                      messages={chatMessages}
                      onLoadOlderMessages={handleLoadOlderChatMessages}
                      scrollToLatestKey={chatScrollToLatestKey}
                      wheelRegionRef={mobileInlineChatRef}
                    />
                  </div>
                  <div className={styles.mobileChatComposer}>
                    <RoomChatComposer
                      disabledReason={chatDisabledReason}
                      errorMessage={chatSendErrorMessage}
                      isSending={isChatSending}
                      onLoginClick={redirectToGoogleLogin}
                      onSendMessage={handleSendChatMessage}
                      showLoginAction={showChatLoginAction}
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
                  roomMeta={roomMeta}
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
                  roomMeta={roomMeta}
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
          key={playback.backgroundImageSrc}
          src={playback.backgroundImageSrc}
          alt=""
          fill
          sizes="100vw"
          priority
          className={styles.backgroundImage}
        />
      </div>
      <div ref={desktopWheelRegionRef} className={styles.container}>
        <div className={styles.mainArea}>
          <RoomInfo
            roomInfo={roomMeta}
            isRoom
            trailingContent={
              playback.isCurrentUserRoomOwner ? (
                <div className={styles.roomActions}>
                  <UpdateRoomButton
                    currentUser={currentUser}
                    roomMeta={roomMeta}
                  />
                </div>
              ) : null
            }
          />
          <div className={styles.songInfoStack}>
            <YouTubePlayer
              key={slug}
              videoId={playback.currentVideoId}
              playbackStatus={playback.playbackStatus?.status ?? null}
              currentTimeMs={playback.playbackStatus?.currentTime ?? null}
            />
            {playback.currentRequester ? (
              <CurrentRequesterCard
                durationMs={playback.currentTrackDurationMs}
                isOwner={playback.isCurrentRequesterRoomOwner}
                requester={playback.currentRequester}
                skipAction={
                  <SkipTrackButton
                    isVisible={playback.isCurrentUserRoomOwner}
                    slug={slug}
                  />
                }
                trackTitle={playback.currentTrackTitle}
              />
            ) : null}
          </div>
          <div className={styles.chatSection}>
            <ChatArea
              errorMessage={chatHistoryErrorMessage}
              hasOlderMessages={hasOlderChatMessages}
              isLoadingOlderMessages={isLoadingOlderMessages}
              messages={chatMessages}
              onLoadOlderMessages={handleLoadOlderChatMessages}
              scrollToLatestKey={chatScrollToLatestKey}
              wheelRegionRef={desktopWheelRegionRef}
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
        currentRequester={playback.currentRequester}
        currentTrackTitle={playback.currentTrackTitle}
        currentUser={currentUser}
        isChatSending={isChatSending}
        isCurrentUserLoading={isCurrentUserLoading}
        onChatLoginClick={
          showChatLoginAction ? redirectToGoogleLogin : undefined
        }
        onSendChatMessage={handleSendChatMessage}
        participants={roomState?.participants ?? []}
        roomMeta={roomMeta}
        roomPassword={roomPassword}
        roomSlug={slug}
        widgets={floatingWidgets.widgets}
        onActivateWidget={floatingWidgets.activateWidget}
        onWidgetStop={floatingWidgets.handleWidgetStop}
      />
    </div>
  );
}
