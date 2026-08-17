"use client";

import Image from "next/image";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getRepresentativeBadge } from "@/src/features/badge/model/badgeDisplay";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import UserProfileContent from "@/src/features/user/profile/ui/UserProfileContent";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import type { MusicPowerVote } from "@/src/features/user/profile/model/types";
import type { User } from "@/src/features/user/model/types";
import type { RoomMeta } from "@/src/features/room/model/types";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import { useTransferRoomOwner } from "@/src/features/room/hooks/useTransferRoomOwner";
import RoomMemberManagementMenu, {
  type RoomMemberManagementAction,
} from "@/src/features/room/management/ui/RoomMemberManagementMenu";
import {
  getRoomMemberFailureMessage,
  getRoomMemberFeedbackKey,
  getRoomMemberSuccessMessage,
} from "@/src/features/room/management/model/roomMemberFeedback";
import {
  getParticipantKickTarget,
  type ParticipantKickTarget,
} from "@/src/features/room/participants/model/participantIdentity";
import type { ResolveRoomParticipantByUserSlug } from "@/src/features/room/participants/model/roomParticipantPaging";
import ReportChatMessageModal, {
  type ReportChatMessageTarget,
} from "@/src/features/room/chat/ui/ReportChatMessageModal";
import { useCurrentTrackMusicPowerVote } from "../hooks/useCurrentTrackMusicPowerVote";
import type { CurrentRequesterProfile } from "../model/types";
import styles from "./RoomProfilePanel.module.css";

type Props = {
  currentUser: User | null;
  currentRequester: CurrentRequesterProfile | null;
  currentEntryId?: string | null;
  currentTrackTitle?: string | null;
  hasUnloadedParticipants?: boolean;
  isCurrentUserLoading: boolean;
  kickTarget: ParticipantKickTarget | null;
  onUserBlocked: (userSlug: string) => void;
  reportMessageKey?: string | null;
  resolveParticipantByUserSlug?: ResolveRoomParticipantByUserSlug;
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
};

const MUSIC_POWER_LOGIN_NOTICE =
  "로그인 후 음악력을 평가할 수 있습니다.";
const MUSIC_POWER_ALREADY_EVALUATED_NOTICE =
  "같은 곡에는 한 번만 음악력을 평가할 수 있습니다.";

function isCurrentUserProfile(
  currentRequester: CurrentRequesterProfile | null,
  currentUser: User | null,
) {
  if (!currentRequester || !currentUser) {
    return false;
  }

  return Boolean(
    currentRequester.slug && currentUser.slug === currentRequester.slug,
  );
}

