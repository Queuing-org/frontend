"use client";

import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import FollowersList from "./FollowersList";
import styles from "./FollowersList.module.css";

export default function FollowersPanel() {
  return (
    <QueryBoundary
      fallback={<div className={styles.state}>팔로워 목록 로딩중...</div>}
      errorTitle="팔로워 목록을 불러오지 못했어요."
      errorDescription="다시 시도해 주세요."
    >
      <FollowersList />
    </QueryBoundary>
  );
}
