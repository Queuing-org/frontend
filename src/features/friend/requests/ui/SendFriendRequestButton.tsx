"use client";

import { useSendFriendRequest } from "../hooks/useSendFriendRequest";
import type { SendFriendRequestPayload } from "../model/types";

export default function SendFriendRequestButton({
  targetSlug,
}: SendFriendRequestPayload) {
  const { mutate, isPending, isError, error } = useSendFriendRequest();

  return (
    <div>
      <button
        type="button"
        className="border cursor-pointer"
        onClick={() => mutate({ targetSlug })}
        disabled={isPending}
      >
        {isPending ? "요청중..." : "친구추가"}
      </button>

      {isError && <div>{error?.message}</div>}
    </div>
  );
}