export default function RoomProfilePanel({
  currentUser,
  currentRequester,
  currentEntryId,
  hasUnloadedParticipants = false,
  isCurrentUserLoading,
  kickTarget,
  onUserBlocked,
  reportMessageKey,
  resolveParticipantByUserSlug,
  roomMeta,
  roomPassword,
  roomSlug,
}: Props) {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const [reportTarget, setReportTarget] =
    useState<ReportChatMessageTarget | null>(null);
  const [participantResolutionAction, setParticipantResolutionAction] =
    useState<{
      action: "kick" | "transfer";
      targetSlug: string;
    } | null>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const managementMenuId = useId();
  const musicPowerRequestKeyRef = useRef<string | null>(null);
  const { notify } = useActionFeedback();
  const targetSlug = currentRequester?.slug ?? null;
  const isSelf = isCurrentUserProfile(currentRequester, currentUser);
  const {
    data: publicProfile,
    isError: isPublicProfileError,
    isLoading: isPublicProfileLoading,
  } = useUserProfile(targetSlug);
  const shouldLoadCurrentTrackMusicPower = Boolean(
    currentUser && targetSlug && currentEntryId && !isSelf,
  );
  const musicPowerQuery = useMusicPower(
    shouldLoadCurrentTrackMusicPower ? targetSlug : null,
    shouldLoadCurrentTrackMusicPower
      ? { entryId: currentEntryId!, roomSlug }
      : undefined,
  );
  const musicPowerVote = useCurrentTrackMusicPowerVote();
  const pendingMusicPowerVote = musicPowerVote.variables;
  const selectedMusicPowerVote =
    musicPowerQuery.data?.myVote ??
    (musicPowerVote.isPending &&
      pendingMusicPowerVote?.roomSlug === roomSlug &&
      pendingMusicPowerVote.entryId === currentEntryId &&
      pendingMusicPowerVote.targetUserSlug === targetSlug
      ? pendingMusicPowerVote.vote
      : null);
  const kickParticipant = useKickRoomParticipant();
  const transferOwner = useTransferRoomOwner();
  const shouldLoadBadgeFallback =
    Boolean(targetSlug) &&
    (isPublicProfileError ||
      (Boolean(publicProfile) &&
        publicProfile?.representativeBadge === undefined));
  const { data: publicBadges, isLoading: isPublicBadgesLoading } =
    usePublicUserBadges(shouldLoadBadgeFallback ? targetSlug : null);

  const shouldShowFollowAction = Boolean(currentRequester) && !isSelf;
  const canFollow = shouldShowFollowAction && !!targetSlug && !!currentUser;
  const canManage = canFollow;
  const isCurrentUserRoomOwner = isRoomOwner(roomMeta?.owner, currentUser);
  const isTargetRoomOwner = isRoomOwner(roomMeta?.owner, currentRequester);
  const canKick =
    canManage &&
    isCurrentUserRoomOwner &&
    !isTargetRoomOwner &&
    !isSelf &&
    Boolean(
      kickTarget ||
        (hasUnloadedParticipants && resolveParticipantByUserSlug),
    );
  const canTransfer = canKick && Boolean(targetSlug);
  const managementActions: RoomMemberManagementAction[] = canManage
    ? [
        "report",
        "block",
        ...(canKick ? (["kick"] as const) : []),
        ...(canTransfer ? (["transfer"] as const) : []),
      ]
    : [];

  let followButtonLabel: ReactNode = "팔로우";
  if (!currentRequester) {
    followButtonLabel = "대상 없음";
  } else if (!currentRequester.slug) {
    followButtonLabel = "준비 중";
  } else if (isCurrentUserLoading) {
    followButtonLabel = (
      <LoadingSpinner ariaLabel="로그인 상태 확인 중" size={16} />
    );
  } else if (!currentUser) {
    followButtonLabel = "로그인 필요";
  }

  const representativeBadge =
    publicProfile?.representativeBadge === undefined
      ? getRepresentativeBadge(publicBadges)
      : publicProfile.representativeBadge;
  const displayNickname =
    publicProfile?.nickname ?? currentRequester?.nickname ?? "";
  const displayAvatarUrl =
    publicProfile?.profileImageUrl ?? currentRequester?.avatarUrl ?? null;
  const statusMessage = publicProfile?.statusMessage?.trim() ?? "";
  const isBadgeLoading =
    isPublicProfileLoading ||
    (shouldLoadBadgeFallback && isPublicBadgesLoading);
  const badgeValue = representativeBadge?.name ?? "대표 칭호 없음";
  const musicPower =
    musicPowerQuery.data?.musicPower ?? publicProfile?.musicPower;
  const listeningDurationSeconds =
    publicProfile?.listeningDurationSeconds ??
    (isSelf ? currentUser?.listeningDurationSeconds : undefined);
  const isMusicPowerVoteDisabled =
    isCurrentUserLoading ||
    isSelf ||
    !targetSlug ||
    !currentEntryId;
  const musicPowerVoteDisabledLabel = (() => {
    if (isCurrentUserLoading) {
      return "로그인 상태를 확인하고 있습니다";
    }
    if (isSelf) {
      return "본인의 음악력에는 투표할 수 없습니다";
    }
    if (!targetSlug) {
      return "투표 대상은 회원 신청자만 가능합니다";
    }
    if (!currentEntryId) {
      return "현재 재생 곡을 확인할 수 없습니다";
    }
    return null;
  })();

  const handleMusicPowerVote = (vote: MusicPowerVote) => {
    if (!targetSlug || !currentEntryId || isCurrentUserLoading) {
      return;
    }

    if (!currentUser) {
      notify({
        dedupeKey: `music-power:${roomSlug}:${currentEntryId}:${targetSlug}`,
        message: MUSIC_POWER_LOGIN_NOTICE,
        tone: "default",
      });
      return;
    }

    if (isMusicPowerVoteDisabled) {
      return;
    }

    if (musicPowerVote.isPending) {
      return;
    }

    const requestKey = `${roomSlug}:${currentEntryId}:${targetSlug}`;
    if (musicPowerRequestKeyRef.current === requestKey) {
      return;
    }

    if (musicPowerQuery.data?.myVote) {
      notify({
        dedupeKey: `music-power:${requestKey}`,
        message: MUSIC_POWER_ALREADY_EVALUATED_NOTICE,
        tone: "default",
      });
      return;
    }

    musicPowerRequestKeyRef.current = requestKey;
    musicPowerVote.mutate(
      {
        entryId: currentEntryId,
        roomSlug,
        targetUserSlug: targetSlug,
        vote,
      },
      {
        onSuccess: () => {
          if (musicPowerRequestKeyRef.current === requestKey) {
            musicPowerRequestKeyRef.current = null;
          }
          notify({
            dedupeKey: `music-power:${requestKey}`,
            message:
              vote === "UPVOTE"
                ? `'${displayNickname}'님의 음악력을 올렸습니다!`
                : `'${displayNickname}'님의 음악력을 내렸습니다.`,
            tone: "default",
          });
        },
        onError: (error) => {
          if (musicPowerRequestKeyRef.current === requestKey) {
            musicPowerRequestKeyRef.current = null;
          }
          const isAlreadyEvaluated =
            error.code === "music-power.already-evaluated";
          notify({
            dedupeKey: `music-power:${requestKey}`,
            message: isAlreadyEvaluated
              ? MUSIC_POWER_ALREADY_EVALUATED_NOTICE
              : error.message || "음악력을 변경하지 못했습니다.",
            tone: isAlreadyEvaluated ? "default" : "error",
          });
        },
      },
    );
  };

  const handleReport = () => {
    if (!reportMessageKey) {
      notify({
        dedupeKey: `report:no-message:${roomSlug}:${targetSlug ?? "guest"}`,
        message: "신고할 수 있는 채팅 메시지가 없습니다.",
        tone: "default",
      });
      return;
    }

    setReportTarget({
      messageKey: reportMessageKey,
      password: roomPassword,
      slug: roomSlug,
    });
  };

  const handleBlock = () => {
    if (!targetSlug) {
      return;
    }

    setBlockTarget({ nickname: displayNickname, slug: targetSlug });
  };

  const resolveCurrentRequesterKickTarget = async (
    lookupSlug: string,
  ) => {
    if (!resolveParticipantByUserSlug) {
      return null;
    }
    const participant = await resolveParticipantByUserSlug(lookupSlug);
    if (
      participant?.participantType !== "USER" ||
      participant.userSlug?.trim() !== lookupSlug
    ) {
      return null;
    }

    return getParticipantKickTarget(participant);
  };

  const handleKick = async () => {
    if (!targetSlug || !canKick) {
      return;
    }

    let resolvedKickTarget = kickTarget;
    if (!resolvedKickTarget) {
      setParticipantResolutionAction({ action: "kick", targetSlug });
      try {
        resolvedKickTarget = await resolveCurrentRequesterKickTarget(
          targetSlug,
        );
      } catch {
        notify({
          dedupeKey: getRoomMemberFeedbackKey("kick", roomSlug, targetSlug),
          message: "참가자 정보를 확인하지 못했습니다.",
          tone: "error",
        });
        return;
      } finally {
        setParticipantResolutionAction((current) =>
          current?.action === "kick" && current.targetSlug === targetSlug
            ? null
            : current,
        );
      }
    }
    if (!resolvedKickTarget) {
      notify({
        dedupeKey: getRoomMemberFeedbackKey("kick", roomSlug, targetSlug),
        message: "현재 참가 중인 회원을 찾지 못했습니다.",
        tone: "error",
      });
      return;
    }

    kickParticipant.reset();
    kickParticipant.mutate(
      {
        ...resolvedKickTarget,
        password: roomPassword,
        slug: roomSlug,
      },
      {
        onSuccess: () => {
          notify({
            dedupeKey: getRoomMemberFeedbackKey("kick", roomSlug, targetSlug),
            message: getRoomMemberSuccessMessage("kick", displayNickname),
            tone: "default",
          });
        },
        onError: (error) => {
          notify({
            dedupeKey: getRoomMemberFeedbackKey("kick", roomSlug, targetSlug),
            message: getRoomMemberFailureMessage("kick", error.message),
            tone: "error",
          });
        },
      },
    );
  };

  const handleTransfer = async () => {
    if (!targetSlug || !canTransfer) {
      return;
    }

    let resolvedKickTarget = kickTarget;
    if (!resolvedKickTarget) {
      setParticipantResolutionAction({ action: "transfer", targetSlug });
      try {
        resolvedKickTarget = await resolveCurrentRequesterKickTarget(
          targetSlug,
        );
      } catch {
        notify({
          dedupeKey: getRoomMemberFeedbackKey(
            "transfer",
            roomSlug,
            targetSlug,
          ),
          message: "참가자 정보를 확인하지 못했습니다.",
          tone: "error",
        });
        return;
      } finally {
        setParticipantResolutionAction((current) =>
          current?.action === "transfer" && current.targetSlug === targetSlug
            ? null
            : current,
        );
      }
    }
    if (!resolvedKickTarget) {
      notify({
        dedupeKey: getRoomMemberFeedbackKey(
          "transfer",
          roomSlug,
          targetSlug,
        ),
        message: "현재 참가 중인 회원을 찾지 못했습니다.",
        tone: "error",
      });
      return;
    }

    transferOwner.reset();
    transferOwner.mutate(
      { slug: roomSlug, userSlug: targetSlug },
      {
        onSuccess: () => {
          notify({
            dedupeKey: getRoomMemberFeedbackKey(
              "transfer",
              roomSlug,
              targetSlug,
            ),
            message: getRoomMemberSuccessMessage(
              "transfer",
              displayNickname,
            ),
            tone: "default",
          });
        },
        onError: (error) => {
          notify({
            dedupeKey: getRoomMemberFeedbackKey(
              "transfer",
              roomSlug,
              targetSlug,
            ),
            message: getRoomMemberFailureMessage("transfer", error.message),
            tone: "error",
          });
        },
      },
    );
  };
  const closeManagementMenu = useCallback(() => {
    setIsManagementOpen(false);
  }, []);

  return (
    <div className={styles.root}>
      {currentRequester ? (
        <>
          <div className={styles.header}>
            <div className={styles.title}>현재 큐잉 중</div>
          </div>
          <UserProfileContent
            actions={
              !isSelf && shouldShowFollowAction ? (
                <div
                  className={styles.actionRow}
                  data-single-action={!canManage || undefined}
                  role="group"
                  aria-label="프로필 액션"
                >
                  <div className={styles.followAction}>
                    <FollowToggleButton
                      className={styles.followButton}
                      disabled={!canFollow || isPublicProfileLoading || isPublicProfileError}
                      disabledLabel={
                        isPublicProfileLoading ? (
                          <LoadingSpinner ariaLabel="팔로우 관계 확인 중" size={16} />
                        ) : isPublicProfileError ? "확인 실패" : followButtonLabel
                      }
                      followingLabel="팔로잉"
                      initialRelationship={
                        publicProfile?.relationship ?? "NONE"
                      }
                      targetNickname={displayNickname}
                      targetSlug={targetSlug}
                    />
                  </div>
                  {canManage ? (
                    <div className={styles.manageAction}>
                      <button
                        ref={manageButtonRef}
                        type="button"
                        className={styles.manageButton}
                        aria-haspopup="menu"
                        aria-expanded={isManagementOpen}
                        aria-controls={
                          isManagementOpen ? managementMenuId : undefined
                        }
                        onClick={() => {
                          setIsManagementOpen((current) => !current);
                        }}
                      >
                        <span>관리</span>
                        <Image
                          src="/icons/manage-down.svg"
                          alt=""
                          aria-hidden="true"
                          width={8}
                          height={8}
                        />
                      </button>
                      {isManagementOpen ? (
                        <RoomMemberManagementMenu
                          actions={managementActions}
                          isKickPending={
                            kickParticipant.isPending ||
                            (participantResolutionAction?.action === "kick" &&
                              participantResolutionAction.targetSlug ===
                                targetSlug)
                          }
                          isTransferPending={
                            transferOwner.isPending ||
                            (participantResolutionAction?.action ===
                              "transfer" &&
                              participantResolutionAction.targetSlug ===
                                targetSlug)
                          }
                          label="프로필 관리"
                          menuId={managementMenuId}
                          onBlock={handleBlock}
                          onClose={closeManagementMenu}
                          onKick={handleKick}
                          onReport={handleReport}
                          onTransfer={handleTransfer}
                          targetUserSlug={targetSlug}
                          targetNickname={displayNickname}
                          triggerRef={manageButtonRef}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null
            }
            activityLabel={null}
            avatarUrl={displayAvatarUrl}
            badgeLabel={targetSlug ? badgeValue : "-"}
            isBadgeLoading={Boolean(targetSlug) && isBadgeLoading}
            isOwner={isTargetRoomOwner}
            listeningDurationSeconds={listeningDurationSeconds}
            musicPower={musicPower}
            musicPowerActions={
              !isSelf && !isCurrentUserLoading ? (
                <div className={styles.musicPowerActions}>
                  <button
                    type="button"
                    className={styles.musicPowerButton}
                    aria-pressed={selectedMusicPowerVote === "UPVOTE"}
                    aria-label={
                      musicPowerVoteDisabledLabel ?? "음악력 올리기"
                    }
                    title={
                      !currentUser && !isCurrentUserLoading
                        ? MUSIC_POWER_LOGIN_NOTICE
                        : (musicPowerVoteDisabledLabel ?? "음악력 올리기")
                    }
                    disabled={isMusicPowerVoteDisabled}
                    onClick={() => handleMusicPowerVote("UPVOTE")}
                  >
                    <Image
                      src="/icons/music-power-up.svg"
                      alt=""
                      aria-hidden="true"
                      className={styles.musicPowerIcon}
                      width={8}
                      height={8}
                    />
                  </button>
                  <button
                    type="button"
                    className={styles.musicPowerButton}
                    aria-pressed={selectedMusicPowerVote === "DOWNVOTE"}
                    aria-label={
                      musicPowerVoteDisabledLabel ?? "음악력 내리기"
                    }
                    title={
                      !currentUser && !isCurrentUserLoading
                        ? MUSIC_POWER_LOGIN_NOTICE
                        : (musicPowerVoteDisabledLabel ?? "음악력 내리기")
                    }
                    disabled={isMusicPowerVoteDisabled}
                    onClick={() => handleMusicPowerVote("DOWNVOTE")}
                  >
                    <Image
                      src="/icons/music-power-down.svg"
                      alt=""
                      aria-hidden="true"
                      className={styles.musicPowerIcon}
                      width={8}
                      height={8}
                    />
                  </button>
                </div>
              ) : null
            }
            nickname={displayNickname}
            online={publicProfile?.online}
            primaryStatus={
              isSelf ? (
                <div
                  className={styles.selfTrackStatus}
                  aria-label="내 노래 재생 상태"
                >
                  <span
                    className={styles.selfTrackStatusDot}
                    aria-hidden="true"
                  />
                  <span>내 노래가 나오고 있어요!</span>
                </div>
              ) : null
            }
            queuingCount={publicProfile?.queuingCount}
            statusMessage={statusMessage}
            textLineClamp={2}
          />
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
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>표시할 프로필이 없습니다.</div>
          <div className={styles.emptyText}>
            현재 재생 중인 곡이 생기면 신청자 프로필이 여기에 표시됩니다.
          </div>
        </div>
      )}
    </div>
  );
}
