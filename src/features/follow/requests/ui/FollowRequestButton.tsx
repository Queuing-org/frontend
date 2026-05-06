"use client";

import { useFollowRequestTargetStatus } from "../hooks/useFollowRequestTargetStatus";
import { useSendFollowRequest } from "../hooks/useSendFollowRequest";
import type { SendFollowRequestPayload } from "../model/types";

export default function FollowRequestButton({
  targetSlug,
}: SendFollowRequestPayload) {
  const { mutate, isPending, isError, error, variables } =
    useSendFollowRequest();
  const { data: followRequestStatus } =
    useFollowRequestTargetStatus(targetSlug);
  const isCurrentMutationPending =
    isPending && variables?.targetSlug === targetSlug;
  const isRequesting =
    followRequestStatus === "pending" || isCurrentMutationPending;
  const hasRequested = followRequestStatus === "sent";

  function handleClick() {
    if (isRequesting || hasRequested) {
      return;
    }

    mutate({ targetSlug });
  }

  return (
    <div>
      <button
        type="button"
        className="border cursor-pointer"
        onClick={handleClick}
        disabled={isRequesting || hasRequested}
      >
        {hasRequested ? "요청됨" : isRequesting ? "요청중..." : "친구추가"}
      </button>

      {isError && variables?.targetSlug === targetSlug && (
        <div>{error?.message}</div>
      )}
    </div>
  );
}
