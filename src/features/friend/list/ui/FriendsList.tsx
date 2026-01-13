"use client";

import { useFriendsList } from "../hooks/useFriendsList";
import FriendCard from "./FriendCard";

export default function FriendsList() {
  const { data, isLoading, isError } = useFriendsList({ size: 20 });

  if (isLoading)
    return <div className="border p-4 text-black">친구목록 로딩중...</div>;
  if (isError)
    return <div className="border p-4 text-black">친구목록 로딩 실패</div>;

  const friends = data?.friends ?? [];

  return (
    <div className="border p-4 space-y-3 text-black">
      <div className="text-sm font-semibold">친구목록</div>

      {friends.length === 0 ? (
        <div className="text-sm">친구 없음</div>
      ) : (
        <ul className="space-y-2">
          {friends.map((f) => (
            <FriendCard key={f.slug} friend={f} />
          ))}
        </ul>
      )}
    </div>
  );
}
