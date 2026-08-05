"use client";

import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import type { FollowRelationship } from "@/src/features/follow/follow/model/types";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import type { FollowUser } from "../model/types";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import styles from "./FollowUserActions.module.css";

type Props = {
  initialRelationship: FollowRelationship | null;
  onBlock: (user: FollowUser) => void;
  user: FollowUser;
};

export default function FollowUserActions({
  initialRelationship,
  onBlock,
  user,
}: Props) {
  const relationship = useFollowingRelationship(
    initialRelationship ? null : user.slug,
  );
  const isCheckingRelationship =
    initialRelationship === null && relationship.isLoading;
  const hasRelationshipError =
    initialRelationship === null && relationship.isError;
  const resolvedRelationship =
    initialRelationship ?? (relationship.data ? "FOLLOWING" : "NONE");

  return (
    <>
      <FollowToggleButton
        className={styles.relationshipButton}
        disabled={isCheckingRelationship || hasRelationshipError}
        disabledLabel={
          hasRelationshipError ? (
            "확인 실패"
          ) : (
            <LoadingSpinner ariaLabel="팔로우 관계 확인 중" size={16} />
          )
        }
        initialRelationship={resolvedRelationship}
        targetSlug={user.slug}
      />
      <button
        type="button"
        className={styles.blockButton}
        onClick={() => onBlock(user)}
      >
        차단
      </button>
    </>
  );
}
