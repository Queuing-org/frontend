"use client";

import { useState } from "react";
import { useFollowTabCounts } from "./useFollowTabCounts";

export type FollowTab = "following" | "followers" | "blocked";

type UseFollowModalStateParams = {
  onClose: () => void;
  open: boolean;
};

export function useFollowModalState({ onClose, open }: UseFollowModalStateParams) {
  const [activeTab, setActiveTab] = useState<FollowTab>("following");
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const tabCounts = useFollowTabCounts(open);

  const closeModal = () => {
    setActiveTab("following");
    setIsAddFriendOpen(false);
    onClose();
  };

  return {
    activeTab,
    closeAddFriend: () => setIsAddFriendOpen(false),
    closeModal,
    isAddFriendOpen,
    openAddFriend: () => setIsAddFriendOpen(true),
    setActiveTab,
    tabCounts,
  };
}
