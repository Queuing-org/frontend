import type { FollowerUser } from "@/src/features/follow/model/types";
import FollowPresenceCard from "../../ui/FollowPresenceCard";
import FollowUserActions from "../../ui/FollowUserActions";

type Props = {
  expanded: boolean;
  onBlock: (user: FollowerUser) => void;
  onToggle: (slug: string) => void;
  user: FollowerUser;
};

export default function FollowerCard({
  expanded,
  onBlock,
  onToggle,
  user,
}: Props) {
  return (
    <FollowPresenceCard
      actions={
        <FollowUserActions
          initialRelationship={null}
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
