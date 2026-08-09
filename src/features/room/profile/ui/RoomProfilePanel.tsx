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
import { formatOptionalStat } from "@/src/shared/lib/formatOptionalStat";
import { formatListeningDuration } from "@/src/features/user/profile/model/formatListeningDuration";
import { getRepresentativeBadge } from "@/src/features/badge/model/badgeDisplay";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
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
import type { ParticipantKickTarget } from "@/src/features/room/participants/model/participantIdentity";
import ReportChatMessageModal, {
  type ReportChatMessageTarget,
} from "@/src/features/room/chat/ui/ReportChatMessageModal";
import { useCurrentTrackMusicPowerVote } from "../hooks/useCurrentTrackMusicPowerVote";
import type { CurrentRequesterProfile } from "../model/types";
import styles from "./RoomProfilePanel.module.css";

type Props = {
  currentUser: User | null;
  currentRequester: CurrentRequesterProfile | null;
  currentTrackTitle?: string | null;
  isCurrentUserLoading: boolean;
  kickTarget: ParticipantKickTarget | null;
  onUserBlocked: (userSlug: string) => void;
  reportMessageKey?: string | null;
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
};

const MUSIC_POWER_NOTICE_DURATION_MS = 2_000;
const MUSIC_POWER_LIMIT_NOTICE =
  "같은 사용자에게는 1시간에 한 번만 음악력을 올리거나 내릴 수 있습니다.";
