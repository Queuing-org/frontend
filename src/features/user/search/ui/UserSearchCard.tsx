"use client";

import FollowRequestButton from "@/src/features/follow/requests/ui/FollowRequestButton";
import type { SearchUser } from "../model/types";

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
        <FollowRequestButton targetSlug={user.slug} />
      </div>
    </div>
  );
}
