"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getRepresentativeBadge } from "@/src/features/badge/model/badgeDisplay";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import type { FollowUser } from "@/src/features/follow/model/types";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import UserProfileContent from "@/src/features/user/profile/ui/UserProfileContent";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import ManagementMenuShell from "@/src/shared/ui/management-menu/ManagementMenuShell";
import styles from "./FollowProfileModal.module.css";

type Props = {
  onBlocked: (userSlug: string) => void;
  onClose: () => void;
  user: FollowUser;
};

export default function FollowProfileModal({ onBlocked, onClose, user }: Props) {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const managementMenuId = useId();
  const titleId = useId();
  const profileQuery = useUserProfile(user.slug);
  const profile = profileQuery.data;
  const shouldLoadMusicPowerFallback =
    profileQuery.isError ||
    (Boolean(profile) && typeof profile?.musicPower !== "number");
  const musicPowerQuery = useMusicPower(
    shouldLoadMusicPowerFallback ? user.slug : null,
  );
  const shouldLoadBadgeFallback =
    profileQuery.isError ||
    (Boolean(profile) && profile?.representativeBadge === undefined);
  const publicBadgesQuery = usePublicUserBadges(
    shouldLoadBadgeFallback ? user.slug : null,
  );
  const relationship = useFollowingRelationship(user.slug);
  const representativeBadge =
    profile?.representativeBadge === undefined
      ? getRepresentativeBadge(publicBadgesQuery.data)
      : profile.representativeBadge;
  const closeManagementMenu = useCallback(() => {
    setIsManagementOpen(false);
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || blockTarget || isManagementOpen) {
        return;
      }
      event.preventDefault();
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [blockTarget, isManagementOpen, onClose]);

  const displayNickname = profile?.nickname ?? user.nickname;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={blockTarget ? true : undefined}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            PROFILE
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            aria-label="프로필 상세 닫기"
            onClick={onClose}
          >
            <Image src="/icons/exit.svg" alt="" width={14} height={12} />
          </button>
        </header>
        <div className={styles.content}>
          <UserProfileContent
            actions={
              <div
                className={styles.actionRow}
                role="group"
                aria-label="프로필 액션"
              >
                <div className={styles.followAction}>
                  <FollowToggleButton
                    className={styles.followButton}
                    disabled={relationship.isLoading || relationship.isError}
                    disabledLabel={
                      relationship.isLoading ? (
                        <LoadingSpinner
                          ariaLabel="팔로우 관계 확인 중"
                          size={16}
                        />
                      ) : (
                        "확인 실패"
                      )
                    }
                    initialRelationship={
                      relationship.data ? "FOLLOWING" : "NONE"
                    }
                    targetSlug={user.slug}
                  />
                </div>
                <div className={styles.manageAction}>
                  <button
                    ref={manageButtonRef}
                    type="button"
                    className={styles.manageButton}
                    aria-haspopup="menu"
                    aria-expanded={isManagementOpen}
                    aria-controls={
                      isManagementOpen ? managementMenuId : undefined
                    }
                    onClick={() => setIsManagementOpen((current) => !current)}
                  >
                    <span>관리</span>
                    <Image
                      src="/icons/manage-down.svg"
                      alt=""
                      aria-hidden="true"
                      width={8}
                      height={8}
                    />
                  </button>
                  {isManagementOpen ? (
                    <ManagementMenuShell
                      label="친구 프로필 관리"
                      menuId={managementMenuId}
                      onClose={closeManagementMenu}
                      triggerRef={manageButtonRef}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsManagementOpen(false);
                          setBlockTarget({
                            nickname: displayNickname,
                            slug: user.slug,
                          });
                        }}
                      >
                        차단
                      </button>
                    </ManagementMenuShell>
                  ) : null}
                </div>
              </div>
            }
            avatarUrl={profile?.profileImageUrl ?? user.profileImageUrl}
            badgeLabel={representativeBadge?.name ?? "대표 칭호 없음"}
            isBadgeLoading={
              profileQuery.isLoading ||
              (shouldLoadBadgeFallback && publicBadgesQuery.isLoading)
            }
            listeningDurationSeconds={profile?.listeningDurationSeconds}
            musicPower={profile?.musicPower ?? musicPowerQuery.data?.musicPower}
            nickname={displayNickname}
            queuingCount={profile?.queuingCount}
            statusMessage={profile?.statusMessage?.trim() ?? ""}
          />
        </div>
      </section>
      <BlockUserModal
        target={blockTarget}
        onBlocked={(target) => {
          onBlocked(target.slug);
          onClose();
        }}
        onClose={() => setBlockTarget(null)}
      />
    </div>
  );
}
