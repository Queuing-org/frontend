"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatOptionalStat } from "@/src/shared/lib/formatOptionalStat";
import { getRepresentativeBadge } from "@/src/features/badge/model/badgeDisplay";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import { useRecommendMusicPower } from "@/src/features/user/profile/hooks/useRecommendMusicPower";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import type { CurrentRequesterProfile } from "../model/types";
import styles from "./RoomProfilePanel.module.css";

type Props = {
  currentRequester: CurrentRequesterProfile | null;
  currentTrackTitle?: string | null;
};

function isCurrentUserProfile(
  currentRequester: CurrentRequesterProfile | null,
  me: ReturnType<typeof useMe>["data"],
) {
  if (!currentRequester || !me) {
    return false;
  }

  if (currentRequester.slug) {
    return me.slug === currentRequester.slug;
  }

  if (
    typeof me.userId === "number" &&
    typeof currentRequester.userId === "number" &&
    me.userId === currentRequester.userId
  ) {
    return true;
  }

  return me.nickname === currentRequester.nickname;
}

export default function RoomProfilePanel({ currentRequester }: Props) {
  const {
    data: me,
    isError: isCurrentUserError,
    isLoading: isCurrentUserLoading,
  } = useMe();
  const targetSlug = currentRequester?.slug ?? null;
  const { data: publicProfile, isLoading: isPublicProfileLoading } =
    useUserProfile(targetSlug);
  const musicPowerQuery = useMusicPower(targetSlug);
  const recommendMusicPower = useRecommendMusicPower();
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
  const badgeValue = isPublicProfileLoading || isPublicBadgesLoading
    ? "불러오는 중..."
    : representativeBadge?.name ?? "대표 칭호 없음";
  const musicPower =
    musicPowerQuery.data?.musicPower ?? publicProfile?.musicPower;
  const isRecommendationDisabled =
    !me ||
    isSelf ||
    !targetSlug ||
    musicPowerQuery.isLoading ||
    musicPowerQuery.data?.recommendedByMe !== false ||
    recommendMusicPower.isPending;
  const recommendationLabel = (() => {
    if (!me) {
      return "로그인 후 음악력을 추천할 수 있습니다";
    }
    if (!targetSlug) {
      return "추천 대상 정보를 준비 중입니다";
    }
    if (musicPowerQuery.isLoading) {
      return "음악력 추천 상태 확인 중";
    }
    if (!musicPowerQuery.data) {
      return "음악력 추천 상태를 확인할 수 없습니다";
    }
    if (musicPowerQuery.data.recommendedByMe) {
      return "이미 음악력을 추천했습니다";
    }
    if (recommendMusicPower.isPending) {
      return "음악력 추천 중";
    }
    return "음악력 추천";
  })();

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
              {recommendMusicPower.error ? (
                <p className={styles.recommendationError} role="alert">
                  {recommendMusicPower.error.message}
                </p>
              ) : null}
            </div>
          </div>
          {!isSelf ? (
            <div className={styles.musicPowerActions}>
              <button
                type="button"
                className={styles.musicPowerButton}
                aria-label={recommendationLabel}
                title={recommendationLabel}
                disabled={isRecommendationDisabled}
                onClick={() => {
                  if (targetSlug) {
                    recommendMusicPower.mutate(targetSlug);
                  }
                }}
              >
                <ArrowUp aria-hidden="true" size={15} />
              </button>
              <button
                type="button"
                className={styles.musicPowerButton}
                aria-label="음악력 추천 취소는 아직 지원하지 않습니다"
                title="추천 취소 API가 없어 아직 사용할 수 없습니다."
                disabled
              >
                <ArrowDown aria-hidden="true" size={15} />
              </button>
            </div>
          ) : null}
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
