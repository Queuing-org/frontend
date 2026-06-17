"use client";

import { useFollowingList } from "../hooks/useFollowingList";
import FollowingCard from "./FollowingCard";
import styles from "./FollowingList.module.css";

export default function FollowingList() {
  const { data } = useFollowingList({ size: 100 });
  const followingUsers = data.items;

  return (
    <div className={styles.container}>
      {followingUsers.length === 0 ? (
        <div className={styles.state}>팔로잉한 사용자가 없습니다.</div>
      ) : (
        <ul className={styles.list}>
          {followingUsers.map((user) => (
            <FollowingCard key={user.slug} user={user} />
          ))}
        </ul>
      )}
    </div>
  );
}
