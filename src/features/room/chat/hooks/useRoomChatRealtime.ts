"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StompSubscription } from "@stomp/stompjs";
import { publishChatMessage } from "@/src/entities/room/api/websocket/publishChatMessage";
import { subscribeRoomChatEvents } from "@/src/entities/room/api/websocket/subscribeRoomChatEvents";
import { subscribeUserRoomEvents } from "@/src/entities/room/api/websocket/subscribeUserRoomEvents";
import type {
  ChatMessage,
  WsErrorData,
  WsEvent,
} from "@/src/entities/room/model/types";
import type { User } from "@/src/entities/user/model/types";
import { isChatMessageData } from "../model/chatMessages";

type UseRoomChatRealtimeParams = {
  currentUser: User | null;
  isEnabled: boolean;
  onMessage: (message: ChatMessage) => void;
  slug: string;
};

const MAX_CHAT_CONTENT_LENGTH = 200;
const CHAT_SEND_CONFIRM_TIMEOUT_MS = 8000;

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

export function useRoomChatRealtime({
  currentUser,
  isEnabled,
  onMessage,
  slug,
}: UseRoomChatRealtimeParams) {
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
  const pendingChatSendTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>(
    [],
  );
  const [chatSendErrorMessage, setChatSendErrorMessage] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);

  const clearOldestPendingChatSendTimeout = useCallback(() => {
    const timeoutId = pendingChatSendTimeoutsRef.current.shift();

    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }, []);

  const clearAllPendingChatSendTimeouts = useCallback(() => {
    for (const timeoutId of pendingChatSendTimeoutsRef.current) {
      clearTimeout(timeoutId);
    }

    pendingChatSendTimeoutsRef.current = [];
  }, []);

  const resolveOldestPendingChatSend = useCallback(
    (errorMessage?: string) => {
      if (pendingChatSendCountRef.current <= 0) {
        return;
      }

      clearOldestPendingChatSendTimeout();
      pendingChatSendCountRef.current = Math.max(
        0,
        pendingChatSendCountRef.current - 1,
      );
      setIsChatSending(false);

      if (errorMessage) {
        setChatSendErrorMessage(errorMessage);
      } else {
        setChatSendErrorMessage("");
      }
    },
    [clearOldestPendingChatSendTimeout],
  );

  const registerPendingChatSendTimeout = useCallback(() => {
    const timeoutId = setTimeout(() => {
      pendingChatSendTimeoutsRef.current =
        pendingChatSendTimeoutsRef.current.filter(
          (currentTimeoutId) => currentTimeoutId !== timeoutId,
        );

      if (pendingChatSendCountRef.current <= 0) {
        return;
      }

      pendingChatSendCountRef.current = Math.max(
        0,
        pendingChatSendCountRef.current - 1,
      );
      setIsChatSending(false);
      setChatSendErrorMessage(
        "채팅 전송 확인이 지연되었습니다. 다시 시도해주세요.",
      );
    }, CHAT_SEND_CONFIRM_TIMEOUT_MS);

    pendingChatSendTimeoutsRef.current.push(timeoutId);
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

  const cleanupSubscriptions = useCallback(() => {
    cleanupChatSubscription();
    cleanupUserEventSubscription();
    clearAllPendingChatSendTimeouts();
    pendingChatSendCountRef.current = 0;
  }, [
    cleanupChatSubscription,
    cleanupUserEventSubscription,
    clearAllPendingChatSendTimeouts,
  ]);

  const reset = useCallback(() => {
    clearAllPendingChatSendTimeouts();
    pendingChatSendCountRef.current = 0;
    setChatSendErrorMessage("");
    setIsChatSending(false);
  }, [clearAllPendingChatSendTimeouts]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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
          onMessage(chatMessage);

          const currentUserValue = currentUserRef.current;
          if (
            currentUserValue?.userId != null &&
            currentUserValue.userId === chatMessage.senderId
          ) {
            resolveOldestPendingChatSend();
          }
        }),
      };
    },
    [cleanupChatSubscription, onMessage, resolveOldestPendingChatSend],
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

          resolveOldestPendingChatSend(
            event.data.message || "채팅을 전송하지 못했습니다.",
          );
        }),
      };
    },
    [cleanupUserEventSubscription, resolveOldestPendingChatSend],
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
      pendingChatSendCountRef.current += 1;

      try {
        publishChatMessage(slug, {
          content: trimmedMessage,
          messageType: "TEXT",
        });
        registerPendingChatSendTimeout();
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
    [currentUser, isEnabled, registerPendingChatSendTimeout, slug],
  );

  useEffect(() => {
    if (!isEnabled || !slug || !currentUser) {
      cleanupSubscriptions();
      return;
    }

    ensureChatSubscription(slug);
    ensureUserEventSubscription(slug);

    return cleanupSubscriptions;
  }, [
    cleanupSubscriptions,
    currentUser,
    ensureChatSubscription,
    ensureUserEventSubscription,
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
