"use client";

import type { Friend } from "@/src/entities/friend/model/types";
import RemoveFriendButton from "../../remove/ui/RemoveFriendButton";

//현재 백엔드에서 닉네임과 슬러그를 반대로 내려주고있음!! 추후 백엔드 수정시 변경 필요
export default function FriendCard({ friend }: { friend: Friend }) {
  return (
    <li className="border p-3 space-y-1 text-black">
      <div className="text-sm">
        <span className="font-semibold">슬러그:</span> {friend.slug}
      </div>

      <div className="flex justify-end ">
        <RemoveFriendButton targetSlug={friend.nickname} />
      </div>
    </li>
  );
}
