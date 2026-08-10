"use client";

import Image from "next/image";
import { MoreVertical } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import type { ChatMessage, RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import { useTransferRoomOwner } from "@/src/features/room/hooks/useTransferRoomOwner";
import { useTransientManagementError } from "@/src/features/room/management/model/useTransientManagementError";
import {
  getParticipantKickTarget,
  getParticipantKickTargetKey,
  getParticipantUserSlug,
  isParticipantRoomOwner,
  isSameUser,
} from "@/src/features/room/participants/model/participantIdentity";
import type { ResolveRoomParticipantByUserSlug } from "@/src/features/room/participants/model/roomParticipantPaging";
import RoomMemberManagementMenu from "@/src/features/room/management/ui/RoomMemberManagementMenu";
import { useChatScrollRestoration } from "../hooks/useChatScrollRestoration";
import {
  getChatMessageManagementActions,
  getChatMessageRenderKey,
  getVisibleChatMessageWindow,
  type ChatMessageManagementAction,
} from "../model/chatMessages";
import ReportChatMessageModal, {
  type ReportChatMessageTarget,
} from "./ReportChatMessageModal";
import styles from "./ChatArea.module.css";

type Props = {
  blockedSenderSlugs: ReadonlySet<string>;
  currentUser: User | null;
  errorMessage?: string;
  hasUnloadedParticipants: boolean;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  messages: ChatMessage[];
  onLoadOlderMessages: () => void;
  onUserBlocked: (userSlug: string) => void;
  participants: PlaylistParticipant[];
  resolveParticipantByUserSlug: ResolveRoomParticipantByUserSlug;
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
  scrollToLatestKey: number;
  wheelRegionRef?: RefObject<HTMLElement | null>;
};

type ChatMessageRowProps = {
  actions: ChatMessageManagementAction[];
  isKickPending: boolean;
  isMenuOpen: boolean;
  isTransferPending: boolean;
  message: ChatMessage;
  messageKey: string;
  menuPlacement: "down" | "up";
  onBlock: (message: ChatMessage) => void;
  onCloseMenu: () => void;
  onKick: (message: ChatMessage) => void;
  onReport: (message: ChatMessage) => void;
  onTransfer: (message: ChatMessage) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onToggleMenu: (
    messageKey: string,
    trigger: HTMLButtonElement,
    estimatedMenuHeight: number,
  ) => void;
};

function getInitial(nickname: string) {
  return nickname.trim().slice(0, 1) || "?";
}

function ChatMessageRow({
  actions,
  isKickPending,
  isMenuOpen,
  isTransferPending,
  message,
  messageKey,
  menuPlacement,
  onBlock,
  onCloseMenu,
  onKick,
  onReport,
  onTransfer,
  triggerRef,
  onToggleMenu,
}: ChatMessageRowProps) {
  const menuId = `chat-message-menu-${messageKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <li
      className={styles.message}
      data-chat-message-key={messageKey}
      data-menu-open={isMenuOpen || undefined}
    >
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
            onClick={(event) =>
              onToggleMenu(
                messageKey,
                event.currentTarget,
                actions.length * 40 + 2,
              )
            }
          >
            <MoreVertical aria-hidden="true" size={18} />
          </button>
          {isMenuOpen ? (
            <RoomMemberManagementMenu
              actions={actions}
              isKickPending={isKickPending}
              isTransferPending={isTransferPending}
              label={`${message.senderNickname} 메시지 관리`}
              menuId={menuId}
              onBlock={() => onBlock(message)}
              onClose={onCloseMenu}
              onKick={() => onKick(message)}
              onReport={() => onReport(message)}
              onTransfer={() => onTransfer(message)}
              placement={menuPlacement}
              targetUserSlug={message.senderSlug?.trim() || null}
              triggerRef={triggerRef}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default function ChatArea({
  blockedSenderSlugs,
  currentUser,
  errorMessage,
  hasUnloadedParticipants,
  hasOlderMessages,
  isLoadingOlderMessages,
  messages,
  onLoadOlderMessages,
  onUserBlocked,
  participants,
  resolveParticipantByUserSlug,
  roomMeta,
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
  const [managementMessage, setManagementMessage] = useState<string | null>(
    null,
  );
  const [participantResolutionError, setParticipantResolutionError] = useState<{
    message: string;
    roomSlug: string;
  } | null>(null);
  const [participantResolutionAction, setParticipantResolutionAction] =
    useState<{
      action: "kick" | "transfer";
      userSlug: string;
    } | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const kickParticipant = useKickRoomParticipant();
  const transferOwner = useTransferRoomOwner();
  const {
    begin: beginTransferOwnerRequest,
    clear: clearTransferOwnerError,
    message: transferOwnerErrorMessage,
    show: showTransferOwnerError,
  } = useTransientManagementError();
  const participantByUserSlug = useMemo(() => {
    const lookup = new Map<string, PlaylistParticipant>();
    participants.forEach((participant) => {
      if (participant.participantType !== "USER") {
        return;
      }
      const userSlug = getParticipantUserSlug(participant);
      if (userSlug) {
        lookup.set(userSlug, participant);
      }
    });
    return lookup;
  }, [participants]);
  const currentUserIsRoomOwner = isRoomOwner(roomMeta?.owner, currentUser);
  const visibleMessages = useMemo(
    () => getVisibleChatMessageWindow(messages, blockedSenderSlugs),
    [blockedSenderSlugs, messages],
  );
  const visibleMessageKeys = useMemo(
    () => visibleMessages.map(getChatMessageRenderKey),
    [visibleMessages],
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
    messageKeys: visibleMessageKeys,
    onLoadOlderMessages,
    scrollToLatestKey,
  });

  useEffect(() => {
    clearTransferOwnerError();
  }, [clearTransferOwnerError, roomSlug]);

  const closeMenu = useCallback(() => {
    setOpenMenuKey(null);
  }, []);

  const handleToggleMenu = useCallback(
    (
      messageKey: string,
      trigger: HTMLButtonElement,
      estimatedMenuHeight: number,
    ) => {
      activeTriggerRef.current = trigger;
      const listRect = listRef.current?.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const spaceBelow =
        (listRect?.bottom ?? window.innerHeight) - triggerRect.bottom;
      const spaceAbove = triggerRect.top - (listRect?.top ?? 0);
      setMenuPlacement(
        spaceBelow < estimatedMenuHeight && spaceAbove >= estimatedMenuHeight
          ? "up"
          : "down",
      );
      setParticipantResolutionError(null);
      setOpenMenuKey((currentKey) =>
        currentKey === messageKey ? null : messageKey,
      );
    },
    [listRef],
  );

  const getModerationUserSlug = useCallback(
    (message: ChatMessage) => {
      const senderSlug = message.senderSlug?.trim();
      if (!currentUserIsRoomOwner || !senderSlug) {
        return null;
      }
      const participant = participantByUserSlug.get(senderSlug);
      if (participant) {
        return isSameUser(participant, currentUser) ||
          isParticipantRoomOwner(roomMeta?.owner, participant)
          ? null
          : senderSlug;
      }
      if (
        !hasUnloadedParticipants ||
        senderSlug === currentUser?.slug?.trim() ||
        senderSlug === roomMeta?.owner?.slug?.trim()
      ) {
        return null;
      }

      return senderSlug;
    }, [
      currentUser,
      currentUserIsRoomOwner,
      hasUnloadedParticipants,
      participantByUserSlug,
      roomMeta?.owner,
    ],
  );
  const resolveModerationParticipant = useCallback(
    async (message: ChatMessage) => {
      const userSlug = getModerationUserSlug(message);
      if (!userSlug) {
        return null;
      }

      const loadedParticipant = participantByUserSlug.get(userSlug);
      if (loadedParticipant) {
        return loadedParticipant;
      }

      const resolvedParticipant =
        await resolveParticipantByUserSlug(userSlug);
      if (
        resolvedParticipant?.participantType !== "USER" ||
        resolvedParticipant.userSlug?.trim() !== userSlug ||
        isSameUser(resolvedParticipant, currentUser) ||
        isParticipantRoomOwner(roomMeta?.owner, resolvedParticipant)
      ) {
        return null;
      }

      return resolvedParticipant;
    }, [
      currentUser,
      getModerationUserSlug,
      participantByUserSlug,
      resolveParticipantByUserSlug,
      roomMeta?.owner,
    ],
  );
  const handleBlock = useCallback(
    (message: ChatMessage) => {
      const senderSlug = message.senderSlug?.trim();
      if (!currentUser || !senderSlug) {
        return;
      }
      setOpenMenuKey(null);
      setBlockTarget({
        nickname: message.senderNickname,
        slug: senderSlug,
      });
    },
    [currentUser],
  );
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
  const handleKick = useCallback(
    async (message: ChatMessage) => {
      const userSlug = getModerationUserSlug(message);
      if (!userSlug) {
        return;
      }
      setParticipantResolutionError(null);
      let participant = participantByUserSlug.get(userSlug) ?? null;
      if (!participant) {
        setParticipantResolutionAction({ action: "kick", userSlug });
        try {
          participant = await resolveModerationParticipant(message);
        } catch {
          setParticipantResolutionError({
            message: "참가자 정보를 확인하지 못했습니다.",
            roomSlug,
          });
          return;
        } finally {
          setParticipantResolutionAction((current) =>
            current?.action === "kick" && current.userSlug === userSlug
              ? null
              : current,
          );
        }
      }
      const kickTarget = participant
        ? getParticipantKickTarget(participant)
        : null;
      if (!kickTarget) {
        setParticipantResolutionError({
          message: "현재 참가 중인 회원을 찾지 못했습니다.",
          roomSlug,
        });
        return;
      }
      clearTransferOwnerError();
      setManagementMessage(null);
      kickParticipant.reset();
      kickParticipant.mutate(
        { ...kickTarget, password: roomPassword, slug: roomSlug },
        {
          onSuccess: () => {
            setManagementMessage(
              `${message.senderNickname}님을 내보냈습니다.`,
            );
          },
        },
      );
    }, [
      clearTransferOwnerError,
      getModerationUserSlug,
      kickParticipant,
      participantByUserSlug,
      resolveModerationParticipant,
      roomPassword,
      roomSlug,
    ]);
  const handleTransfer = useCallback(
    async (message: ChatMessage) => {
      const moderationUserSlug = getModerationUserSlug(message);
      if (!moderationUserSlug) {
        return;
      }
      setParticipantResolutionError(null);
      let participant =
        participantByUserSlug.get(moderationUserSlug) ?? null;
      if (!participant) {
        setParticipantResolutionAction({
          action: "transfer",
          userSlug: moderationUserSlug,
        });
        try {
          participant = await resolveModerationParticipant(message);
        } catch {
          setParticipantResolutionError({
            message: "참가자 정보를 확인하지 못했습니다.",
            roomSlug,
          });
          return;
        } finally {
          setParticipantResolutionAction((current) =>
            current?.action === "transfer" &&
            current.userSlug === moderationUserSlug
              ? null
              : current,
          );
        }
      }
      const userSlug = getParticipantUserSlug(participant);
      if (participant?.participantType !== "USER" || !userSlug) {
        setParticipantResolutionError({
          message: "현재 참가 중인 회원을 찾지 못했습니다.",
          roomSlug,
        });
        return;
      }
      const transferSequence = beginTransferOwnerRequest();
      setManagementMessage(null);
      transferOwner.reset();
      transferOwner.mutate(
        { slug: roomSlug, userSlug },
        {
          onError: (error) => {
            showTransferOwnerError(
              transferSequence,
              error.message || "방장을 위임하지 못했습니다.",
            );
          },
        },
      );
    }, [
      beginTransferOwnerRequest,
      getModerationUserSlug,
      participantByUserSlug,
      resolveModerationParticipant,
      roomSlug,
      showTransferOwnerError,
      transferOwner,
    ]);
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
            closeMenu();
          }}
        >
          {isLoadingOlderMessages ? (
            <div className={styles.state}>
              <LoadingSpinner ariaLabel="이전 채팅 로딩 중" size={18} />
            </div>
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
          {managementMessage ? (
            <div className={styles.managementMessage} role="status">
              {managementMessage}
            </div>
          ) : null}
          {kickParticipant.error ? (
            <div className={styles.managementError} role="alert">
              {kickParticipant.error?.message ||
                "사용자 관리 요청을 처리하지 못했습니다."}
            </div>
          ) : null}
          {participantResolutionError?.roomSlug === roomSlug ? (
            <div className={styles.managementError} role="alert">
              {participantResolutionError.message}
            </div>
          ) : null}
          {transferOwnerErrorMessage ? (
            <div className={styles.managementError} role="alert">
              {transferOwnerErrorMessage}
            </div>
          ) : null}
          {visibleMessages.length === 0 ? (
            <div className={styles.empty}>아직 채팅이 없습니다.</div>
          ) : (
            <ol className={styles.messages}>
              {visibleMessages.map((message) => {
                const messageKey = getChatMessageRenderKey(message);
                const targetUserSlug = getModerationUserSlug(message);
                const kickTarget = targetUserSlug
                  ? { userSlug: targetUserSlug }
                  : null;
                const actions = getChatMessageManagementActions(
                  message,
                  currentUser,
                  {
                    canKick: Boolean(kickTarget),
                    canTransfer: Boolean(targetUserSlug),
                  },
                );
                return (
                  <ChatMessageRow
                    key={messageKey}
                    actions={actions}
                    isKickPending={
                      (kickParticipant.isPending &&
                        getParticipantKickTargetKey(kickTarget) ===
                          getParticipantKickTargetKey(
                            kickParticipant.variables ?? null,
                          )) ||
                      (participantResolutionAction?.action === "kick" &&
                        participantResolutionAction.userSlug ===
                          targetUserSlug)
                    }
                    isMenuOpen={openMenuKey === messageKey}
                    isTransferPending={
                      (transferOwner.isPending &&
                        targetUserSlug ===
                          transferOwner.variables?.userSlug) ||
                      (participantResolutionAction?.action === "transfer" &&
                        participantResolutionAction.userSlug ===
                          targetUserSlug)
                    }
                    message={message}
                    messageKey={messageKey}
                    menuPlacement={menuPlacement}
                    onBlock={handleBlock}
                    onCloseMenu={closeMenu}
                    onKick={handleKick}
                    onReport={handleReport}
                    onTransfer={handleTransfer}
                    triggerRef={activeTriggerRef}
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
          onUserBlocked(blockedTarget.slug);
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
