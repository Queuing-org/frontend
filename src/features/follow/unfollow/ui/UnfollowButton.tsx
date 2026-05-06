"use client";

import { useRemoveFriend } from "../hooks/useRemoveFriend";
import { RemoveFriendParams } from "../model/types";

export default function RemoveFriendButton({ targetSlug }: RemoveFriendParams) {
  const { mutate, isPending } = useRemoveFriend();

  return (
    <button
      type="button"
      className="border cursor-pointer"
      onClick={() => mutate({ targetSlug })}
      disabled={isPending}
    >
      {isPending ? "삭제중..." : "친구 삭제"}
    </button>
  );
}
