"use client";

import type { FollowerUser } from "@/src/features/follow/model/types";
import FollowListState from "@/src/features/follow/ui/FollowListState";
import { useFollowersList } from "../hooks/useFollowersList";
import FollowerCard from "./FollowerCard";
import styles from "./FollowersList.module.css";

type Props = {
  onSelectUser: (user: FollowerUser, trigger: HTMLButtonElement) => void;
};

export default function FollowersList({ onSelectUser }: Props) {
  const { data } = useFollowersList({ size: 100 });
  const followers = data.items;

  return (
    <>
      {followers.length === 0 ? (
        <FollowListState raised>팔로워가 없습니다.</FollowListState>
      ) : (
        <div className={styles.container}>
          <ul className={styles.list}>
            {followers.map((user) => (
              <FollowerCard key={user.slug} onSelect={onSelectUser} user={user} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
