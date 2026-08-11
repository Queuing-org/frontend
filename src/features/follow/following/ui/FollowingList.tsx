"use client";

import type { FollowingUser } from "@/src/features/follow/model/types";
import FollowListState from "@/src/features/follow/ui/FollowListState";
import { useFollowingList } from "../hooks/useFollowingList";
import FollowingCard from "./FollowingCard";
import styles from "./FollowingList.module.css";

type Props = {
  onSelectUser: (user: FollowingUser, trigger: HTMLButtonElement) => void;
};

export default function FollowingList({ onSelectUser }: Props) {
  const { data } = useFollowingList({ size: 100 });
  const followingUsers = data.items;

  return (
    <>
      {followingUsers.length === 0 ? (
        <FollowListState raised>팔로잉한 사용자가 없습니다.</FollowListState>
      ) : (
        <div className={styles.container}>
          <ul className={styles.list}>
            {followingUsers.map((user) => (
              <FollowingCard key={user.slug} onSelect={onSelectUser} user={user} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
