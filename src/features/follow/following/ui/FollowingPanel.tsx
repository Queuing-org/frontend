"use client";

import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import FollowingList from "./FollowingList";
import styles from "./FollowingList.module.css";

export default function FollowingPanel() {
  return (
    <QueryBoundary
      fallback={<div className={styles.state}>팔로잉 목록 로딩중...</div>}
      errorTitle="팔로잉 목록을 불러오지 못했어요."
      errorDescription="다시 시도해 주세요."
    >
      <FollowingList />
    </QueryBoundary>
  );
}
