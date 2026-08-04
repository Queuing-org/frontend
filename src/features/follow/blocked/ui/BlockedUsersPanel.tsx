"use client";

import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import BlockedUsersList from "./BlockedUsersList";
import styles from "./BlockedUsersPanel.module.css";

export default function BlockedUsersPanel() {
  return (
    <QueryBoundary
      fallback={<div className={styles.state}>차단 목록 로딩중...</div>}
      errorTitle="차단 목록을 불러오지 못했어요."
      errorDescription="다시 시도해 주세요."
    >
      <BlockedUsersList />
    </QueryBoundary>
  );
}
