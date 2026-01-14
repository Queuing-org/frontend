"use client";

import { ReceivedFriendRequest } from "../model/types";

export default function FriendRequestCard({
  item,
}: {
  item: ReceivedFriendRequest;
}) {
  return (
    <div className="border p-3 flex items-center justify-between w-full">
      <div className="min-w-0">
        <div className="text-sm">보낸 사람: {item.requesterNickname}</div>
        <div className="text-xs">요청일: {item.createdAt}</div>
      </div>

      <div className="border p-2 shrink-0">수락/거절 버튼자리</div>
    </div>
  );
}
