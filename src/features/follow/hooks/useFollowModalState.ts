"use client";

import { useState } from "react";
import { useSearchUsers } from "@/src/features/user/search/hooks/useSearchUsers";
import type { SearchUser } from "@/src/features/user/search/model/types";

export type FollowTab = "following" | "followers" | "blocked";

type UseFollowModalStateParams = {
  onClose: () => void;
};

export function useFollowModalState({ onClose }: UseFollowModalStateParams) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [activeTab, setActiveTab] = useState<FollowTab>("following");
  const { data, isLoading, isError } = useSearchUsers({ query });

  const updateQuery = (value: string) => {
    setQuery(value);
    setSelectedUser(null);
  };

  const closeModal = () => {
    setQuery("");
    setSelectedUser(null);
    setActiveTab("following");
    onClose();
  };

  return {
    activeTab,
    closeModal,
    isSearchError: isError,
    isSearchLoading: isLoading,
    query,
    selectedUser,
    setActiveTab,
    setSelectedUser,
    tabCounts: {} satisfies Partial<Record<FollowTab, string>>,
    updateQuery,
    users: data?.items ?? [],
  };
}
