"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import { publishChatMessage } from "@/src/entities/room/api/websocket/publishChatMessage";
import { subscribeRoomChatEvents } from "@/src/entities/room/api/websocket/subscribeRoomChatEvents";
import { subscribeRoomEvents } from "@/src/entities/room/api/websocket/subscribeRoomEvents";
import { subscribeUserRoomEvents } from "@/src/entities/room/api/websocket/subscribeUserRoomEvents";
import type {
  ChatMessage,
  WsErrorData,
  WsEvent,
} from "@/src/entities/room/model/types";
import type { User } from "@/src/entities/user/model/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import {
  isChatMessageData,
  isChatMessageFromUser,
} from "../model/chatMessages";

type UseRoomChatRealtimeParams = {
  currentUser: User | null;
  isEnabled: boolean;
  onMessage: (message: ChatMessage) => void;
  onPendingMessageBackfill: (content: string) => Promise<boolean>;
  roomPassword?: string | null;
  slug: string;
};

const MAX_CHAT_CONTENT_LENGTH = 200;
const CHAT_SEND_BACKFILL_DELAY_MS = 2000;
const CHAT_SEND_CONFIRM_TIMEOUT_MS = 8000;

type PendingChatSend = {
  backfillTimeoutId: ReturnType<typeof setTimeout>;
  content: string;
  id: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

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

function parseChatMessageEvent(
  body: string,
  roomSlug: string,
): ChatMessage | null {
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    return null;
  }

  if (isChatMessageData(parsedBody)) {
    return parsedBody;
  }

  if (!parsedBody || typeof parsedBody !== "object") {
    return null;
  }

  const event = parsedBody as Partial<WsEvent>;
  const normalizedRoomSlug = normalizeRoomSlug(roomSlug);
  const eventRoomSlug =
    typeof event.roomSlug === "string"
      ? normalizeRoomSlug(event.roomSlug)
      : normalizedRoomSlug;

  if (
    eventRoomSlug !== normalizedRoomSlug ||
    event.type !== "CHAT_MESSAGE" ||
    !isChatMessageData(event.data)
  ) {
    return null;
  }

  return event.data;
}

