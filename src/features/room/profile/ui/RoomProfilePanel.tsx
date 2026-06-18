"use client";

import Image from "next/image";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import type { CurrentRequesterProfile } from "../model/types";
import styles from "./RoomProfilePanel.module.css";

type Props = {
  currentRequester: CurrentRequesterProfile | null;
  currentTrackTitle?: string | null;
};

const PLACEHOLDER_PROFILE_FIELDS = [
  "칭호",
  "최애곡",
  "큐잉 횟수",
  "이용 시간",
  "음악력",
] as const;

function isCurrentUserProfile(
  currentRequester: CurrentRequesterProfile | null,
  me: ReturnType<typeof useMe>["data"],
) {
  if (!currentRequester || !me) {
    return false;
  }

  if (currentRequester.slug && me.slug === currentRequester.slug) {
    return true;
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

  const isSelf = isCurrentUserProfile(currentRequester, me);
  const canFollow = !!currentRequester?.slug && !!me && !isSelf;
  const { data: isFollowingCurrentRequester } = useFollowingRelationship(
    canFollow ? targetSlug : null,
  );

  let buttonLabel = "팔로우";
  if (!currentRequester) {
    buttonLabel = "대상 없음";
  } else if (isSelf) {
    buttonLabel = "나";
  } else if (!currentRequester.slug) {
    buttonLabel = "준비 중";
  } else if (isCurrentUserLoading) {
    buttonLabel = "확인 중";
  } else if (isCurrentUserError) {
    buttonLabel = "확인 실패";
  } else if (!me) {
    buttonLabel = "로그인 필요";
  }

  return (
    <div className={styles.root}>
      {currentRequester ? (
        <>
          <div className={styles.hero}>
            <div className={styles.avatarWrap}>
              {currentRequester.avatarUrl ? (
                <Image
                  src={currentRequester.avatarUrl}
                  alt={`${currentRequester.nickname} avatar`}
                  fill
                  sizes="56px"
                  unoptimized
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarFallback} aria-hidden="true">
                  {currentRequester.nickname.slice(0, 1)}
                </div>
              )}
            </div>
            <div className={styles.nameBlock}>
              <div className={styles.name}>{currentRequester.nickname}</div>
            </div>
            <FollowToggleButton
              className={styles.followButton}
              disabled={!canFollow}
              disabledLabel={buttonLabel}
              initialRelationship={
                isFollowingCurrentRequester ? "FOLLOWING" : "NONE"
              }
              targetSlug={targetSlug}
            />
          </div>
          <div className={styles.grid}>
            {PLACEHOLDER_PROFILE_FIELDS.map((field) => (
              <div key={field} className={styles.card}>
                <div className={styles.cardTitle}>{field}</div>
                <div className={styles.cardValue}>개발 중입니다.</div>
              </div>
            ))}
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
