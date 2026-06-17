"use client";

import { useFollowersList } from "../hooks/useFollowersList";
import FollowerCard from "./FollowerCard";
import styles from "./FollowersList.module.css";

export default function FollowersList() {
  const { data } = useFollowersList({ size: 100 });
  const followers = data.items;

  return (
    <div className={styles.container}>
      {followers.length === 0 ? (
        <div className={styles.state}>팔로워가 없습니다.</div>
      ) : (
        <ul className={styles.list}>
          {followers.map((user) => (
            <FollowerCard key={user.slug} user={user} />
          ))}
        </ul>
      )}
    </div>
  );
}
