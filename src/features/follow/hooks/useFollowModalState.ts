"use client";

import { useState } from "react";
import { useFollowersList } from "@/src/features/follow/followers/hooks/useFollowersList";
import { useFollowingList } from "@/src/features/follow/following/hooks/useFollowingList";
import { useSearchUsers } from "@/src/features/user/search/hooks/useSearchUsers";
import type { SearchUser } from "@/src/features/user/search/model/types";

export type FollowTab = "following" | "followers" | "blocked";

const FOLLOW_LIST_SIZE = 100;

function formatFollowCount(data?: { items: unknown[]; hasNext: boolean }) {
  if (!data) {
    return "-";
  }

  return `${data.items.length}${data.hasNext ? "+" : ""}`;
}

type UseFollowModalStateParams = {
  onClose: () => void;
  open: boolean;
};

export function useFollowModalState({
  onClose,
  open,
}: UseFollowModalStateParams) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [activeTab, setActiveTab] = useState<FollowTab>("following");
  const { data, isLoading, isError } = useSearchUsers({ query });
  const { data: followingData } = useFollowingList(
    { size: FOLLOW_LIST_SIZE },
    { enabled: open },
  );
  const { data: followersData } = useFollowersList(
    { size: FOLLOW_LIST_SIZE },
    { enabled: open },
  );

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
    tabCounts: {
      following: formatFollowCount(followingData),
      followers: formatFollowCount(followersData),
    } satisfies Partial<Record<FollowTab, string>>,
    updateQuery,
    users: data?.items ?? [],
  };
}
