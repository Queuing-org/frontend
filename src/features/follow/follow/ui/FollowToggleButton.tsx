"use client";

import { useState } from "react";
import { useUnfollow } from "@/src/features/follow/unfollow/hooks/useUnfollow";
import { useFollow } from "../hooks/useFollow";
import type { FollowRelationship } from "../model/types";
import styles from "./FollowToggleButton.module.css";

type FollowToggleButtonProps = {
  className?: string;
  disabled?: boolean;
  disabledLabel?: string;
  initialRelationship?: FollowRelationship | null;
  targetSlug?: string | null;
};

function isFollowingRelationship(relationship?: FollowRelationship | null) {
  return relationship === "FOLLOWING" || relationship === "FRIEND";
}

export default function FollowToggleButton({
  className,
  disabled = false,
  disabledLabel = "팔로우",
  initialRelationship = "NONE",
  targetSlug,
}: FollowToggleButtonProps) {
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();
  const [localFollowState, setLocalFollowState] = useState<{
    isFollowing: boolean;
    targetSlug: string;
  } | null>(null);

  const isInitiallyFollowing = isFollowingRelationship(initialRelationship);
  const localIsFollowing =
    localFollowState && localFollowState.targetSlug === targetSlug
      ? localFollowState.isFollowing
      : null;
  const isFollowing = localIsFollowing ?? isInitiallyFollowing;
  const isPending = followMutation.isPending || unfollowMutation.isPending;
  const isDisabled = disabled || !targetSlug || isPending;
  const error = followMutation.error ?? unfollowMutation.error;
  const errorTargetSlug =
    followMutation.variables?.targetSlug ??
    unfollowMutation.variables?.targetSlug;
  const hasError = Boolean(error) && errorTargetSlug === targetSlug;

  const label = (() => {
    if (isPending) {
      return isFollowing ? "언팔로우 중..." : "팔로우 중...";
    }

    if (disabled || !targetSlug) {
      return disabledLabel;
    }

    return isFollowing ? "언팔로우" : "팔로우";
  })();

  const handleClick = () => {
    if (!targetSlug || isDisabled) {
      return;
    }

    followMutation.reset();
    unfollowMutation.reset();

    if (isFollowing) {
      unfollowMutation.mutate(
        { targetSlug },
        {
          onSuccess: () => {
            setLocalFollowState({ targetSlug, isFollowing: false });
          },
        },
      );
      return;
    }

    followMutation.mutate(
      { targetSlug },
      {
        onSuccess: () => {
          setLocalFollowState({ targetSlug, isFollowing: true });
        },
      },
    );
  };

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={[styles.button, className].filter(Boolean).join(" ")}
        data-following={isFollowing}
        onClick={handleClick}
        disabled={isDisabled}
      >
        {label}
      </button>
      {hasError ? <div className={styles.error}>{error?.message}</div> : null}
    </div>
  );
}
