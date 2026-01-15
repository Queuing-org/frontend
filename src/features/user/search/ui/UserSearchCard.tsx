"use client";

import SendFriendRequestButton from "@/src/features/friend/requests/ui/SendFriendRequestButton";
import type { SearchUser } from "../model/types";

// 현재 닉네임으로 친구추가 post하는데 추후 백엔드에서 슬러그로 변경예정.
export default function UserSearchCard({ user }: { user: SearchUser }) {
  return (
    <div className="border p-3 text-black flex justify-between">
      <div className="space-y-1 flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-semibold">닉네임:</span> {user.nickname}
        </div>
        <div className="text-sm">
          <span className="font-semibold">슬러그:</span> {user.slug}
        </div>
        <div className="text-sm">
          <span className="font-semibold">relationship:</span>{" "}
          {user.relationship}
        </div>
      </div>

      <div>
        <SendFriendRequestButton targetSlug={user.nickname} />
      </div>
    </div>
  );
}
