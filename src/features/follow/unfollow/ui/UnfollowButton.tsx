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
      {isPending ? "삭제중..." : "친구 삭제"}
    </button>
  );
}
