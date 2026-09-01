"use client";

import { useState } from "react";
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
import type { ChatMessage, RoomMeta } from "@/src/features/room/model/types";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import type { User } from "@/src/features/user/model/types";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import {
  getParticipantKickTarget,
  getParticipantKickTargetKey,
  getParticipantUserSlug,
} from "../model/participantIdentity";
import {
  getRoomMemberFailureMessage,
  getRoomMemberFeedbackKey,
  getRoomMemberSuccessMessage,
} from "@/src/features/room/management/model/roomMemberFeedback";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import RoomParticipantList from "./RoomParticipantList";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  chatMessages: readonly ChatMessage[];
  currentUser: User | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoadMoreError: boolean;
  onLoadMore: () => Promise<unknown>;
  onOpenFriends: () => void;
  onOpenSettings: () => void;
  onUserBlocked: (userSlug: string) => void;
  participants: PlaylistParticipant[];
  roomMeta: RoomMeta | null;
  roomAccessToken: string;
  roomSlug: string;
};

export default function RoomParticipantsPanel({
  chatMessages,
  currentUser,
  hasNextPage,
  isFetchingNextPage,
  isLoadMoreError,
  onLoadMore,
  onOpenFriends,
  onOpenSettings,
  onUserBlocked,
  participants,
  roomMeta,
  roomAccessToken,
  roomSlug,
}: Props) {
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const [reportTarget, setReportTarget] =
    useState<ReportChatMessageTarget | null>(null);
  const kickParticipant = useKickRoomParticipant();
  const transferOwner = useTransferRoomOwner();
  const { notify } = useActionFeedback();
  const owner = roomMeta?.owner ?? null;
  const participantCount = roomMeta
    ? Math.max(roomMeta.activeUsersCount, participants.length)
    : participants.length || undefined;
  const canModerateParticipants = isRoomOwner(owner, currentUser);

  const handleReportParticipant = (participant: PlaylistParticipant) => {
    const userSlug =
      participant.participantType === "USER"
        ? getParticipantUserSlug(participant)
        : null;
    const messageKey = getLatestReportableChatMessageKey(
      chatMessages,
      userSlug,
    );
    if (!messageKey) {
      notify({
        dedupeKey: `report:no-message:${roomSlug}:${userSlug ?? "guest"}`,
        message: "신고할 수 있는 채팅 메시지가 없습니다.",
        tone: "default",
      });
      return;
    }
    setReportTarget({
      accessToken: roomAccessToken,
      messageKey,
      slug: roomSlug,
    });
  };

  const handleBlockParticipant = (participant: PlaylistParticipant) => {
    const userSlug = getParticipantUserSlug(participant);
    if (participant.participantType !== "USER" || !userSlug) {
      return;
    }
    setBlockTarget({ nickname: participant.nickname, slug: userSlug });
  };

  const handleTransferOwner = (participant: PlaylistParticipant) => {
    const userSlug = getParticipantUserSlug(participant);
    if (participant.participantType !== "USER" || !userSlug) {
      return;
    }
    transferOwner.reset();
    transferOwner.mutate(
      { accessToken: roomAccessToken, slug: roomSlug, userSlug },
      {
        onSuccess: () => {
          notify({
            dedupeKey: getRoomMemberFeedbackKey(
              "transfer",
              roomSlug,
              userSlug,
            ),
            message: getRoomMemberSuccessMessage(
              "transfer",
              participant.nickname,
            ),
            tone: "default",
          });
        },
        onError: (error) => {
          notify({
            dedupeKey: getRoomMemberFeedbackKey(
              "transfer",
              roomSlug,
              userSlug,
            ),
            message: getRoomMemberFailureMessage("transfer", error.message),
            tone: "error",
          });
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
          onOpenFriends={onOpenFriends}
          onOpenSettings={onOpenSettings}
          onKickParticipant={(participant) => {
            const target = getParticipantKickTarget(participant);
            const feedbackTarget = target?.userSlug ?? target?.participantId;
            if (!target || !feedbackTarget) {
              return;
            }
            kickParticipant.reset();
            kickParticipant.mutate(
              {
                ...target,
                accessToken: roomAccessToken,
                slug: roomSlug,
              },
              {
                onSuccess: () => {
                  notify({
                    dedupeKey: getRoomMemberFeedbackKey(
                      "kick",
                      roomSlug,
                      feedbackTarget,
                    ),
                    message: getRoomMemberSuccessMessage(
                      "kick",
                      participant.nickname,
                    ),
                    tone: "default",
                  });
                },
                onError: (error) => {
                  notify({
                    dedupeKey: getRoomMemberFeedbackKey(
                      "kick",
                      roomSlug,
                      feedbackTarget,
                    ),
                    message: getRoomMemberFailureMessage(
                      "kick",
                      error.message,
                    ),
                    tone: "error",
                  });
                },
              },
            );
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
      <BlockUserModal
        onBlocked={(target) => {
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
