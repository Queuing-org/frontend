"use client";

import { useFriendRequestTargetStatus } from "../hooks/useFriendRequestTargetStatus";
import { useSendFriendRequest } from "../hooks/useSendFriendRequest";
import type { SendFriendRequestPayload } from "../model/types";

export default function SendFriendRequestButton({
  targetSlug,
}: SendFriendRequestPayload) {
  const { mutate, isPending, isError, error, variables } =
    useSendFriendRequest();
  const { data: friendRequestStatus } =
    useFriendRequestTargetStatus(targetSlug);
  const isCurrentMutationPending =
    isPending && variables?.targetSlug === targetSlug;
  const isRequesting =
    friendRequestStatus === "pending" || isCurrentMutationPending;
  const hasRequested = friendRequestStatus === "sent";

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
