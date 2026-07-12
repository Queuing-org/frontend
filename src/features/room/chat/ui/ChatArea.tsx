"use client";

import Image from "next/image";
import { MoreVertical } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { ChatMessage } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import { useChatScrollRestoration } from "../hooks/useChatScrollRestoration";
import {
  getChatMessageManagementActions,
  getChatMessageRenderKey,
  shouldDisplayChatMessage,
  type ChatMessageManagementAction,
} from "../model/chatMessages";
import ReportChatMessageModal, {
  type ReportChatMessageTarget,
} from "./ReportChatMessageModal";
import styles from "./ChatArea.module.css";

type Props = {
  currentUser: User | null;
  errorMessage?: string;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  messages: ChatMessage[];
  onLoadOlderMessages: () => void;
  roomPassword?: string | null;
  roomSlug: string;
  scrollToLatestKey: number;
  wheelRegionRef?: RefObject<HTMLElement | null>;
};

type ChatMessageRowProps = {
  actions: ChatMessageManagementAction[];
  isMenuOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  message: ChatMessage;
  messageKey: string;
  menuPlacement: "down" | "up";
  onBlock: (message: ChatMessage) => void;
  onReport: (message: ChatMessage) => void;
  onToggleMenu: (
    messageKey: string,
    trigger: HTMLButtonElement,
  ) => void;
};

function getInitial(nickname: string) {
  return nickname.trim().slice(0, 1) || "?";
}

