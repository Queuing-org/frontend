"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRoomPlayback } from "@/src/features/playlist/model/useRoomPlayback";
import { useRoomParticipants } from "@/src/features/playlist/model/useRoomParticipants";
import { roomMetaQueryOptions } from "@/src/features/room/hooks/useRoomMeta";
import type { JoinRoomResult } from "@/src/features/room/api/joinRoom";
import { ApiError } from "@/src/shared/api/api-error";
import { useMediaQuery } from "@/src/shared/lib/useMediaQuery";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import {
  clearStoredRoomAccessToken,
  readStoredRoomAccessToken,
  writeStoredRoomAccessToken,
} from "@/src/features/room/join/lib/roomAccessTokenStorage";
import {
  isRoomAccessDeniedError,
  isRoomNotFoundError,
  shouldKeepPasswordFormAfterSubmit,
} from "@/src/features/room/join/model/roomJoinErrors";
import {
  consumeRoomJoinHandoff,
  type RoomJoinTarget,
} from "@/src/features/room/join/model/roomJoinHandoff";
import { useRoomJoinTransition } from "@/src/features/room/join/model/useRoomJoinTransition";
import RoomPasswordDialog from "@/src/features/room/join/ui/RoomPasswordDialog";
import RoomJoinConflictDialog from "@/src/features/room/join/ui/RoomJoinConflictDialog";
import styles from "./RoomPlaybackScreen.module.css";
import { useFloatingWidgetsState } from "@/src/features/room/floating/model/useFloatingWidgetsState";
import { useRoomChat } from "@/src/features/room/chat/hooks/useRoomChat";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import type { RoomMeta } from "@/src/features/room/model/types";
import { createRoomParticipantPageCoordinator } from "@/src/features/room/participants/model/roomParticipantPaging";
import type { LivePlaybackState } from "../hooks/useRoomPlaybackViewModel";
import { useRoomRealtimeEvents } from "../hooks/useRoomRealtimeEvents";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { MOBILE_VIEWPORT_MEDIA_QUERY } from "@/src/shared/lib/viewportDensity";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import RoomPlaybackJoinedContent, {
  type MobileRoomTab,
} from "./RoomPlaybackJoinedContent";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";

function roomRequiresPassword(roomMeta: RoomMeta) {
  return !roomMeta.isPublic;
}

