"use client";

import { useState } from "react";
import { useFollow } from "@/src/features/follow/follow/hooks/useFollow";
import { useSearchUsers } from "@/src/features/user/search/hooks/useSearchUsers";
import type { SearchUser } from "@/src/features/user/search/model/types";

const SEARCH_RESULT_LIMIT = 10;

export function useAddFriendModalState() {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const searchUsers = useSearchUsers({
    query: selectedUser ? "" : query,
    limit: SEARCH_RESULT_LIMIT,
  });
  const followUser = useFollow();

  const resetFeedback = () => {
    if (followUser.isPending) {
      return;
    }

    setIsSuccess(false);
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
    followUser.mutate(
      { targetSlug: selectedUser.slug },
      { onSuccess: () => setIsSuccess(true) },
    );
  };

  return {
    canSubmit: Boolean(selectedUser) && selectedUser?.relationship !== "ME",
    clearQuery,
    errorMessage: followUser.error?.message ?? null,
    isResultsOpen: query.trim().length > 0 && !selectedUser,
    isSearchError: searchUsers.isError,
    isSearchLoading: searchUsers.isLoading,
    isSubmitting: followUser.isPending,
    isSuccess,
    query,
    selectUser,
    submit,
    updateQuery,
    users: searchUsers.data?.items ?? [],
  };
}
