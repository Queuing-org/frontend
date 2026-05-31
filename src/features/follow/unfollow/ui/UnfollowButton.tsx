"use client";

import { useUnfollow } from "../hooks/useUnfollow";
import type { UnfollowParams } from "../model/types";
import styles from "./UnfollowButton.module.css";

export default function UnfollowButton({ targetSlug }: UnfollowParams) {
  const { mutate, isPending } = useUnfollow();

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => mutate({ targetSlug })}
      disabled={isPending}
    >
      {isPending ? "언팔로우 중..." : "언팔로우"}
    </button>
  );
}
