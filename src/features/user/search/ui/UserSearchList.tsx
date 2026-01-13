"use client";

import type { SearchUsersResponse } from "../model/types";
import UserSearchCard from "./UserSearchCard";

export default function UserSearchList({
  data,
}: {
  data?: SearchUsersResponse;
}) {
  const items = data?.items ?? [];

  return (
    <div className="space-y-2">
      {items.map((user) => (
        <UserSearchCard key={user.slug} user={user} />
      ))}
    </div>
  );
}
