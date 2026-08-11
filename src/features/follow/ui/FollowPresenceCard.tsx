"use client";

import type { FollowUser } from "../model/types";
import FollowUserCard from "./FollowUserCard";

type Props = {
  onSelect?: (user: FollowUser, trigger: HTMLButtonElement) => void;
  user: FollowUser;
};

export default function FollowPresenceCard({
  onSelect,
  user,
}: Props) {
  const visibleRoom = user.online ? user.room : null;
  const statusText = visibleRoom
    ? `${visibleRoom.title} 참여 중`
    : user.online
      ? "온라인"
      : "오프라인";

  return (
    <FollowUserCard
      nickname={user.nickname}
      onSelect={
        onSelect ? (trigger) => onSelect(user, trigger) : undefined
      }
      presence={{
        inRoom: Boolean(visibleRoom),
        online: user.online,
        text: statusText,
      }}
      profileImageUrl={user.profileImageUrl}
      roomLink={
        visibleRoom
          ? {
              href: `/room/${encodeURIComponent(visibleRoom.slug)}`,
              label: `${visibleRoom.title} 방으로 이동`,
            }
          : undefined
      }
    />
  );
}
