import type { FollowingUser } from "@/src/features/follow/model/types";
import FollowPresenceCard from "../../ui/FollowPresenceCard";

type Props = {
  onSelect: (user: FollowingUser, trigger: HTMLButtonElement) => void;
  user: FollowingUser;
};

export default function FollowingCard({
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
