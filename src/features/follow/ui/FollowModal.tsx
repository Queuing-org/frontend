"use client";

import { useFollowModalState } from "@/src/features/follow/hooks/useFollowModalState";
import FollowTabPanel from "./components/FollowTabPanel";
import FollowTabs from "./components/FollowTabs";
import FollowUserSearch from "./components/FollowUserSearch";
import styles from "./FollowModal.module.css";

type FollowModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function FollowModal({ open, onClose }: FollowModalProps) {
  const modal = useFollowModalState({ onClose });

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
      >
        <header className={styles.header}>
          <h2 id="follow-modal-title" className={styles.title}>
            FOLLOW
          </h2>
          <FollowUserSearch
            isError={modal.isSearchError}
            isLoading={modal.isSearchLoading}
            query={modal.query}
            selectedUser={modal.selectedUser}
            users={modal.users}
            onQueryChange={modal.updateQuery}
            onSelectUser={modal.setSelectedUser}
          />
        </header>
        <div className={styles.content}>
          <FollowTabs
            activeTab={modal.activeTab}
            counts={modal.tabCounts}
            onChange={modal.setActiveTab}
          />
          <FollowTabPanel activeTab={modal.activeTab} />
        </div>
      </section>
    </div>
  );
}
