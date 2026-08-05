"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { formatOptionalStat } from "@/src/shared/lib/formatOptionalStat";
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
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import ReportChatMessageModal, {
  type ReportChatMessageTarget,
} from "@/src/features/room/chat/ui/ReportChatMessageModal";
import { useCurrentTrackMusicPowerVote } from "../hooks/useCurrentTrackMusicPowerVote";
import type { CurrentRequesterProfile } from "../model/types";
import RoomProfileManagementMenu from "./RoomProfileManagementMenu";
import styles from "./RoomProfilePanel.module.css";

type Props = {
  currentUser: User | null;
  currentRequester: CurrentRequesterProfile | null;
  currentTrackTitle?: string | null;
  isCurrentUserLoading: boolean;
  reportMessageKey?: string | null;
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
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
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const targetSlug = currentRequester?.slug ?? null;
  const { data: publicProfile, isLoading: isPublicProfileLoading } =
    useUserProfile(targetSlug);
  const musicPowerQuery = useMusicPower(targetSlug);
  const musicPowerVote = useCurrentTrackMusicPowerVote();
  const kickParticipant = useKickRoomParticipant();
  const { data: publicBadges, isLoading: isPublicBadgesLoading } =
    usePublicUserBadges(targetSlug);

  const isSelf = isCurrentUserProfile(currentRequester, currentUser);
  const shouldShowFollowAction = Boolean(currentRequester) && !isSelf;
  const canFollow = shouldShowFollowAction && !!targetSlug && !!currentUser;
  const canManage = canFollow;
  const isCurrentUserRoomOwner = isRoomOwner(roomMeta?.owner, currentUser);
  const isTargetRoomOwner = isRoomOwner(roomMeta?.owner, currentRequester);
  const canKick =
    canManage && isCurrentUserRoomOwner && !isTargetRoomOwner && !isSelf;
  const { data: isFollowingCurrentRequester } = useFollowingRelationship(
    canFollow ? targetSlug : null,
  );

  let buttonLabel = "팔로우";
  if (!currentRequester) {
    buttonLabel = "대상 없음";
  } else if (!currentRequester.slug) {
    buttonLabel = "준비 중";
  } else if (isCurrentUserLoading) {
    buttonLabel = "확인 중";
  } else if (!currentUser) {
    buttonLabel = "로그인 필요";
  }

  const representativeBadge =
    publicProfile?.representativeBadge ?? getRepresentativeBadge(publicBadges);
  const displayNickname =
    publicProfile?.nickname ?? currentRequester?.nickname ?? "";
  const displayAvatarUrl =
    publicProfile?.profileImageUrl ?? currentRequester?.avatarUrl ?? null;
  const statusMessage = publicProfile?.statusMessage?.trim() ?? "";
  const badgeValue = isPublicProfileLoading || isPublicBadgesLoading
    ? "불러오는 중..."
    : representativeBadge?.name ?? "대표 칭호 없음";
  const musicPower =
    musicPowerQuery.data?.musicPower ?? publicProfile?.musicPower;
  const isMusicPowerVoteDisabled =
    !currentUser ||
    isSelf ||
    !targetSlug ||
    !roomSlug ||
    musicPowerQuery.isLoading ||
    !musicPowerQuery.data ||
    musicPowerVote.isPending;
  const musicPowerVoteDisabledLabel = (() => {
    if (!currentUser) {
      return "로그인 후 음악력에 투표할 수 있습니다";
    }
    if (isSelf) {
      return "본인의 음악력에는 투표할 수 없습니다";
    }
    if (!targetSlug) {
      return "투표 대상은 회원 신청자만 가능합니다";
    }
    if (musicPowerQuery.isLoading) {
      return "음악력 투표 상태 확인 중";
    }
    if (!musicPowerQuery.data) {
      return "음악력 투표 상태를 확인할 수 없습니다";
    }
    if (musicPowerVote.isPending) {
      return "음악력 투표 처리 중";
    }
    return null;
  })();

  const handleMusicPowerVote = (vote: MusicPowerVote) => {
    if (isMusicPowerVoteDisabled || !musicPowerQuery.data) {
      return;
    }

    musicPowerVote.mutate({
      roomSlug,
      password: roomPassword,
      vote,
    });
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
    if (!targetSlug || !canKick) {
      return;
    }

    setManagementMessage(null);
    kickParticipant.reset();
    kickParticipant.mutate(
      {
        password: roomPassword,
        slug: roomSlug,
        userSlug: targetSlug,
      },
      {
        onSuccess: () => {
          setManagementMessage(`${displayNickname}님을 내보냈습니다.`);
        },
      },
    );
  };

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
                    width={18}
                    height={18}
                    className={styles.ownerIcon}
                  />
                ) : null}
              </div>
              <div className={styles.activity}>현재 큐잉 중...</div>
            </div>
          </div>
          {shouldShowFollowAction ? (
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
                  disabledLabel={buttonLabel}
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
                    onClick={() => {
                      setManagementMessage(null);
                      setIsManagementOpen((current) => !current);
                    }}
                  >
                    <span>관리</span>
                    <ChevronDown aria-hidden="true" size={18} />
                  </button>
                  <RoomProfileManagementMenu
                    canKick={canKick}
                    isKickPending={kickParticipant.isPending}
                    onBlock={handleBlock}
                    onClose={() => setIsManagementOpen(false)}
                    onKick={handleKick}
                    onReport={handleReport}
                    open={isManagementOpen}
                    triggerRef={manageButtonRef}
                  />
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
                "참가자를 내보내지 못했습니다."}
            </p>
          ) : null}
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>칭호</div>
              <div className={styles.cardValue}>
                {targetSlug ? badgeValue : "-"}
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
              <div className={styles.cardValue}>개발중입니다.</div>
            </div>
          </div>
          <div className={styles.musicPowerRow}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>음악력</div>
              <div className={styles.musicPowerValue}>
                <span>{formatOptionalStat(musicPower)}</span>
              </div>
              {musicPowerVote.error ? (
                <p className={styles.recommendationError} role="alert">
                  {musicPowerVote.error.message}
                </p>
              ) : null}
            </div>
            <div className={styles.musicPowerActions}>
              <button
                type="button"
                className={styles.musicPowerButton}
                aria-label={musicPowerVoteDisabledLabel ?? "음악력 올리기"}
                title={musicPowerVoteDisabledLabel ?? "음악력 올리기"}
                disabled={isMusicPowerVoteDisabled}
                onClick={() => handleMusicPowerVote("UPVOTE")}
              >
                <ArrowUp aria-hidden="true" size={15} />
              </button>
              <button
                type="button"
                className={styles.musicPowerButton}
                aria-label={musicPowerVoteDisabledLabel ?? "음악력 내리기"}
                title={musicPowerVoteDisabledLabel ?? "음악력 내리기"}
                disabled={isMusicPowerVoteDisabled}
                onClick={() => handleMusicPowerVote("DOWNVOTE")}
              >
                <ArrowDown aria-hidden="true" size={15} />
              </button>
            </div>
          </div>
          <BlockUserModal
            onBlocked={(target) => {
              setManagementMessage(`${target.nickname}님을 차단했습니다.`);
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