export default function RoomPlaybackScreen() {
  const params = useParams<{ slug: string }>();
  const { replace } = useRouter();
  const { notify } = useActionFeedback();
  const isMobileLayout = useMediaQuery(MOBILE_VIEWPORT_MEDIA_QUERY);
  const slug = normalizeRoomSlug(params.slug ?? "");
  const queryClient = useQueryClient();
  const activeJoinAbortControllerRef = useRef<AbortController | null>(null);
  const [joinStateSlug, setJoinStateSlug] = useState(slug);
  const [status, setStatus] = useState<JoinStatus>("joining");
  const [joinErrorMessage, setJoinErrorMessage] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [roomAccessToken, setRoomAccessToken] = useState<string | null>(null);
  const [livePlaybackStatus, setLivePlaybackStatus] =
    useState<LivePlaybackState | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileRoomTab>("playback");
  const floatingWidgets = useFloatingWidgetsState();
  const isJoinStateForCurrentSlug = joinStateSlug === slug;
  const currentStatus = isJoinStateForCurrentSlug ? status : "joining";
  const currentJoinErrorMessage = isJoinStateForCurrentSlug
    ? joinErrorMessage
    : "";
  const currentRoomAccessToken = isJoinStateForCurrentSlug
    ? roomAccessToken
    : null;

  const {
    data: roomPlayback,
    error: roomPlaybackError,
    isError: isRoomPlaybackError,
    isLoading: isRoomPlaybackLoading,
    refetch: refetchRoomPlayback,
  } = useRoomPlayback(
    slug,
    currentRoomAccessToken,
    currentStatus === "joined",
  );
  const {
    data: participantPages,
    error: participantsError,
    fetchNextPage: fetchNextParticipantsPage,
    hasNextPage: hasNextParticipantsPage = false,
    isError: isParticipantsError,
    isFetchNextPageError: isParticipantsLoadMoreError,
    isFetchingNextPage: isFetchingNextParticipantsPage,
    isLoading: isParticipantsLoading,
    refetch: refetchParticipants,
  } = useRoomParticipants(
    slug,
    currentRoomAccessToken,
    currentStatus === "joined",
  );
  const participants = useMemo(
    () => participantPages?.pages.flatMap((page) => page.items) ?? [],
    [participantPages],
  );
  const participantPageCoordinator = useMemo(
    () => createRoomParticipantPageCoordinator(slug),
    [slug],
  );
  useEffect(() => {
    participantPageCoordinator.update(
      {
        hasNextPage: hasNextParticipantsPage,
        pages: participantPages?.pages ?? [],
      },
      async () => {
        const nextPageResult = await fetchNextParticipantsPage();

        return {
          hasNextPage: Boolean(nextPageResult.hasNextPage),
          pages: nextPageResult.data?.pages ?? [],
        };
      },
    );
  }, [
    fetchNextParticipantsPage,
    hasNextParticipantsPage,
    participantPageCoordinator,
    participantPages,
  ]);
  const handleLoadNextParticipantsPage = useCallback(
    () => participantPageCoordinator.loadNextPage(),
    [participantPageCoordinator],
  );
  const resolveParticipantByUserSlug = useCallback(
    (userSlug: string) =>
      participantPageCoordinator.resolveParticipantByUserSlug(userSlug),
    [participantPageCoordinator],
  );
  const { data: currentUser, isLoading: isCurrentUserLoading } = useMe();
  const roomChat = useRoomChat({
    currentUser: currentUser ?? null,
    isEnabled: currentStatus === "joined",
    roomAccessToken: currentRoomAccessToken,
    slug,
  });
  const {
    cleanupSubscriptions: cleanupChatSubscriptions,
    initializeFromJoinData: initializeChatStateFromJoinData,
    reset: resetChatState,
  } = roomChat;
  const { ensureRoomSubscription, leaveRoomSession } =
    useRoomRealtimeEvents({
      cleanupChatSubscriptions,
      initializeChatStateFromJoinData,
      onRoomAccessTokenChanged: setRoomAccessToken,
      resetChatState,
      setJoinErrorMessage,
      setLivePlaybackStatus,
      setStatus,
      slug,
    });

  const refreshRoomMetaAfterJoin = useCallback(
    (joinedRoomSlug: string) => {
      const queryKey = roomMetaQueryOptions(joinedRoomSlug).queryKey;

      queryClient.setQueryData<RoomMeta>(queryKey, (current) =>
        current
          ? {
              ...current,
              activeUsersCount: Math.max(current.activeUsersCount, 1),
            }
          : current,
      );
      void queryClient.refetchQueries({ queryKey, type: "all" });
    },
    [queryClient],
  );

  const completeJoin = useCallback((
    joinResult: JoinRoomResult,
    target: RoomJoinTarget,
  ) => {
    const joinedAccessToken = joinResult.data.roomAccessToken.trim();
    writeStoredRoomAccessToken(target.slug, joinedAccessToken);
    initializeChatStateFromJoinData(joinResult.data);
    ensureRoomSubscription(target.slug, joinedAccessToken);
    refreshRoomMetaAfterJoin(target.slug);
    setJoinStateSlug(target.slug);
    setRoomAccessToken(joinedAccessToken);
    setStatus("joined");
    setJoinErrorMessage("");
  }, [
    ensureRoomSubscription,
    initializeChatStateFromJoinData,
    refreshRoomMetaAfterJoin,
  ]);
  const {
    cancelTransition: cancelJoinTransition,
    conflict: joinConflict,
    confirmJoin: confirmConflictingJoin,
    isPending: isJoinTransitionPending,
    requestJoin,
    returnToCurrentRoom,
  } = useRoomJoinTransition({ onJoined: completeJoin });

  const returnHomeFromMissingRoom = useCallback(() => {
    clearStoredRoomAccessToken(slug);
    replace("/");
  }, [replace, slug]);

  async function handlePasswordSubmit(password: string) {
    if (!slug) return;

    setJoinStateSlug(slug);
    setIsSubmittingPassword(true);
    setJoinErrorMessage("");

    try {
      await requestJoin({ password, slug });
    } catch (error) {
      if (isRoomNotFoundError(error)) {
        returnHomeFromMissingRoom();
        return;
      }

      const err = error as ApiError;
      const message = err.message ?? "방에 입장할 수 없습니다.";
      setJoinErrorMessage(message);
      notify({
        dedupeKey: `room-join:${slug}:password`,
        message,
        tone: "error",
      });

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

    const abortController = new AbortController();
    activeJoinAbortControllerRef.current?.abort();
    activeJoinAbortControllerRef.current = abortController;
    const storedAccessToken = readStoredRoomAccessToken(slug);
    resetChatState();

    (async () => {
      let requiresPassword = false;

      try {
        await Promise.resolve();
        if (abortController.signal.aborted) return;

        const handoff = consumeRoomJoinHandoff(slug);
        if (handoff) {
          try {
            completeJoin(handoff.result, handoff.target);
          } finally {
            handoff.releaseSocketSession();
          }
          return;
        }

        const roomMeta = await queryClient.fetchQuery(
          roomMetaQueryOptions(slug),
        );
        if (abortController.signal.aborted) return;

        requiresPassword = roomRequiresPassword(roomMeta);
        if (!storedAccessToken && requiresPassword) {
          setJoinStateSlug(slug);
          setRoomAccessToken(null);
          setJoinErrorMessage("");
          setStatus("needs-password");
          return;
        }

        if (storedAccessToken) {
          try {
            await requestJoin({ accessToken: storedAccessToken, slug });
          } catch (error) {
            if (!isRoomAccessDeniedError(error)) {
              throw error;
            }

            clearStoredRoomAccessToken(slug);
            setRoomAccessToken(null);
            if (requiresPassword) {
              const deniedError = error as ApiError;
              setJoinStateSlug(slug);
              setJoinErrorMessage(
                deniedError.message ?? "방에 입장할 수 없습니다.",
              );
              setStatus("needs-password");
              return;
            }

            await requestJoin({ slug });
          }
        } else {
          await requestJoin({ slug });
        }
        if (abortController.signal.aborted) return;
      } catch (error) {
        if (abortController.signal.aborted) return;

        if (isRoomNotFoundError(error)) {
          returnHomeFromMissingRoom();
          return;
        }

        const err = error as ApiError;

        if (requiresPassword && isRoomAccessDeniedError(err)) {
          clearStoredRoomAccessToken(slug);
          setJoinStateSlug(slug);
          setRoomAccessToken(null);
          setJoinErrorMessage(err.message);
          setStatus("needs-password");
          return;
        }

        setJoinStateSlug(slug);
        setRoomAccessToken(null);
        setJoinErrorMessage(err.message ?? "방에 입장할 수 없습니다.");
        setStatus("error");
      } finally {
        if (activeJoinAbortControllerRef.current === abortController) {
          activeJoinAbortControllerRef.current = null;
        }
      }
    })();

    return () => {
      abortController.abort();
      activeJoinAbortControllerRef.current = null;
      cancelJoinTransition();
      leaveRoomSession();
    };
  }, [
    cancelJoinTransition,
    completeJoin,
    leaveRoomSession,
    queryClient,
    requestJoin,
    resetChatState,
    returnHomeFromMissingRoom,
    slug,
  ]);

  const joinConflictDialog = (
    <RoomJoinConflictDialog
      conflict={joinConflict}
      isPending={isJoinTransitionPending}
      onConfirm={() => void confirmConflictingJoin()}
      onReturn={returnToCurrentRoom}
    />
  );

  if (currentStatus === "needs-password") {
    return (
      <>
        <div className={styles.passwordState} aria-hidden="true" />
        <RoomPasswordDialog
          key={slug}
          errorMessage={currentJoinErrorMessage}
          open
          onClose={() => replace("/")}
          onPasswordChange={() => setJoinErrorMessage("")}
          onSubmit={handlePasswordSubmit}
          submitting={isSubmittingPassword}
        />
        {joinConflictDialog}
      </>
    );
  }

  if (currentStatus === "joining") {
    return (
      <>
        <div className={styles.statusState}>
          <LoadingSpinner ariaLabel="방 입장 중" size={28} />
        </div>
        {joinConflictDialog}
      </>
    );
  }

  if (currentStatus === "error") {
    return (
      <>
        <div className={styles.statusState}>
          {currentJoinErrorMessage || "방에 입장할 수 없습니다."}
        </div>
        {joinConflictDialog}
      </>
    );
  }

  if (!currentRoomAccessToken) {
    return (
      <div className={styles.statusState} role="alert">
        방 접근 정보를 확인하지 못했습니다.
      </div>
    );
  }

  if (isRoomPlaybackLoading || isParticipantsLoading) {
    return (
      <div className={styles.statusState}>
        <LoadingSpinner ariaLabel="방 상태 로딩 중" size={28} />
      </div>
    );
  }

  if (isRoomPlaybackError || (isParticipantsError && !participantPages)) {
    return (
      <div className={styles.statusState} role="alert">
        <span>
          {roomPlaybackError?.message ||
            participantsError?.message ||
            "방 상태를 불러오지 못했습니다."}
        </span>
        <button
          type="button"
          className={styles.statusRetryButton}
          onClick={() => {
            void Promise.all([refetchRoomPlayback(), refetchParticipants()]);
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <QueryBoundary
      fallback={
        <div className={styles.statusState}>
          <LoadingSpinner ariaLabel="방 정보 로딩 중" size={28} />
        </div>
      }
      errorTitle="방 정보를 불러오지 못했습니다."
      resetKeys={[slug]}
    >
      <RoomPlaybackJoinedContent
        currentUser={currentUser ?? null}
        floatingWidgets={floatingWidgets}
        hasNextParticipantsPage={hasNextParticipantsPage}
        isCurrentUserLoading={isCurrentUserLoading}
        isFetchingNextParticipantsPage={isFetchingNextParticipantsPage}
        isMobileLayout={isMobileLayout}
        isParticipantsLoadMoreError={isParticipantsLoadMoreError}
        livePlaybackStatus={livePlaybackStatus}
        mobileTab={mobileTab}
        onLeaveRoom={() =>
          leaveRoomSession({ requirePublishSuccess: true })
        }
        onLoadMoreParticipants={handleLoadNextParticipantsPage}
        resolveParticipantByUserSlug={resolveParticipantByUserSlug}
        roomChat={roomChat}
        roomAccessToken={currentRoomAccessToken}
        participants={participants}
        roomPlayback={roomPlayback}
        setMobileTab={setMobileTab}
        slug={slug}
      />
    </QueryBoundary>
  );
}
