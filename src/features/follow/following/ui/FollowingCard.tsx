import type { FollowingUser } from "@/src/features/follow/model/types";
import FollowPresenceCard from "../../ui/FollowPresenceCard";
import FollowUserActions from "../../ui/FollowUserActions";

type Props = {
  expanded: boolean;
  onBlock: (user: FollowingUser) => void;
  onToggle: (slug: string) => void;
  user: FollowingUser;
};

export default function FollowingCard({
  expanded,
  onBlock,
  onToggle,
  user,
}: Props) {
  return (
    <FollowPresenceCard
      actions={
        <FollowUserActions
          initialRelationship="FOLLOWING"
          onBlock={onBlock}
          user={user}
        />
      }
      expanded={expanded}
      onToggle={() => onToggle(user.slug)}
      user={user}
    />
  );
}
