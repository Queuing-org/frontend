"use client";

import { useState } from "react";
import { useSearchUsers } from "@/src/features/user/search/hooks/useSearchUsers";
import type { SearchUser } from "@/src/features/user/search/model/types";
import { useFollowTabCounts } from "./useFollowTabCounts";

export type FollowTab = "following" | "followers" | "blocked";

type UseFollowModalStateParams = {
  onClose: () => void;
  open: boolean;
};

export function useFollowModalState({ onClose, open }: UseFollowModalStateParams) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [activeTab, setActiveTab] = useState<FollowTab>("following");
  const { data, isLoading, isError } = useSearchUsers({ query });
  const tabCounts = useFollowTabCounts(open);

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
    tabCounts,
    updateQuery,
    users: data?.items ?? [],
  };
}
