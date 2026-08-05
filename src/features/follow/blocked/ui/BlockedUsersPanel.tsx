"use client";

import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import FollowListState from "@/src/features/follow/ui/FollowListState";
import BlockedUsersList from "./BlockedUsersList";

export default function BlockedUsersPanel() {
  return (
    <QueryBoundary
      fallback={
        <FollowListState>
          <LoadingSpinner ariaLabel="차단 목록 로딩 중" />
        </FollowListState>
      }
      errorTitle="차단 목록을 불러오지 못했어요."
      errorDescription="다시 시도해 주세요."
    >
      <BlockedUsersList />
    </QueryBoundary>
  );
}
