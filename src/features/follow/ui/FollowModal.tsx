"use client";

import Image from "next/image";
import { type CSSProperties, type ReactNode, useState } from "react";
import BlockedUsersPanel from "@/src/features/follow/blocked/ui/BlockedUsersPanel";
import FollowersPanel from "@/src/features/follow/followers/ui/FollowersPanel";
import FollowingPanel from "@/src/features/follow/following/ui/FollowingPanel";
import FollowRequestButton from "@/src/features/follow/requests/ui/FollowRequestButton";
import { useSearchUsers } from "@/src/features/user/search/hooks/useSearchUsers";
import type { SearchUser } from "@/src/features/user/search/model/types";
import styles from "./FollowModal.module.css";

type FollowModalProps = {
  open: boolean;
  onClose: () => void;
};

type FollowTab = "following" | "followers" | "blocked";

// TODO: 현재는 친구목록/친구요청 API를 임시 매핑 중.
// 추후 실제 팔로잉/팔로워 API가 생기면 라벨과 패널 연결을 팔로우 도메인 기준으로 교체해야 함.
const followTabs: Array<{ key: FollowTab; label: string; iconSrc: string }> = [
  { key: "following", label: "친구목록", iconSrc: "/icons/follwer.svg" },
  { key: "followers", label: "받은 친구요청", iconSrc: "/icons/follwer.svg" },
  { key: "blocked", label: "차단", iconSrc: "/icons/block.svg" },
];

export default function FollowModal({ open, onClose }: FollowModalProps) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [activeTab, setActiveTab] = useState<FollowTab>("following");
  const { data, isLoading, isError } = useSearchUsers({ query });
  const users = data?.items ?? [];
  const hasSearchQuery = query.trim().length > 0;
  const tabPanels: Record<FollowTab, ReactNode> = {
    following: <FollowingPanel />,
    followers: <FollowersPanel />,
    blocked: <BlockedUsersPanel />,
  };

  function closeModal() {
    setQuery("");
    setSelectedUser(null);
    setActiveTab("following");
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={closeModal} role="presentation">
      <section
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-modal-title"
      >
        <header className={styles.header}>
          <h2 id="follow-modal-title" className={styles.title}>
            FRIEND
          </h2>
          <form
            className={styles.searchForm}
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              className={styles.searchInput}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedUser(null);
              }}
              placeholder="유저 검색"
              aria-label="유저 검색"
              autoComplete="off"
            />
            {hasSearchQuery ? (
              <div className={styles.searchDropdown}>
                {isLoading ? (
                  <div className={styles.stateText}>검색중...</div>
                ) : null}
                {isError ? (
                  <div className={styles.stateText}>검색 실패</div>
                ) : null}
                {!isLoading && !isError && users.length === 0 ? (
                  <div className={styles.stateText}>검색 결과 없음</div>
                ) : null}
                {users.length > 0 ? (
                  <ul className={styles.userList}>
                    {users.map((user) => {
                      const isSelected = selectedUser?.slug === user.slug;
                      const profileImageSrc =
                        user.profileImageUrl || "/Basic_Profile.png";

                      return (
                        <li key={user.slug} className={styles.userItem}>
                          <button
                            type="button"
                            className={styles.userButton}
                            data-selected={isSelected}
                            onClick={() => setSelectedUser(user)}
                            aria-pressed={isSelected}
                          >
                            <span className={styles.avatarWrap}>
                              <Image
                                src={profileImageSrc}
                                alt=""
                                fill
                                sizes="36px"
                                unoptimized={Boolean(user.profileImageUrl)}
                                className={styles.avatar}
                              />
                            </span>
                            <span className={styles.userMeta}>
                              <span className={styles.nickname}>
                                {user.nickname}
                              </span>
                              <span className={styles.slug}>{user.slug}</span>
                            </span>
                            <span className={styles.relationship}>
                              {user.relationship}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </form>
          <div className={styles.addAction}>
            {selectedUser ? (
              <FollowRequestButton targetSlug={selectedUser.slug} />
            ) : (
              <button type="button" className={styles.addButton} disabled>
                친구추가
              </button>
            )}
          </div>
        </header>
        <div className={styles.content}>
          <aside className={styles.sidebar} aria-label="팔로우 탭">
            {followTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={styles.tabButton}
                data-active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                <span
                  className={styles.tabIcon}
                  style={
                    {
                      "--tab-icon-src": `url(${tab.iconSrc})`,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            ))}
          </aside>
          <div className={styles.tabPanel}>{tabPanels[activeTab]}</div>
        </div>
      </section>
    </div>
  );
}
