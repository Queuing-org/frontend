import type { FollowingUser } from "@/src/features/follow/model/types";
import FollowPresenceCard from "../../ui/FollowPresenceCard";

export default function FollowingCard({ user }: { user: FollowingUser }) {
  return <FollowPresenceCard user={user} />;
}
