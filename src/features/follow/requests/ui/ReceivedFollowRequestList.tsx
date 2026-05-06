"use client";

import { useFetchReceivedFriendRequest } from "../hooks/useFetchReceivedFriendRequest";
import FriendRequestCard from "./FriendRequestCard";

export default function FriendsRequestList() {
  const { data, isLoading, isError } = useFetchReceivedFriendRequest({
    limit: 20,
  });

  if (isLoading)
    return <div className="border p-4 text-black">받은 요청 로딩중...</div>;

  if (isError)
    return <div className="border p-4 text-black">받은 요청 로딩 실패</div>;

  const recived = data?.items ?? [];

  return (
    <div className="border p-4 space-y-3 text-black w-full">
      <div className="text-sm font-semibold">받은 친구요청 리스트</div>

      {recived.length === 0 ? (
        <div className="text-sm">받은 요청이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {recived.map((item) => (
            <li key={item.requestId}>
              <FriendRequestCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
