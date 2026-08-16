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
  const visibleRoom = user.online === true ? user.room : null;

  return (
    <FollowUserCard
      nickname={user.nickname}
      onSelect={
        onSelect ? (trigger) => onSelect(user, trigger) : undefined
      }
      presence={
        user.online === undefined ? undefined : { online: user.online }
      }
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
