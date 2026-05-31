"use client";

import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
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
        <FollowToggleButton
          disabled={user.relationship === "ME"}
          disabledLabel="나"
          initialRelationship={user.relationship}
          targetSlug={user.slug}
        />
      </div>
    </div>
  );
}
