"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Draggable from "react-draggable";
import { getRepresentativeBadge } from "@/src/features/badge/model/badgeDisplay";
import { usePublicUserBadges } from "@/src/features/badge/hooks/usePublicUserBadges";
import BlockUserModal, {
  type BlockUserTarget,
} from "@/src/features/follow/blocked/ui/BlockUserModal";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import type { FollowUser } from "@/src/features/follow/model/types";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import { useUserProfile } from "@/src/features/user/profile/hooks/useUserProfile";
import UserProfileContent from "@/src/features/user/profile/ui/UserProfileContent";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import ManagementMenuShell from "@/src/shared/ui/management-menu/ManagementMenuShell";
import FloatingPanelShell from "@/src/shared/ui/floating-panel/FloatingPanelShell";
import {
  getDesktopViewportDensity,
  MOBILE_VIEWPORT_MAX_WIDTH,
} from "@/src/shared/lib/viewportDensity";
import styles from "./FollowProfileModal.module.css";

const PROFILE_PANEL_SIZE = {
  compact: { height: 304, width: 240 },
  normal: { height: 380, width: 300 },
} as const;
const PROFILE_PANEL_SAFE_MARGIN = {
  compact: 142.4,
  normal: 178,
} as const;
const MOBILE_PROFILE_PANEL_SAFE_MARGIN = 24;

function subscribeToViewport(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getViewportSnapshot() {
  return `${window.innerWidth}:${window.innerHeight}`;
}

function getServerViewportSnapshot() {
  return "0:0";
}

type Props = {
  onBlocked: (userSlug: string) => void;
  onClose: () => void;
  user: FollowUser;
};

export default function FollowProfileModal({ onBlocked, onClose, user }: Props) {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const managementMenuId = useId();
  const viewportSnapshot = useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    getServerViewportSnapshot,
  );
  const [viewportWidth, viewportHeight] = viewportSnapshot
    .split(":")
    .map(Number);
  const viewportDensity = getDesktopViewportDensity({
    height: viewportHeight,
    width: viewportWidth,
  });
  const panelSize = PROFILE_PANEL_SIZE[viewportDensity];
  const panelSafeMargin =
    viewportWidth <= MOBILE_VIEWPORT_MAX_WIDTH
      ? MOBILE_PROFILE_PANEL_SAFE_MARGIN
      : PROFILE_PANEL_SAFE_MARGIN[viewportDensity];
  const availablePanelHeight = Math.max(
    160,
    viewportHeight - panelSafeMargin,
  );
  const panelHeight = viewportHeight
    ? Math.min(panelSize.height, availablePanelHeight)
    : panelSize.height;
  const isHeightConstrained = panelHeight < panelSize.height;
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
  const representativeBadge =
    profile?.representativeBadge === undefined
      ? getRepresentativeBadge(publicBadgesQuery.data)
      : profile.representativeBadge;
  const closeManagementMenu = useCallback(() => {
    setIsManagementOpen(false);
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [user.slug]);

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
    <>
      <div
        className={styles.overlay}
        role="presentation"
        onClick={(event) => event.stopPropagation()}
      >
        <Draggable
          bounds="parent"
          handle="[data-drag-handle='true']"
          key={`${user.slug}:${viewportDensity}`}
          nodeRef={draggableRef}
        >
          <div ref={draggableRef} className={styles.draggableFrame}>
            <div
              ref={dialogRef}
              className={styles.dialog}
              data-height-constrained={isHeightConstrained || undefined}
              role="dialog"
              aria-label={`${displayNickname} 프로필 상세`}
              inert={blockTarget ? true : undefined}
              tabIndex={-1}
            >
              <FloatingPanelShell
                contentClassName={styles.profilePanelContent}
                height={panelHeight}
                width={panelSize.width}
              >
                <div className={styles.content}>
                  <UserProfileContent
                    activityLabel={null}
                    actions={
                      <div
                        className={styles.actionRow}
                        role="group"
                        aria-label="프로필 액션"
                      >
                        <div className={styles.followAction}>
                          <FollowToggleButton
                            className={styles.followButton}
                            disabled={profileQuery.isLoading || profileQuery.isError}
                            disabledLabel={
                              profileQuery.isLoading ? (
                                <LoadingSpinner
                                  ariaLabel="팔로우 관계 확인 중"
                                  size={16}
                                />
                              ) : (
                                "확인 실패"
                              )
                            }
                            initialRelationship={
                              profile?.relationship ?? "NONE"
                            }
                            followingLabel="팔로잉"
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
                            onClick={() =>
                              setIsManagementOpen((current) => !current)
                            }
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
                    avatarUrl={
                      profile?.profileImageUrl ?? user.profileImageUrl
                    }
                    badgeLabel={
                      representativeBadge?.name ?? "대표 칭호 없음"
                    }
                    isBadgeLoading={
                      profileQuery.isLoading ||
                      (shouldLoadBadgeFallback && publicBadgesQuery.isLoading)
                    }
                    listeningDurationSeconds={
                      profile?.listeningDurationSeconds
                    }
                    musicPower={
                      profile?.musicPower ?? musicPowerQuery.data?.musicPower
                    }
                    nickname={displayNickname}
                    online={profile?.online ?? user.online}
                    queuingCount={profile?.queuingCount}
                    statusMessage={profile?.statusMessage?.trim() ?? ""}
                    textLineClamp={2}
                  />
                </div>
              </FloatingPanelShell>
            </div>
          </div>
        </Draggable>
      </div>
      <BlockUserModal
        target={blockTarget}
        onBlocked={(target) => {
          onBlocked(target.slug);
          onClose();
        }}
        onClose={() => setBlockTarget(null)}
      />
    </>
  );
}
