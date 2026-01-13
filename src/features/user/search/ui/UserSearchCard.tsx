"use client";

import type { SearchUser } from "../model/types";

export default function UserSearchCard({ user }: { user: SearchUser }) {
  return (
    <div className="border p-2">
      <div className="text-sm">{user.nickname}</div>
      <div className="text-xs text-gray-600">{user.slug}</div>
      <div className="text-xs">relationship: {user.relationship}</div>
    </div>
  );
}
