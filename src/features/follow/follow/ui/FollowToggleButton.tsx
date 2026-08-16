"use client";

import { useState, type AriaRole, type ReactNode } from "react";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useUnfollow } from "@/src/features/follow/unfollow/hooks/useUnfollow";
import { useFollow } from "../hooks/useFollow";
import type { FollowRelationship } from "../model/types";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import styles from "./FollowToggleButton.module.css";

type FollowToggleButtonProps = {
  className?: string;
  disabled?: boolean;
  disabledLabel?: ReactNode;
  followingLabel?: string;
  initialRelationship?: FollowRelationship | null;
  onSuccess?: () => void;
  role?: AriaRole;
  targetNickname?: string | null;
  targetSlug?: string | null;
};

function isFollowingRelationship(relationship?: FollowRelationship | null) {
  return relationship === "FOLLOWING" || relationship === "FRIEND";
}

export default function FollowToggleButton({
  className,
  disabled = false,
  disabledLabel = "팔로우",
  followingLabel = "언팔로우",
  initialRelationship = "NONE",
  onSuccess,
  role,
  targetNickname,
  targetSlug,
}: FollowToggleButtonProps) {
  const { notify } = useActionFeedback();
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
  const nickname = targetNickname?.trim() || "사용자";

  const label = (() => {
    if (isPending) {
      return (
        <LoadingSpinner
          ariaLabel={isFollowing ? "언팔로우 중" : "팔로우 중"}
          size={16}
        />
      );
    }

    if (disabled || !targetSlug) {
      return disabledLabel;
    }

    return isFollowing ? followingLabel : "팔로우";
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
            notify({
              dedupeKey: `unfollow:${targetSlug}`,
              message: `'${nickname}'님을 언팔로우했습니다.`,
              tone: "default",
            });
            onSuccess?.();
          },
          onError: (error) => {
            notify({
              dedupeKey: `unfollow:${targetSlug}`,
              message: error.message || "언팔로우하지 못했습니다.",
              tone: "error",
            });
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
          notify({
            dedupeKey: `follow:${targetSlug}`,
            message: `'${nickname}'님을 팔로우했습니다!`,
            tone: "default",
          });
          onSuccess?.();
        },
        onError: (error) => {
          const isAlreadyFollowing =
            error.status === 409 ||
            error.code === "follow.already-following" ||
            error.message.includes("이미 팔로우");
          notify({
            dedupeKey: `follow:${targetSlug}`,
            message: isAlreadyFollowing
              ? "이미 팔로우 중인 사용자입니다."
              : error.message || "팔로우하지 못했습니다.",
            tone: isAlreadyFollowing ? "default" : "error",
          });
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
        role={role}
        onClick={handleClick}
        disabled={isDisabled}
      >
        {label}
      </button>
    </div>
  );
}
