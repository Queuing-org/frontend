"use client";

import { useCallback, useRef, useState } from "react";
import { useFollowModalState } from "@/src/features/follow/hooks/useFollowModalState";
import AddFriendModal from "./add-friend/AddFriendModal";
import FollowTabPanel from "./components/FollowTabPanel";
import FollowTabs from "./components/FollowTabs";
import styles from "./FollowModal.module.css";
import type { FollowUser } from "../model/types";
import FollowProfileModal from "./FollowProfileModal";

type FollowModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function FollowModal({ open, onClose }: FollowModalProps) {
  const modal = useFollowModalState({ onClose, open });
  const addFriendButtonRef = useRef<HTMLButtonElement>(null);
  const selectedUserTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [selectedUser, setSelectedUser] = useState<FollowUser | null>(null);

  const closeAddFriend = () => {
    modal.closeAddFriend();
    requestAnimationFrame(() => addFriendButtonRef.current?.focus());
  };
  const selectUser = useCallback(
    (user: FollowUser, trigger: HTMLButtonElement) => {
      selectedUserTriggerRef.current = trigger;
      setSelectedUser(user);
    },
    [],
  );
  const closeSelectedUser = useCallback(() => {
    setSelectedUser(null);
    requestAnimationFrame(() => selectedUserTriggerRef.current?.focus());
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={modal.closeModal} role="presentation">
      <section
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-modal-title"
        inert={modal.isAddFriendOpen || selectedUser ? true : undefined}
      >
        <header className={styles.header}>
          <h2 id="follow-modal-title" className={styles.title}>
            FRIEND
          </h2>
          <button
            type="button"
            ref={addFriendButtonRef}
            className={styles.openAddFriendButton}
            aria-label="친구 추가"
            onClick={modal.openAddFriend}
          >
            <span className={styles.addFriendIcon} aria-hidden="true" />
            <span>친구 추가</span>
          </button>
        </header>
        <div className={styles.content}>
          <FollowTabs
            activeTab={modal.activeTab}
            counts={modal.tabCounts}
            onChange={modal.setActiveTab}
          />
          <FollowTabPanel
            activeTab={modal.activeTab}
            onSelectUser={selectUser}
          />
        </div>
      </section>
      {modal.isAddFriendOpen ? (
        <AddFriendModal onClose={closeAddFriend} />
      ) : null}
      {selectedUser ? (
        <FollowProfileModal
          user={selectedUser}
          onBlocked={() => setSelectedUser(null)}
          onClose={closeSelectedUser}
        />
      ) : null}
    </div>
  );
}
