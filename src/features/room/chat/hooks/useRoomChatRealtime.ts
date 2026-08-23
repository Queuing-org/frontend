"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { StompSubscription } from "@stomp/stompjs";
import { publishChatMessage } from "@/src/features/room/api/websocket/publishChatMessage";
import { subscribeRoomChatEvents } from "@/src/features/room/api/websocket/subscribeRoomChatEvents";
import { subscribeUserRoomEvents } from "@/src/features/room/api/websocket/subscribeUserRoomEvents";
import type { ChatMessage, ChatMessageDeletedData, WsEvent } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { isChatMessageFromUser } from "../model/chatMessages";
import {
  getVisibleChatSendErrorMessage,
  isWsErrorData,
  parseChatMessageEvent,
  parseChatMessageDeletedEvent,
} from "../model/chatRealtimeEvents";
import { CHAT_MAX_LENGTH } from "../constants/chat";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

type UseRoomChatRealtimeParams = {
  currentUser: User | null;
  isEnabled: boolean;
  onMessage: (message: ChatMessage) => void;
  onMessageDeleted: (data: ChatMessageDeletedData) => void;
  onPendingMessageBackfill: (
    contents: readonly string[],
  ) => Promise<readonly string[]>;
  roomAccessToken: string | null;
  slug: string;
};

const CHAT_SEND_BACKFILL_DELAY_MS = 2000;
const CHAT_SEND_CONFIRM_TIMEOUT_MS = 8000;

type PendingChatSend = {
  backfillAt: number;
  backfillAttempted: boolean;
  confirmAt: number;
  content: string;
  id: number;
};

type PendingBackfillRequest = {
  acceptsResult: boolean;
  pendingIds: ReadonlySet<number>;
  promise: Promise<readonly string[]>;
};

