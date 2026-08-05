import type { BlockedUser } from "../model/types";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import FollowUserCard from "../../ui/FollowUserCard";
import styles from "./BlockedUsersPanel.module.css";

type Props = {
  isPending: boolean;
  onUnblock: (slug: string) => void;
  user: BlockedUser;
};

export default function BlockedUserCard({
  isPending,
  onUnblock,
  user,
}: Props) {
  return (
    <FollowUserCard
      nickname={user.nickname}
      profileImageUrl={user.profileImageUrl}
      trailingAction={
        <button
          type="button"
          className={styles.unblockButton}
          disabled={isPending}
          onClick={() => onUnblock(user.slug)}
        >
          {isPending ? (
            <LoadingSpinner ariaLabel="차단 해제 중" size={16} />
          ) : (
            "차단 해제"
          )}
        </button>
      }
    />
  );
}
