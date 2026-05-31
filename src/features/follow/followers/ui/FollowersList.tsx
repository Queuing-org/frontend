"use client";

import { useFollowersList } from "../hooks/useFollowersList";
import FollowerCard from "./FollowerCard";
import styles from "./FollowersList.module.css";

export default function FollowersList() {
  const { data, isLoading, isError } = useFollowersList({ size: 100 });

  if (isLoading)
    return <div className={styles.state}>팔로워 목록 로딩중...</div>;

  if (isError)
    return <div className={styles.state}>팔로워 목록 로딩 실패</div>;

  const followers = data?.items ?? [];

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