export function useRoomChatRealtime({
  currentUser,
  isEnabled,
  onMessage,
  onMessageDeleted,
  onPendingMessageBackfill,
  roomAccessToken,
  slug,
}: UseRoomChatRealtimeParams) {
  const { notify } = useActionFeedback();
  const currentUserSlug = currentUser?.slug ?? null;
  const onMessageRef = useRef(onMessage);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onPendingMessageBackfillRef = useRef(onPendingMessageBackfill);
  const handleChatMessageBodyRef = useRef<
    (roomSlug: string, body: string) => void
  >(() => undefined);
  const handleUserEventBodyRef = useRef<
    (roomSlug: string, body: string) => void
  >(() => undefined);
  const previousCurrentUserSlugRef = useRef(currentUserSlug);
  const chatSubscriptionRef = useRef<{
    accessToken: string;
    slug: string;
    subscription: StompSubscription;
  } | null>(null);
  const userEventSubscriptionRef = useRef<{
    slug: string;
    subscription: StompSubscription;
  } | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const pendingChatSendIdRef = useRef(0);
  const pendingChatSendsRef = useRef<PendingChatSend[]>([]);
  const pendingGenerationRef = useRef(0);
  const pendingCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pendingBackfillRequestRef = useRef<PendingBackfillRequest | null>(null);
  const runPendingCheckRef = useRef<() => void>(() => undefined);
  const [chatSendErrorMessage, setChatSendErrorMessage] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);

  useLayoutEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useLayoutEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);

  useLayoutEffect(() => {
    onPendingMessageBackfillRef.current = onPendingMessageBackfill;
  }, [onPendingMessageBackfill]);

  const showChatSendError = useCallback(
    (message: string) => {
      setChatSendErrorMessage(message);
      notify({
        dedupeKey: `chat-send:${normalizeRoomSlug(slug) || slug}`,
        message,
        tone: "error",
      });
    },
    [notify, slug],
  );

  const clearPendingCheckTimer = useCallback(() => {
    if (pendingCheckTimeoutRef.current !== null) {
      clearTimeout(pendingCheckTimeoutRef.current);
      pendingCheckTimeoutRef.current = null;
    }
  }, []);

  const clearAllPendingChatSends = useCallback(() => {
    clearPendingCheckTimer();
    pendingChatSendsRef.current = [];
    if (pendingBackfillRequestRef.current) {
      pendingBackfillRequestRef.current.acceptsResult = false;
    }
    pendingBackfillRequestRef.current = null;
    pendingGenerationRef.current += 1;
  }, [clearPendingCheckTimer]);

  const releaseOrphanedBackfillRequest = useCallback(() => {
    const request = pendingBackfillRequestRef.current;
    if (
      !request ||
      pendingChatSendsRef.current.some((pending) =>
        request.pendingIds.has(pending.id),
      )
    ) {
      return false;
    }

    request.acceptsResult = false;
    pendingBackfillRequestRef.current = null;
    return true;
  }, []);

  const schedulePendingCheck = useCallback(() => {
    clearPendingCheckTimer();

    if (pendingChatSendsRef.current.length === 0) {
      return;
    }

    const now = Date.now();
    const hasBackfillInFlight = pendingBackfillRequestRef.current !== null;
    const nextCheckAt = pendingChatSendsRef.current.reduce((earliest, pending) => {
      const isDueBackfillBlocked =
        hasBackfillInFlight &&
        !pending.backfillAttempted &&
        pending.backfillAt <= now;
      const pendingCheckAt =
        pending.backfillAttempted || isDueBackfillBlocked
          ? pending.confirmAt
          : pending.backfillAt;

      return Math.min(earliest, pendingCheckAt);
    }, Number.POSITIVE_INFINITY);
    pendingCheckTimeoutRef.current = setTimeout(() => {
      pendingCheckTimeoutRef.current = null;
      runPendingCheckRef.current();
    }, Math.max(0, nextCheckAt - Date.now()));
  }, [clearPendingCheckTimer]);

  const resolvePendingChatSend = useCallback(
    ({
      content,
      errorMessage,
      id,
    }: {
      content?: string;
      errorMessage?: string;
      id?: number;
    } = {}) => {
      const pendingIndex =
        typeof id === "number"
          ? pendingChatSendsRef.current.findIndex(
              (pending) => pending.id === id,
            )
          : content
            ? pendingChatSendsRef.current.findIndex(
                (pending) => pending.content === content,
              )
            : 0;

      if (pendingIndex < 0) {
        return false;
      }

      pendingChatSendsRef.current.splice(pendingIndex, 1);
      releaseOrphanedBackfillRequest();
      setIsChatSending(false);

      if (errorMessage) {
        showChatSendError(errorMessage);
      } else {
        setChatSendErrorMessage("");
      }

      schedulePendingCheck();

      return true;
    },
    [releaseOrphanedBackfillRequest, schedulePendingCheck, showChatSendError],
  );

  const requestPendingChatBackfill = useCallback(
    (pendingSends: readonly PendingChatSend[]) => {
      if (pendingBackfillRequestRef.current) {
        return pendingBackfillRequestRef.current;
      }

      const pendingContents = pendingSends.map((pending) => pending.content);
      const promise = (async () => {
        try {
          return await onPendingMessageBackfillRef.current(pendingContents);
        } catch {
          return [];
        }
      })();
      const request: PendingBackfillRequest = {
        acceptsResult: true,
        pendingIds: new Set(pendingSends.map((pending) => pending.id)),
        promise,
      };
      pendingBackfillRequestRef.current = request;

      return request;
    },
    [],
  );

  const resolvePersistedPendingChatSends = useCallback(
    (
      foundContents: readonly string[],
      coveredPendingIds: ReadonlySet<number>,
    ) => {
      const foundContentCounts = new Map<string, number>();
      foundContents.forEach((content) =>
        foundContentCounts.set(
          content,
          (foundContentCounts.get(content) ?? 0) + 1,
        ),
      );
      const remainingPendingSends: PendingChatSend[] = [];
      let resolvedCount = 0;

      pendingChatSendsRef.current.forEach((pending) => {
        if (!coveredPendingIds.has(pending.id)) {
          remainingPendingSends.push(pending);
          return;
        }

        const foundCount = foundContentCounts.get(pending.content) ?? 0;
        if (foundCount <= 0) {
          remainingPendingSends.push(pending);
          return;
        }

        resolvedCount += 1;
        foundContentCounts.set(pending.content, foundCount - 1);
      });
      pendingChatSendsRef.current = remainingPendingSends;

      if (resolvedCount > 0) {
        setIsChatSending(false);
        setChatSendErrorMessage("");
      }

      return resolvedCount;
    },
    [],
  );

  const expirePendingChatSends = useCallback((now: number) => {
    const expiredIds = new Set(
      pendingChatSendsRef.current
        .filter((pending) => pending.confirmAt <= now)
        .map((pending) => pending.id),
    );
    if (expiredIds.size === 0) {
      return false;
    }

    pendingChatSendsRef.current = pendingChatSendsRef.current.filter(
      (pending) => !expiredIds.has(pending.id),
    );
    releaseOrphanedBackfillRequest();
    setIsChatSending(false);
    showChatSendError("채팅 전송을 확인하지 못했습니다.");
    return true;
  }, [releaseOrphanedBackfillRequest, showChatSendError]);

  const runPendingCheck = useCallback(async () => {
    const pendingGeneration = pendingGenerationRef.current;
    const now = Date.now();
    expirePendingChatSends(now);
    const dueBackfillSends = pendingChatSendsRef.current.filter(
      (pending) => !pending.backfillAttempted && pending.backfillAt <= now,
    );

    if (dueBackfillSends.length === 0) {
      schedulePendingCheck();
      return;
    }

    if (pendingBackfillRequestRef.current) {
      schedulePendingCheck();
      return;
    }

    dueBackfillSends.forEach((pending) => {
      pending.backfillAttempted = true;
    });

    // The confirmation deadline must keep running even if this request hangs.
    schedulePendingCheck();
    const backfillRequest = requestPendingChatBackfill(dueBackfillSends);
    const foundContents = await backfillRequest.promise;
    if (
      pendingGenerationRef.current !== pendingGeneration ||
      !backfillRequest.acceptsResult
    ) {
      return;
    }
    if (pendingBackfillRequestRef.current === backfillRequest) {
      pendingBackfillRequestRef.current = null;
    }
    expirePendingChatSends(Date.now());
    resolvePersistedPendingChatSends(
      foundContents,
      backfillRequest.pendingIds,
    );
    schedulePendingCheck();
  }, [
    expirePendingChatSends,
    requestPendingChatBackfill,
    resolvePersistedPendingChatSends,
    schedulePendingCheck,
  ]);

  useEffect(() => {
    runPendingCheckRef.current = () => {
      void runPendingCheck();
    };
  }, [runPendingCheck]);

  const registerPendingChatSend = useCallback(
    (content: string) => {
      const id = (pendingChatSendIdRef.current += 1);
      const registeredAt = Date.now();

      pendingChatSendsRef.current.push({
        backfillAt: registeredAt + CHAT_SEND_BACKFILL_DELAY_MS,
        backfillAttempted: false,
        confirmAt: registeredAt + CHAT_SEND_CONFIRM_TIMEOUT_MS,
        content,
        id,
      });
      schedulePendingCheck();

      return id;
    },
    [schedulePendingCheck],
  );

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

  const cleanupChatLifecycle = useCallback(() => {
    cleanupChatSubscription();
    clearAllPendingChatSends();
  }, [cleanupChatSubscription, clearAllPendingChatSends]);

  const cleanupSubscriptions = useCallback(() => {
    cleanupChatLifecycle();
    cleanupUserEventSubscription();
  }, [cleanupChatLifecycle, cleanupUserEventSubscription]);

  const reset = useCallback(() => {
    clearAllPendingChatSends();
    setChatSendErrorMessage("");
    setIsChatSending(false);
  }, [clearAllPendingChatSends]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (previousCurrentUserSlugRef.current === currentUserSlug) {
      return;
    }

    previousCurrentUserSlugRef.current = currentUserSlug;
    clearAllPendingChatSends();
  }, [clearAllPendingChatSends, currentUserSlug]);

  const handleChatMessageBody = useCallback(
    (roomSlug: string, body: string) => {
      const deletedMessage = parseChatMessageDeletedEvent(body, roomSlug);
      if (deletedMessage) {
        onMessageDeletedRef.current(deletedMessage);
        return;
      }
      const chatMessage = parseChatMessageEvent(body, roomSlug);

      if (!chatMessage) {
        return;
      }

      onMessageRef.current(chatMessage);

      if (isChatMessageFromUser(chatMessage, currentUserRef.current)) {
        resolvePendingChatSend({ content: chatMessage.content });
      }
    },
    [resolvePendingChatSend],
  );

  useLayoutEffect(() => {
    handleChatMessageBodyRef.current = handleChatMessageBody;
  }, [handleChatMessageBody]);

  const ensureChatSubscription = useCallback(
    (roomSlug: string, accessToken: string) => {
      if (
        chatSubscriptionRef.current?.slug === roomSlug &&
        chatSubscriptionRef.current.accessToken === accessToken
      ) {
        return;
      }

      cleanupChatSubscription();

      chatSubscriptionRef.current = {
        accessToken,
        slug: roomSlug,
        subscription: subscribeRoomChatEvents(
          roomSlug,
          ({ body }) => {
            if (!body) return;

            handleChatMessageBodyRef.current(roomSlug, body);
          },
          accessToken,
        ),
      };
    },
    [cleanupChatSubscription],
  );

  const handleUserEventBody = useCallback(
    (roomSlug: string, body: string) => {
      let event: WsEvent;
      try {
        event = JSON.parse(body) as WsEvent;
      } catch {
        return;
      }

      const normalizedRoomSlug = normalizeRoomSlug(roomSlug);
      const eventRoomSlug =
        typeof event.roomSlug === "string"
          ? normalizeRoomSlug(event.roomSlug)
          : normalizedRoomSlug;

      if (
        eventRoomSlug !== normalizedRoomSlug ||
        event.type !== "ERROR" ||
        pendingChatSendsRef.current.length <= 0 ||
        !isWsErrorData(event.data)
      ) {
        return;
      }

      resolvePendingChatSend({
        errorMessage: getVisibleChatSendErrorMessage(event.data),
      });
    },
    [resolvePendingChatSend],
  );

  useLayoutEffect(() => {
    handleUserEventBodyRef.current = handleUserEventBody;
  }, [handleUserEventBody]);

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

          handleUserEventBodyRef.current(roomSlug, body);
        }),
      };
    },
    [cleanupUserEventSubscription],
  );

  const sendMessage = useCallback(
    (message: string) => {
      const trimmedMessage = message.trim();

      if (!slug || !isEnabled) {
        showChatSendError("방 입장 후 채팅할 수 있습니다.");
        return false;
      }

      if (!currentUser) {
        showChatSendError("로그인 후 채팅할 수 있습니다.");
        return false;
      }

      if (!trimmedMessage) {
        showChatSendError("채팅 내용을 입력해주세요.");
        return false;
      }

      if (trimmedMessage.length > CHAT_MAX_LENGTH) {
        showChatSendError("채팅은 200자 이하로 입력해주세요.");
        return false;
      }

      setChatSendErrorMessage("");
      setIsChatSending(true);
      const pendingChatSendId = registerPendingChatSend(trimmedMessage);

      try {
        publishChatMessage(slug, {
          content: trimmedMessage,
          messageType: "TEXT",
        });
        setIsChatSending(false);
        return true;
      } catch (error) {
        resolvePendingChatSend({
          errorMessage:
            error instanceof Error
              ? error.message
              : "채팅 전송 요청을 보내지 못했습니다.",
          id: pendingChatSendId,
        });
        return false;
      }
    },
    [
      currentUser,
      isEnabled,
      registerPendingChatSend,
      resolvePendingChatSend,
      showChatSendError,
      slug,
    ],
  );

  const hasRoomAccessToken = Boolean(roomAccessToken);

  useEffect(() => {
    if (!isEnabled || !slug || !roomAccessToken) {
      cleanupChatLifecycle();
      return;
    }

    ensureChatSubscription(slug, roomAccessToken);

    return cleanupChatLifecycle;
  }, [
    cleanupChatLifecycle,
    ensureChatSubscription,
    isEnabled,
    roomAccessToken,
    slug,
  ]);

  useEffect(() => {
    if (isEnabled && slug && hasRoomAccessToken && currentUserSlug) {
      ensureUserEventSubscription(slug);
    } else {
      cleanupUserEventSubscription();
    }

    return cleanupUserEventSubscription;
  }, [
    cleanupUserEventSubscription,
    currentUserSlug,
    ensureUserEventSubscription,
    hasRoomAccessToken,
    isEnabled,
    slug,
  ]);

  return {
    cleanupSubscriptions,
    isSending: isChatSending,
    reset,
    sendErrorMessage: chatSendErrorMessage,
    sendMessage,
  };
}
