"use client";

import { useFollowingList } from "../hooks/useFollowingList";
import FollowingCard from "./FollowingCard";
import styles from "./FollowingList.module.css";

export default function FollowingList() {
  const { data, isLoading, isError } = useFollowingList({ size: 20 });

  if (isLoading)
    return <div className={styles.state}>친구목록 로딩중...</div>;
  if (isError)
    return <div className={styles.state}>친구목록 로딩 실패</div>;

  const followingUsers = data?.items ?? [];

  return (
    <div className={styles.container}>
      {followingUsers.length === 0 ? (
        <div className={styles.state}>친구 없음</div>
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
