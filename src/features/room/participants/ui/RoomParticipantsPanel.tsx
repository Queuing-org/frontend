"use client";

import { useEffect, useState } from "react";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import { getLatestReportableChatMessageKey } from "@/src/features/room/chat/model/chatMessages";
import ReportChatMessageModal, {
  type ReportChatMessageTarget,
} from "@/src/features/room/chat/ui/ReportChatMessageModal";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import { useTransferRoomOwner } from "@/src/features/room/hooks/useTransferRoomOwner";
import { useTransientManagementError } from "@/src/features/room/management/model/useTransientManagementError";
import type { ChatMessage, RoomMeta } from "@/src/features/room/model/types";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import type { User } from "@/src/features/user/model/types";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import {
  getParticipantKickTargetKey,
  getParticipantUserSlug,
} from "../model/participantIdentity";
import RoomParticipantList from "./RoomParticipantList";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  chatMessages: readonly ChatMessage[];
  currentUser: User | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoadMoreError: boolean;
  onLoadMore: () => Promise<unknown>;
  onUserBlocked: (userSlug: string) => void;
  participants: PlaylistParticipant[];
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
};

export default function RoomParticipantsPanel({
  chatMessages,
  currentUser,
  hasNextPage,
  isFetchingNextPage,
  isLoadMoreError,
  onLoadMore,
  onUserBlocked,
  participants,
  roomMeta,
  roomPassword,
  roomSlug,
}: Props) {
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const [reportTarget, setReportTarget] =
    useState<ReportChatMessageTarget | null>(null);
  const [managementMessage, setManagementMessage] = useState<string | null>(
    null,
  );
  const kickParticipant = useKickRoomParticipant();
  const transferOwner = useTransferRoomOwner();
  const {
    begin: beginTransferOwnerRequest,
    clear: clearTransferOwnerError,
    message: transferOwnerErrorMessage,
    show: showTransferOwnerError,
  } = useTransientManagementError();
  const owner = roomMeta?.owner ?? null;
  const participantCount = roomMeta?.activeUsersCount;
  const canModerateParticipants = isRoomOwner(owner, currentUser);

  useEffect(() => {
    clearTransferOwnerError();
  }, [clearTransferOwnerError, roomSlug]);

  const handleReportParticipant = (participant: PlaylistParticipant) => {
    clearTransferOwnerError();
    const userSlug =
      participant.participantType === "USER"
        ? getParticipantUserSlug(participant)
        : null;
    const messageKey = getLatestReportableChatMessageKey(
      chatMessages,
      userSlug,
    );
    setManagementMessage(null);
    if (!messageKey) {
      setManagementMessage("신고할 수 있는 채팅 메시지가 없습니다.");
      return;
    }
    setReportTarget({ messageKey, password: roomPassword, slug: roomSlug });
  };

  const handleBlockParticipant = (participant: PlaylistParticipant) => {
    clearTransferOwnerError();
    const userSlug = getParticipantUserSlug(participant);
    if (participant.participantType !== "USER" || !userSlug) {
      return;
    }
    setManagementMessage(null);
    setBlockTarget({ nickname: participant.nickname, slug: userSlug });
  };

  const handleTransferOwner = (participant: PlaylistParticipant) => {
    const userSlug = getParticipantUserSlug(participant);
    if (participant.participantType !== "USER" || !userSlug) {
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
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>참가자</div>
        <div className={styles.count}>{participantCount ?? "—"} 명</div>
      </div>
      {participants.length ? (
        <RoomParticipantList
          currentUser={currentUser}
          isKickPending={kickParticipant.isPending}
          isTransferPending={transferOwner.isPending}
          kickingParticipantKey={getParticipantKickTargetKey(
            kickParticipant.variables ?? null,
          )}
          onBlockParticipant={handleBlockParticipant}
          onKickParticipant={(target) => {
            clearTransferOwnerError();
            setManagementMessage(null);
            kickParticipant.reset();
            kickParticipant.mutate({
              ...target,
              password: roomPassword,
              slug: roomSlug,
            });
          }}
          onReportParticipant={handleReportParticipant}
          onTransferOwner={handleTransferOwner}
          owner={owner}
          participants={participants}
          canModerateParticipants={canModerateParticipants}
          transferringUserSlug={transferOwner.variables?.userSlug ?? null}
        />
      ) : (
        <div className={styles.empty}>참가자가 없습니다.</div>
      )}
      {hasNextPage ? (
        <div className={styles.loadMoreArea}>
          <button
            type="button"
            className={styles.loadMoreButton}
            disabled={isFetchingNextPage}
            onClick={() => void onLoadMore()}
          >
            {isFetchingNextPage ? (
              <LoadingSpinner
                ariaLabel="참가자 더 불러오는 중"
                size={16}
              />
            ) : isLoadMoreError
                ? "참가자 다시 불러오기"
                : "참가자 더보기"}
          </button>
          {isLoadMoreError ? (
            <span className={styles.loadMoreError} role="alert">
              참가자를 더 불러오지 못했습니다.
            </span>
          ) : null}
        </div>
      ) : null}
      {managementMessage ? (
        <div className={styles.message}>{managementMessage}</div>
      ) : null}
      {kickParticipant.isError ? (
        <div className={styles.error} role="alert">
          {kickParticipant.error?.message ||
            "참가자 관리 요청을 처리하지 못했습니다."}
        </div>
      ) : null}
      {transferOwnerErrorMessage ? (
        <div className={styles.error} role="alert">
          {transferOwnerErrorMessage}
        </div>
      ) : null}
      <BlockUserModal
        onBlocked={(target) => {
          setManagementMessage(`${target.nickname}님을 차단했습니다.`);
          onUserBlocked(target.slug);
        }}
        onClose={() => setBlockTarget(null)}
        target={blockTarget}
      />
      <ReportChatMessageModal
        onClose={() => setReportTarget(null)}
        target={reportTarget}
      />
    </div>
  );
}
