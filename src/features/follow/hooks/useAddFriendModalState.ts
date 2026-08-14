"use client";

import { useState } from "react";
import { useFollow } from "@/src/features/follow/follow/hooks/useFollow";
import { useSearchUsers } from "@/src/features/user/search/hooks/useSearchUsers";
import { MIN_USER_SEARCH_QUERY_LENGTH } from "@/src/features/user/search/model/searchUserQuery";
import type { SearchUser } from "@/src/features/user/search/model/types";
import { useDebouncedValue } from "@/src/shared/lib/useDebouncedValue";

const SEARCH_RESULT_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 250;

export function useAddFriendModalState() {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );
  const normalizedQuery = selectedUser ? "" : query.trim();
  const debouncedQuery = useDebouncedValue(
    normalizedQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const isSearchEligible =
    normalizedQuery.length >= MIN_USER_SEARCH_QUERY_LENGTH;
  const isSearchDebouncing = normalizedQuery !== debouncedQuery;
  const activeSearchQuery =
    isSearchEligible && !isSearchDebouncing ? debouncedQuery : "";
  const searchUsers = useSearchUsers({
    query: activeSearchQuery,
    limit: SEARCH_RESULT_LIMIT,
  });
  const followUser = useFollow();
  const users = Array.from(
    new Map(
      (searchUsers.data?.pages ?? [])
        .flatMap((page) => page.items)
        .map((user) => [user.slug, user]),
    ).values(),
  );

  const resetFeedback = () => {
    if (followUser.isPending) {
      return;
    }

    setIsSuccess(false);
    setLocalErrorMessage(null);
    followUser.reset();
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setSelectedUser(null);
    resetFeedback();
  };

  const selectUser = (user: SearchUser) => {
    setQuery(user.nickname);
    setSelectedUser(user);
    resetFeedback();
  };

  const clearQuery = () => {
    setQuery("");
    setSelectedUser(null);
    resetFeedback();
  };

  const submit = () => {
    if (!selectedUser || selectedUser.relationship === "ME" || followUser.isPending) {
      return;
    }

    resetFeedback();
    if (
      selectedUser.relationship === "FOLLOWING" ||
      selectedUser.relationship === "FRIEND"
    ) {
      setLocalErrorMessage("이미 팔로우 중인 친구예요!");
      return;
    }

    followUser.mutate(
      { targetSlug: selectedUser.slug },
      { onSuccess: () => setIsSuccess(true) },
    );
  };

  return {
    canSubmit: Boolean(selectedUser) && selectedUser?.relationship !== "ME",
    clearQuery,
    errorMessage: localErrorMessage ?? followUser.error?.message ?? null,
    isResultsOpen: isSearchEligible && !selectedUser,
    isSearchError: !isSearchDebouncing && searchUsers.isError,
    isSearchLoading:
      isSearchEligible && (isSearchDebouncing || searchUsers.isLoading),
    isFetchingNextPage: searchUsers.isFetchingNextPage,
    isFetchNextPageError: searchUsers.isFetchNextPageError,
    hasNextPage: searchUsers.hasNextPage,
    fetchNextPage: searchUsers.fetchNextPage,
    isSubmitting: followUser.isPending,
    isSuccess,
    query,
    selectUser,
    submit,
    updateQuery,
    users: isSearchDebouncing ? [] : users,
  };
}
