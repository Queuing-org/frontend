"use client";

import type { ReactNode } from "react";
import type { FollowUser } from "../model/types";
import FollowUserCard from "./FollowUserCard";

type Props = {
  actions?: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  user: FollowUser;
};

export default function FollowPresenceCard({
  actions,
  expanded,
  onToggle,
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
      actions={actions}
      expanded={expanded}
      nickname={user.nickname}
      onToggle={onToggle}
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
