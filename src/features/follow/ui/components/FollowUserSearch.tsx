"use client";

import Image from "next/image";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import type { SearchUser } from "@/src/features/user/search/model/types";
import styles from "../FollowModal.module.css";

type FollowUserSearchProps = {
  isError: boolean;
  isLoading: boolean;
  query: string;
  selectedUser: SearchUser | null;
  users: SearchUser[];
  onQueryChange: (value: string) => void;
  onSelectUser: (user: SearchUser) => void;
};

function getRelationshipLabel(relationship: SearchUser["relationship"]) {
  switch (relationship) {
    case "ME":
      return "나";
    case "FRIEND":
      return "맞팔로우";
    case "FOLLOWING":
      return "팔로잉";
    case "FOLLOWER":
      return "팔로워";
    case "NONE":
    default:
      return "미팔로우";
  }
}

export default function FollowUserSearch({
  isError,
  isLoading,
  query,
  selectedUser,
  users,
  onQueryChange,
  onSelectUser,
}: FollowUserSearchProps) {
  const hasSearchQuery = query.trim().length > 0;

  return (
    <>
      <form
        className={styles.searchForm}
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          className={styles.searchInput}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="유저 검색"
          aria-label="유저 검색"
          autoComplete="off"
        />
        {hasSearchQuery ? (
          <div className={styles.searchDropdown}>
            {isLoading ? (
              <div className={styles.stateText}>검색중...</div>
            ) : null}
            {isError ? <div className={styles.stateText}>검색 실패</div> : null}
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
                        onClick={() => onSelectUser(user)}
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
                          {getRelationshipLabel(user.relationship)}
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
          <FollowToggleButton
            disabled={selectedUser.relationship === "ME"}
            disabledLabel="나"
            initialRelationship={selectedUser.relationship}
            targetSlug={selectedUser.slug}
          />
        ) : (
          <button type="button" className={styles.addButton} disabled>
            팔로우
          </button>
        )}
      </div>
    </>
  );
}
