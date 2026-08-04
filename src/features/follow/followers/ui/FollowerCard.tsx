import type { FollowerUser } from "@/src/features/follow/model/types";
import FollowPresenceCard from "../../ui/FollowPresenceCard";

export default function FollowerCard({ user }: { user: FollowerUser }) {
  return <FollowPresenceCard user={user} />;
}