const MUSIC_POWER_LOGIN_NOTICE =
  "로그인 후 음악력을 올리거나 내릴 수 있습니다.";

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
  isCurrentUserLoading,
  kickTarget,
  onUserBlocked,
  reportMessageKey,
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
  const [musicPowerNotice, setMusicPowerNotice] =
    useState<MusicPowerNotice | null>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const managementMenuId = useId();
  const musicPowerNoticeTimerRef = useRef<number | null>(null);
  const musicPowerNoticeSequenceRef = useRef(0);
  const targetSlug = currentRequester?.slug ?? null;
  const { data: publicProfile, isLoading: isPublicProfileLoading } =
    useUserProfile(targetSlug);
  const musicPowerQuery = useMusicPower(targetSlug);
  const musicPowerVote = useCurrentTrackMusicPowerVote();
  const kickParticipant = useKickRoomParticipant();
  const transferOwner = useTransferRoomOwner();
  const {
    begin: beginTransferOwnerRequest,
    clear: clearTransferOwnerError,
    message: transferOwnerErrorMessage,
    show: showTransferOwnerError,
  } = useTransientManagementError();
  const { data: publicBadges, isLoading: isPublicBadgesLoading } =
    usePublicUserBadges(targetSlug);

  const isSelf = isCurrentUserProfile(currentRequester, currentUser);
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
    Boolean(kickTarget);
  const canTransfer = canKick && Boolean(targetSlug);
  const managementActions: RoomMemberManagementAction[] = canManage
    ? [
        "report",
        "block",
        ...(canKick ? (["kick"] as const) : []),
        ...(canTransfer ? (["transfer"] as const) : []),
      ]
    : [];
  const { data: isFollowingCurrentRequester } = useFollowingRelationship(
    canFollow ? targetSlug : null,
  );

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
    publicProfile?.representativeBadge ?? getRepresentativeBadge(publicBadges);
  const displayNickname =
    publicProfile?.nickname ?? currentRequester?.nickname ?? "";
  const displayAvatarUrl =
    publicProfile?.profileImageUrl ?? currentRequester?.avatarUrl ?? null;
  const statusMessage = publicProfile?.statusMessage?.trim() ?? "";
  const isBadgeLoading = isPublicProfileLoading || isPublicBadgesLoading;
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
    !roomSlug;
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
    if (!targetSlug || isCurrentUserLoading) {
      return;
    }

    const noticeSequence = ++musicPowerNoticeSequenceRef.current;
    if (!currentUser) {
      showMusicPowerNotice(MUSIC_POWER_LOGIN_NOTICE, targetSlug);
      return;
    }

    if (isMusicPowerVoteDisabled) {
      return;
    }

    if (musicPowerNoticeTimerRef.current !== null) {
      window.clearTimeout(musicPowerNoticeTimerRef.current);
      musicPowerNoticeTimerRef.current = null;
    }
    setMusicPowerNotice(null);
    musicPowerVote.mutate(
      {
        roomSlug,
        password: roomPassword,
        vote,
      },
      {
        onError: (error) => {
          if (musicPowerNoticeSequenceRef.current !== noticeSequence) {
            return;
          }

          showMusicPowerNotice(
            error.message || MUSIC_POWER_LIMIT_NOTICE,
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

  const handleKick = () => {
    if (!kickTarget || !canKick) {
      return;
    }

    setManagementMessage(null);
    kickParticipant.reset();
    kickParticipant.mutate(
      {
        ...kickTarget,
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

  const handleTransfer = () => {
    if (!targetSlug || !canTransfer) {
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
          <div className={styles.hero}>
            <div className={styles.avatarWrap}>
              {displayAvatarUrl ? (
                <Image
                  src={displayAvatarUrl}
                  alt={`${displayNickname} avatar`}
                  fill
                  sizes="56px"
                  unoptimized
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarFallback} aria-hidden="true">
                  {displayNickname.slice(0, 1)}
                </div>
              )}
            </div>
            <div className={styles.nameBlock}>
              <div className={styles.nameRow}>
                <div className={styles.name}>{displayNickname}</div>
                {isTargetRoomOwner ? (
                  <Image
                    src="/icons/onwer_black.svg"
                    alt="방장"
                    width={11}
                    height={11}
                    className={styles.ownerIcon}
                  />
                ) : null}
              </div>
              <div className={styles.activity}>현재 큐잉 중...</div>
            </div>
          </div>
          {isSelf ? (
            <div
              className={styles.selfTrackStatus}
              aria-label="내 신청곡 재생 상태"
            >
              <span className={styles.selfTrackStatusDot} aria-hidden="true" />
              <span>내 노래가 나오고 있어요!</span>
            </div>
          ) : shouldShowFollowAction ? (
            <div
              className={styles.actionRow}
              data-single-action={!canManage || undefined}
              role="group"
              aria-label="프로필 액션"
            >
              <div className={styles.followAction}>
                <FollowToggleButton
                  className={styles.followButton}
                  disabled={!canFollow}
                  disabledLabel={followButtonLabel}
                  followingLabel="팔로잉"
                  initialRelationship={
                    isFollowingCurrentRequester ? "FOLLOWING" : "NONE"
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
                      isKickPending={kickParticipant.isPending}
                      isTransferPending={transferOwner.isPending}
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
          ) : null}
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
          {transferOwnerErrorMessage ? (
            <p className={styles.managementError} role="alert">
              {transferOwnerErrorMessage}
            </p>
          ) : null}
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>칭호</div>
              <div className={styles.cardValue}>
                {targetSlug ? (
                  isBadgeLoading ? (
                    <LoadingSpinner ariaLabel="칭호 로딩 중" size={18} />
                  ) : (
                    badgeValue
                  )
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>한 줄 소개</div>
              <div
                className={`${styles.cardValue} ${styles.statusCardValue}`}
                title={statusMessage || undefined}
              >
                {statusMessage || "-"}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>큐잉 횟수</div>
              <div className={styles.cardValue}>
                {formatOptionalStat(publicProfile?.queuingCount)}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>이용 시간</div>
              <div className={styles.cardValue}>
                {formatListeningDuration(listeningDurationSeconds)}
              </div>
            </div>
          </div>
          <div className={styles.musicPowerRow}>
            <div className={styles.card}>
              <div className={styles.musicPowerHeading}>
                <div className={styles.cardTitle}>음악력</div>
                {musicPowerNotice?.targetSlug === targetSlug ? (
                  <p className={styles.musicPowerNotice} role="alert">
                    {musicPowerNotice.message}
                  </p>
                ) : null}
              </div>
              <div className={styles.musicPowerValue}>
                <span>{formatOptionalStat(musicPower)}</span>
              </div>
            </div>
            {!isSelf && !isCurrentUserLoading ? (
              <>
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
              </>
            ) : null}
          </div>
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