export function useRoomChatRealtime({
  currentUser,
  isEnabled,
  onMessage,
  onPendingMessageBackfill,
  roomPassword,
  slug,
}: UseRoomChatRealtimeParams) {
  const chatSubscriptionRef = useRef<{
    password: string | null;
    slug: string;
    subscription: StompSubscription;
  } | null>(null);
  const roomEventChatSubscriptionRef = useRef<{
    password: string | null;
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
  const [chatSendErrorMessage, setChatSendErrorMessage] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);

  const clearPendingChatSendTimers = useCallback((pending: PendingChatSend) => {
    clearTimeout(pending.backfillTimeoutId);
    clearTimeout(pending.timeoutId);
  }, []);

  const clearAllPendingChatSends = useCallback(() => {
    for (const pending of pendingChatSendsRef.current) {
      clearPendingChatSendTimers(pending);
    }

    pendingChatSendsRef.current = [];
  }, [clearPendingChatSendTimers]);

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

      const [pending] = pendingChatSendsRef.current.splice(pendingIndex, 1);
      clearPendingChatSendTimers(pending);
      setIsChatSending(false);

      if (errorMessage) {
        setChatSendErrorMessage(errorMessage);
      } else {
        setChatSendErrorMessage("");
      }

      return true;
    },
    [clearPendingChatSendTimers],
  );

  const backfillPendingChatSend = useCallback(
    async (id: number, content: string, shouldShowError: boolean) => {
      const isStillPending = pendingChatSendsRef.current.some(
        (pending) => pending.id === id,
      );

      if (!isStillPending) {
        return false;
      }

      let foundPersistedMessage = false;
      try {
        foundPersistedMessage = await onPendingMessageBackfill(content);
      } catch {
        foundPersistedMessage = false;
      }

      if (!pendingChatSendsRef.current.some((pending) => pending.id === id)) {
        return foundPersistedMessage;
      }

      if (foundPersistedMessage) {
        resolvePendingChatSend({ id });
        return true;
      }

      if (shouldShowError) {
        resolvePendingChatSend({
          errorMessage:
            "채팅 전송 확인이 지연되었습니다. 네트워크 상태를 확인해주세요.",
          id,
        });
      }

      return false;
    },
    [onPendingMessageBackfill, resolvePendingChatSend],
  );

  const registerPendingChatSend = useCallback(
    (content: string) => {
      const id = (pendingChatSendIdRef.current += 1);
      const backfillTimeoutId = setTimeout(() => {
        void backfillPendingChatSend(id, content, false);
      }, CHAT_SEND_BACKFILL_DELAY_MS);
      const timeoutId = setTimeout(() => {
        void backfillPendingChatSend(id, content, true);
      }, CHAT_SEND_CONFIRM_TIMEOUT_MS);

      pendingChatSendsRef.current.push({
        backfillTimeoutId,
        content,
        id,
        timeoutId,
      });

      return id;
    },
    [backfillPendingChatSend],
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

  const cleanupRoomEventChatSubscription = useCallback(() => {
    if (!roomEventChatSubscriptionRef.current) {
      return;
    }

    try {
      roomEventChatSubscriptionRef.current.subscription.unsubscribe();
    } catch {
      // The socket may already be closing while the page is leaving.
    }

    roomEventChatSubscriptionRef.current = null;
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

  const cleanupSubscriptions = useCallback(() => {
    cleanupChatSubscription();
    cleanupRoomEventChatSubscription();
    cleanupUserEventSubscription();
    clearAllPendingChatSends();
  }, [
    cleanupChatSubscription,
    cleanupRoomEventChatSubscription,
    cleanupUserEventSubscription,
    clearAllPendingChatSends,
  ]);

  const reset = useCallback(() => {
    clearAllPendingChatSends();
    setChatSendErrorMessage("");
    setIsChatSending(false);
  }, [clearAllPendingChatSends]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const handleChatMessageBody = useCallback(
    (roomSlug: string, body: string) => {
      const chatMessage = parseChatMessageEvent(body, roomSlug);

      if (!chatMessage) {
        return;
      }

      onMessage(chatMessage);

      if (isChatMessageFromUser(chatMessage, currentUserRef.current)) {
        resolvePendingChatSend({ content: chatMessage.content });
      }
    },
    [onMessage, resolvePendingChatSend],
  );

  const ensureChatSubscription = useCallback(
    (roomSlug: string, password?: string | null) => {
      const subscriptionPassword = password ?? null;

      if (
        chatSubscriptionRef.current?.slug === roomSlug &&
        chatSubscriptionRef.current.password === subscriptionPassword
      ) {
        return;
      }

      cleanupChatSubscription();

      chatSubscriptionRef.current = {
        password: subscriptionPassword,
        slug: roomSlug,
        subscription: subscribeRoomChatEvents(
          roomSlug,
          ({ body }) => {
            if (!body) return;

            handleChatMessageBody(roomSlug, body);
          },
          subscriptionPassword,
        ),
      };
    },
    [cleanupChatSubscription, handleChatMessageBody],
  );

  const ensureRoomEventChatSubscription = useCallback(
    (roomSlug: string, password?: string | null) => {
      const subscriptionPassword = password ?? null;

      if (
        roomEventChatSubscriptionRef.current?.slug === roomSlug &&
        roomEventChatSubscriptionRef.current.password === subscriptionPassword
      ) {
        return;
      }

      cleanupRoomEventChatSubscription();

      roomEventChatSubscriptionRef.current = {
        password: subscriptionPassword,
        slug: roomSlug,
        subscription: subscribeRoomEvents(
          roomSlug,
          ({ body }) => {
            if (!body) return;

            handleChatMessageBody(roomSlug, body);
          },
          subscriptionPassword,
        ),
      };
    },
    [cleanupRoomEventChatSubscription, handleChatMessageBody],
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
            errorMessage: event.data.message || "채팅을 전송하지 못했습니다.",
          });
        }),
      };
    },
    [cleanupUserEventSubscription, resolvePendingChatSend],
  );

  const sendMessage = useCallback(
    (message: string) => {
      const trimmedMessage = message.trim();

      if (!slug || !isEnabled) {
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
      slug,
    ],
  );

  useEffect(() => {
    if (!isEnabled || !slug) {
      cleanupSubscriptions();
      return;
    }

    ensureChatSubscription(slug, roomPassword);
    ensureRoomEventChatSubscription(slug, roomPassword);

    if (currentUser) {
      ensureUserEventSubscription(slug);
    } else {
      cleanupUserEventSubscription();
    }

    return cleanupSubscriptions;
  }, [
    cleanupSubscriptions,
    cleanupUserEventSubscription,
    currentUser,
    ensureChatSubscription,
    ensureRoomEventChatSubscription,
    ensureUserEventSubscription,
    isEnabled,
    roomPassword,
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