function ChatMessageRow({
  actions,
  isMenuOpen,
  menuRef,
  message,
  messageKey,
  menuPlacement,
  onBlock,
  onReport,
  onToggleMenu,
}: ChatMessageRowProps) {
  const menuId = `chat-message-menu-${messageKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <li className={styles.message}>
      <div className={styles.avatarWrap}>
        {message.senderProfileImageUrl ? (
          <Image
            src={message.senderProfileImageUrl}
            alt={`${message.senderNickname} 프로필`}
            fill
            sizes="40px"
            unoptimized
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarFallback} aria-hidden="true">
            {getInitial(message.senderNickname)}
          </div>
        )}
      </div>
      <p className={styles.messageText}>
        <span className={styles.nickname}>{message.senderNickname}</span>
        <span className={styles.content}>{message.content}</span>
      </p>
      {actions.length > 0 ? (
        <div className={styles.management}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={`${message.senderNickname} 메시지(${message.content.slice(0, 12)}) 관리 메뉴`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-controls={isMenuOpen ? menuId : undefined}
            onClick={(event) => onToggleMenu(messageKey, event.currentTarget)}
          >
            <MoreVertical aria-hidden="true" size={18} />
          </button>
          {isMenuOpen ? (
            <div
              ref={menuRef}
              id={menuId}
              className={styles.menu}
              role="menu"
              aria-label={`${message.senderNickname} 메시지 관리`}
              data-placement={menuPlacement}
            >
              {actions.includes("report") ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onReport(message)}
                >
                  신고
                </button>
              ) : null}
              {actions.includes("block") ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onBlock(message)}
                >
                  차단
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default function ChatArea({
  currentUser,
  errorMessage,
  hasOlderMessages,
  isLoadingOlderMessages,
  messages,
  onLoadOlderMessages,
  roomPassword,
  roomSlug,
  scrollToLatestKey,
  wheelRegionRef: externalWheelRegionRef,
}: Props) {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = useState<"down" | "up">("down");
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const [reportTarget, setReportTarget] =
    useState<ReportChatMessageTarget | null>(null);
  const [blockedChatSenders, setBlockedChatSenders] = useState<{
    roomSlug: string;
    slugs: ReadonlySet<string>;
  }>(() => ({ roomSlug, slugs: new Set() }));
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const blockedSenderSlugs =
    blockedChatSenders.roomSlug === roomSlug
      ? blockedChatSenders.slugs
      : new Set<string>();
  const visibleMessages = messages.filter((message) =>
    shouldDisplayChatMessage(message, blockedSenderSlugs),
  );
  const {
    handleScroll,
    listRef,
    requestOlderMessages,
    wheelRegionRef,
  } = useChatScrollRestoration({
    externalWheelRegionRef,
    hasOlderMessages,
    isLoadingOlderMessages,
    messageCount: visibleMessages.length,
    onLoadOlderMessages,
    scrollToLatestKey,
  });

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setOpenMenuKey(null);
    if (restoreFocus) {
      queueMicrotask(() => activeTriggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!openMenuKey) {
      return;
    }

    menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']")?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        menuRef.current?.contains(target) ||
        activeTriggerRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, openMenuKey]);

  const handleToggleMenu = useCallback(
    (messageKey: string, trigger: HTMLButtonElement) => {
      activeTriggerRef.current = trigger;
      const listRect = listRef.current?.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const estimatedMenuHeight = 82;
      const spaceBelow = (listRect?.bottom ?? window.innerHeight) - triggerRect.bottom;
      const spaceAbove = triggerRect.top - (listRect?.top ?? 0);
      setMenuPlacement(
        spaceBelow < estimatedMenuHeight && spaceAbove >= estimatedMenuHeight
          ? "up"
          : "down",
      );
      setOpenMenuKey((currentKey) =>
        currentKey === messageKey ? null : messageKey,
      );
    },
    [listRef],
  );
  const handleBlock = useCallback((message: ChatMessage) => {
    if (!currentUser || !message.senderSlug) {
      return;
    }
    setOpenMenuKey(null);
    setBlockTarget({
      nickname: message.senderNickname,
      slug: message.senderSlug,
    });
  }, [currentUser]);
  const handleReport = useCallback(
    (message: ChatMessage) => {
      if (!currentUser || !message.messageKey) {
        return;
      }
      setOpenMenuKey(null);
      setReportTarget({
        messageKey: message.messageKey,
        password: roomPassword,
        slug: roomSlug,
      });
    },
    [currentUser, roomPassword, roomSlug],
  );
  const restoreTriggerFocus = useCallback(() => {
    queueMicrotask(() => activeTriggerRef.current?.focus());
  }, []);

  return (
    <>
      <div ref={wheelRegionRef} className={styles.root}>
        <div
          ref={listRef}
          className={styles.list}
          aria-label="채팅 메시지 목록"
          onScroll={() => {
            handleScroll();
            closeMenu(false);
          }}
        >
          {isLoadingOlderMessages ? (
            <div className={styles.state}>이전 채팅을 불러오는 중...</div>
          ) : null}
          {errorMessage ? (
            <button
              type="button"
              className={styles.error}
              onClick={requestOlderMessages}
            >
              {errorMessage}
            </button>
          ) : null}
          {visibleMessages.length === 0 ? (
            <div className={styles.empty}>아직 채팅이 없습니다.</div>
          ) : (
            <ol className={styles.messages}>
              {visibleMessages.map((message) => {
                const messageKey = getChatMessageRenderKey(message);
                return (
                  <ChatMessageRow
                    key={messageKey}
                    actions={getChatMessageManagementActions(
                      message,
                      currentUser,
                    )}
                    isMenuOpen={openMenuKey === messageKey}
                    menuRef={menuRef}
                    message={message}
                    messageKey={messageKey}
                    menuPlacement={menuPlacement}
                    onBlock={handleBlock}
                    onReport={handleReport}
                    onToggleMenu={handleToggleMenu}
                  />
                );
              })}
            </ol>
          )}
        </div>
      </div>
      <BlockUserModal
        target={blockTarget}
        onBlocked={(blockedTarget) => {
          setBlockedChatSenders((current) => {
            const nextSlugs = new Set(
              current.roomSlug === roomSlug ? current.slugs : [],
            );
            nextSlugs.add(blockedTarget.slug);
            return { roomSlug, slugs: nextSlugs };
          });
        }}
        onClose={() => {
          setBlockTarget(null);
          restoreTriggerFocus();
        }}
      />
      <ReportChatMessageModal
        target={reportTarget}
        onClose={() => {
          setReportTarget(null);
          restoreTriggerFocus();
        }}
      />
    </>
  );
}
