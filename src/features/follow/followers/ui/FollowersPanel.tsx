"use client";

import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import FollowListState from "@/src/features/follow/ui/FollowListState";
import FollowersList from "./FollowersList";

type Props = {
  onSelectUser: Parameters<typeof FollowersList>[0]["onSelectUser"];
};

export default function FollowersPanel({ onSelectUser }: Props) {
  return (
    <QueryBoundary
      fallback={
        <FollowListState>
          <LoadingSpinner ariaLabel="팔로워 목록 로딩 중" />
        </FollowListState>
      }
      errorTitle="팔로워 목록을 불러오지 못했어요."
      errorDescription="다시 시도해 주세요."
    >
      <FollowersList onSelectUser={onSelectUser} />
    </QueryBoundary>
  );
}
