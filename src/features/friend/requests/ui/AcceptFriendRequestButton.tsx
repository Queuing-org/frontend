"use client";

import { useAcceptFriendRequest } from "../hooks/useAcceptFriendRequest";
import { AcceptFriendRequestParams } from "../model/types";

export default function AcceptFriendRequestButton({
  requestId,
}: AcceptFriendRequestParams) {
  const { mutate, isPending, isError, error } = useAcceptFriendRequest();

  return (
    <div>
      <button
        type="button"
        className="cursor-pointer items-center"
        onClick={() => mutate({ requestId })}
        disabled={isPending}
      >
        {isPending ? "수락중..." : "수락"}
      </button>

      {isError && <div className="border">{error?.message}</div>}
    </div>
  );
}
