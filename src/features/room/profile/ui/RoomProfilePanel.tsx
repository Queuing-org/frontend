"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatOptionalStat } from "@/src/shared/lib/formatOptionalStat";
import { getRepresentativeBadge } from "@/src/features/badge/model/badgeDisplay";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import type { MusicPowerVote } from "@/src/features/user/profile/model/types";
import { useCurrentTrackMusicPowerVote } from "../hooks/useCurrentTrackMusicPowerVote";
import type { CurrentRequesterProfile } from "../model/types";
import styles from "./RoomProfilePanel.module.css";

type Props = {
  currentRequester: CurrentRequesterProfile | null;
  currentTrackTitle?: string | null;
  roomPassword?: string | null;
  roomSlug: string;
};

function isCurrentUserProfile(
  currentRequester: CurrentRequesterProfile | null,
  me: ReturnType<typeof useMe>["data"],
) {
  if (!currentRequester || !me) {
    return false;
  }

  return Boolean(
    currentRequester.slug && me.slug === currentRequester.slug,
  );
}

export default function RoomProfilePanel({
  currentRequester,
  roomPassword,
  roomSlug,
}: Props) {
  const {
    data: me,
    isError: isCurrentUserError,
    isLoading: isCurrentUserLoading,
  } = useMe();
  const targetSlug = currentRequester?.slug ?? null;
  const { data: publicProfile, isLoading: isPublicProfileLoading } =
    useUserProfile(targetSlug);
  const musicPowerQuery = useMusicPower(targetSlug);
  const musicPowerVote = useCurrentTrackMusicPowerVote();
  const { data: publicBadges, isLoading: isPublicBadgesLoading } =
    usePublicUserBadges(targetSlug);

  const isSelf = isCurrentUserProfile(currentRequester, me);
  const shouldShowFollowAction = Boolean(currentRequester) && !isSelf;
  const canFollow = shouldShowFollowAction && !!targetSlug && !!me;
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
  } else if (isCurrentUserError) {
    buttonLabel = "확인 실패";
  } else if (!me) {
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
    !me ||
    isSelf ||
    !targetSlug ||
    !roomSlug ||
    musicPowerQuery.isLoading ||
    !musicPowerQuery.data ||
    musicPowerVote.isPending;
  const musicPowerVoteDisabledLabel = (() => {
    if (!me) {
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
              <div className={styles.name}>{displayNickname}</div>
              {statusMessage ? (
                <div className={styles.statusMessage}>{statusMessage}</div>
              ) : null}
            </div>
            {shouldShowFollowAction ? (
              <FollowToggleButton
                className={styles.followButton}
                disabled={!canFollow}
                disabledLabel={buttonLabel}
                initialRelationship={
                  isFollowingCurrentRequester ? "FOLLOWING" : "NONE"
                }
                targetSlug={targetSlug}
              />
            ) : null}
          </div>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>칭호</div>
              <div className={styles.cardValue}>
                {targetSlug ? badgeValue : "-"}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>최애곡</div>
              <div className={styles.cardValue}>-</div>
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
            <div className={styles.card}>
              <div className={styles.cardTitle}>음악력</div>
              <div className={styles.musicPowerValue}>
                <span>{formatOptionalStat(musicPower)}</span>
              </div>
              <p className={styles.musicPowerHint}>
                동일한 사용자에게는 1시간에 한 번만 음악력을 평가할 수
                있습니다.
              </p>
              {musicPowerVote.error ? (
                <p className={styles.recommendationError} role="alert">
                  {musicPowerVote.error.message}
                </p>
              ) : null}
            </div>
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
