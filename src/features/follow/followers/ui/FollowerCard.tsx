import type { FollowerUser } from "@/src/features/follow/model/types";
import FollowPresenceCard from "../../ui/FollowPresenceCard";

type Props = {
  onSelect: (user: FollowerUser, trigger: HTMLButtonElement) => void;
  user: FollowerUser;
};

export default function FollowerCard({
  onSelect,
  user,
}: Props) {
  return (
    <FollowPresenceCard
      onSelect={onSelect}
      user={user}
    />
  );
}
