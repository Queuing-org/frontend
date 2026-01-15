"use client";

import type { Friend } from "@/src/entities/friend/model/types";
import RemoveFriendButton from "../../remove/ui/RemoveFriendButton";

export default function FriendCard({ friend }: { friend: Friend }) {
  return (
    <li className="border p-3 space-y-1 text-black">
      <div className="text-sm">
        <span className="font-semibold">닉네임:</span> {friend.nickname}
      </div>

      <div className="flex justify-end ">
        <RemoveFriendButton targetSlug={friend.slug} />
      </div>
    </li>
  );
}
