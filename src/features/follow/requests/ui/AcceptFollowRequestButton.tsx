"use client";

import { useAcceptFollowRequest } from "../hooks/useAcceptFollowRequest";
import type { AcceptFollowRequestParams } from "../model/types";
import styles from "./AcceptFollowRequestButton.module.css";

export default function AcceptFollowRequestButton({
  requestId,
}: AcceptFollowRequestParams) {
  const { mutate, isPending, isError, error } = useAcceptFollowRequest();

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.button}
        onClick={() => mutate({ requestId })}
        disabled={isPending}
      >
        {isPending ? "수락중..." : "수락"}
      </button>

      {isError && <div className={styles.error}>{error?.message}</div>}
    </div>
  );
}
