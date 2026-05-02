"use client";

import Image from "next/image";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { useFriendRequestTargetStatus } from "@/src/features/friend/requests/hooks/useFriendRequestTargetStatus";
import { useSendFriendRequest } from "@/src/features/friend/requests/hooks/useSendFriendRequest";
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
  const { data: me } = useMe();
  const { error, isPending, mutate, reset, variables } =
    useSendFriendRequest();
  const targetSlug = currentRequester?.slug ?? null;
  const { data: friendRequestStatus } =
    useFriendRequestTargetStatus(targetSlug);

  const isSelf = isCurrentUserProfile(currentRequester, me);
  const canFollow = !!currentRequester?.slug && !isSelf;
  const isCurrentMutationPending =
    isPending && variables?.targetSlug === targetSlug;
  const isRequestingFollow =
    friendRequestStatus === "pending" || isCurrentMutationPending;
  const hasRequestedFollow = friendRequestStatus === "sent";
  const shouldShowError =
    !!error && !!targetSlug && variables?.targetSlug === targetSlug;

  function handleFollow() {
    if (
      !currentRequester?.slug ||
      isRequestingFollow ||
      hasRequestedFollow
    ) {
      return;
    }

    reset();
    mutate({ targetSlug: currentRequester.slug });
  }

  let buttonLabel = "팔로우";
  if (!currentRequester) {
    buttonLabel = "대상 없음";
  } else if (isSelf) {
    buttonLabel = "나";
  } else if (hasRequestedFollow) {
    buttonLabel = "팔로잉";
  } else if (isRequestingFollow) {
    buttonLabel = "요청 중...";
  } else if (!currentRequester.slug) {
    buttonLabel = "준비 중";
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
            <button
              type="button"
              className={styles.followButton}
              onClick={handleFollow}
              disabled={!canFollow || isRequestingFollow || hasRequestedFollow}
            >
              {buttonLabel}
            </button>
          </div>
          {shouldShowError ? (
            <div className={styles.error}>{error.message}</div>
          ) : null}
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
