"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
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
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import { useTransferRoomOwner } from "@/src/features/room/hooks/useTransferRoomOwner";
import { useTransientManagementError } from "@/src/features/room/management/model/useTransientManagementError";
import RoomMemberManagementMenu, {
  type RoomMemberManagementAction,
} from "@/src/features/room/management/ui/RoomMemberManagementMenu";
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

const MUSIC_POWER_NOTICE_DURATION_MS = 2_000;
const MUSIC_POWER_LIMIT_NOTICE =
  "같은 사용자에게는 1시간에 한 번만 음악력을 올리거나 내릴 수 있습니다.";
const MUSIC_POWER_LOGIN_NOTICE =
  "로그인 후 음악력을 올리거나 내릴 수 있습니다.";
const MUSIC_POWER_ALREADY_EVALUATED_NOTICE =
  "각 노래당 한번만 투표할 수 있어요";

type MusicPowerNotice = {
  message: string;
  targetSlug: string;
};

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
  const [managementMessage, setManagementMessage] = useState<string | null>(
    null,
  );
  const [participantResolutionError, setParticipantResolutionError] = useState<{
    message: string;
    targetSlug: string;
  } | null>(null);
  const [participantResolutionAction, setParticipantResolutionAction] =
    useState<{
      action: "kick" | "transfer";
      targetSlug: string;
    } | null>(null);
  const [musicPowerNotice, setMusicPowerNotice] =
    useState<MusicPowerNotice | null>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const managementMenuId = useId();
  const musicPowerNoticeTimerRef = useRef<number | null>(null);
  const musicPowerNoticeSequenceRef = useRef(0);
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
  const kickParticipant = useKickRoomParticipant();
  const transferOwner = useTransferRoomOwner();
  const {
    begin: beginTransferOwnerRequest,
    clear: clearTransferOwnerError,
    message: transferOwnerErrorMessage,
    show: showTransferOwnerError,
  } = useTransientManagementError();
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

  useEffect(() => {
    return () => {
      if (musicPowerNoticeTimerRef.current !== null) {
        window.clearTimeout(musicPowerNoticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    clearTransferOwnerError();
  }, [clearTransferOwnerError, roomSlug, targetSlug]);

  const showMusicPowerNotice = (message: string, noticeTargetSlug: string) => {
    if (musicPowerNoticeTimerRef.current !== null) {
      window.clearTimeout(musicPowerNoticeTimerRef.current);
    }

    setMusicPowerNotice({ message, targetSlug: noticeTargetSlug });
    musicPowerNoticeTimerRef.current = window.setTimeout(() => {
      setMusicPowerNotice(null);
      musicPowerNoticeTimerRef.current = null;
    }, MUSIC_POWER_NOTICE_DURATION_MS);
  };

  const handleMusicPowerVote = (vote: MusicPowerVote) => {
    if (!targetSlug || !currentEntryId || isCurrentUserLoading) {
      return;
    }

    if (!currentUser) {
      showMusicPowerNotice(MUSIC_POWER_LOGIN_NOTICE, targetSlug);
      return;
    }

    if (isMusicPowerVoteDisabled) {
      return;
    }

    if (musicPowerVote.isPending) {
      return;
    }

    if (musicPowerQuery.data?.myVote) {
      showMusicPowerNotice(MUSIC_POWER_ALREADY_EVALUATED_NOTICE, targetSlug);
      return;
    }

    const noticeSequence = ++musicPowerNoticeSequenceRef.current;
    if (musicPowerNoticeTimerRef.current !== null) {
      window.clearTimeout(musicPowerNoticeTimerRef.current);
      musicPowerNoticeTimerRef.current = null;
    }
    setMusicPowerNotice(null);
    musicPowerVote.mutate(
      {
        entryId: currentEntryId,
        roomSlug,
        targetUserSlug: targetSlug,
        vote,
      },
      {
        onError: (error) => {
          if (musicPowerNoticeSequenceRef.current !== noticeSequence) {
            return;
          }

          showMusicPowerNotice(
            error.code === "music-power.already-evaluated"
              ? MUSIC_POWER_ALREADY_EVALUATED_NOTICE
              : error.message || MUSIC_POWER_LIMIT_NOTICE,
            targetSlug,
          );
        },
      },
    );
  };

  const handleReport = () => {
    setManagementMessage(null);
    if (!reportMessageKey) {
      setManagementMessage("신고할 수 있는 채팅 메시지가 없습니다.");
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

    setManagementMessage(null);
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
    setManagementMessage(null);
    setParticipantResolutionError(null);
    if (!resolvedKickTarget) {
      setParticipantResolutionAction({ action: "kick", targetSlug });
      try {
        resolvedKickTarget = await resolveCurrentRequesterKickTarget(
          targetSlug,
        );
      } catch {
        setParticipantResolutionError({
          message: "참가자 정보를 확인하지 못했습니다.",
          targetSlug,
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
      setParticipantResolutionError({
        message: "현재 참가 중인 회원을 찾지 못했습니다.",
        targetSlug,
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
          setManagementMessage(`${displayNickname}님을 내보냈습니다.`);
        },
      },
    );
  };

  const handleTransfer = async () => {
    if (!targetSlug || !canTransfer) {
      return;
    }

    let resolvedKickTarget = kickTarget;
    setParticipantResolutionError(null);
    if (!resolvedKickTarget) {
      setParticipantResolutionAction({ action: "transfer", targetSlug });
      try {
        resolvedKickTarget = await resolveCurrentRequesterKickTarget(
          targetSlug,
        );
      } catch {
        setParticipantResolutionError({
          message: "참가자 정보를 확인하지 못했습니다.",
          targetSlug,
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
      setParticipantResolutionError({
        message: "현재 참가 중인 회원을 찾지 못했습니다.",
        targetSlug,
      });
      return;
    }

    const transferSequence = beginTransferOwnerRequest();
    setManagementMessage(null);
    transferOwner.reset();
    transferOwner.mutate(
      { slug: roomSlug, userSlug: targetSlug },
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
                          setManagementMessage(null);
                          setParticipantResolutionError(null);
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
            feedback={
              <>
                {managementMessage ? (
                  <p className={styles.managementMessage} role="status">
                    {managementMessage}
                  </p>
                ) : null}
                {kickParticipant.error ? (
                  <p className={styles.managementError} role="alert">
                    {kickParticipant.error.message ||
                      "사용자 관리 요청을 처리하지 못했습니다."}
                  </p>
                ) : null}
                {participantResolutionError?.targetSlug === targetSlug ? (
                  <p className={styles.managementError} role="alert">
                    {participantResolutionError.message}
                  </p>
                ) : null}
                {transferOwnerErrorMessage ? (
                  <p className={styles.managementError} role="alert">
                    {transferOwnerErrorMessage}
                  </p>
                ) : null}
              </>
            }
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
                      width={8}
                      height={8}
                    />
                  </button>
                  <button
                    type="button"
                    className={styles.musicPowerButton}
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
                      width={8}
                      height={8}
                    />
                  </button>
                </div>
              ) : null
            }
            musicPowerNotice={
              musicPowerNotice?.targetSlug === targetSlug ? (
                <p className={styles.musicPowerNotice} role="alert">
                  {musicPowerNotice.message}
                </p>
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
