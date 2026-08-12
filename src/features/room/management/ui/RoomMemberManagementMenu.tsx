"use client";

import type { RefObject } from "react";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import ManagementMenuShell from "@/src/shared/ui/management-menu/ManagementMenuShell";
import styles from "./RoomMemberManagementMenu.module.css";

type Props = {
  actions: readonly RoomMemberManagementAction[];
  isKickPending: boolean;
  isTransferPending: boolean;
  label: string;
  menuId: string;
  onBlock: () => void;
  onClose: () => void;
  onKick: () => void;
  onReport: () => void;
  onTransfer: () => void;
  placement?: "down" | "up";
  positioning?: "inline" | "viewport";
  anchorBoundaryRef?: RefObject<HTMLElement | null>;
  targetUserSlug: string | null;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export type RoomMemberManagementAction =
  | "follow"
  | "report"
  | "block"
  | "kick"
  | "transfer";

export default function RoomMemberManagementMenu({
  actions,
  isKickPending,
  isTransferPending,
  label,
  menuId,
  onBlock,
  onClose,
  onKick,
  onReport,
  onTransfer,
  placement = "down",
  positioning = "inline",
  anchorBoundaryRef,
  targetUserSlug,
  triggerRef,
}: Props) {
  const canFollow = actions.includes("follow") && Boolean(targetUserSlug);
  const { data: isFollowing, isLoading: isRelationshipLoading } =
    useFollowingRelationship(canFollow ? targetUserSlug : null);

  const runAndClose = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <ManagementMenuShell
      label={label}
      menuId={menuId}
      onClose={onClose}
      placement={placement}
      positioning={positioning}
      anchorBoundaryRef={anchorBoundaryRef}
      triggerRef={triggerRef}
    >
      {canFollow ? (
        <div className={styles.followAction}>
          <FollowToggleButton
            className={styles.menuItem}
            disabled={isRelationshipLoading}
            disabledLabel={
              isRelationshipLoading ? (
                <LoadingSpinner ariaLabel="팔로우 관계 확인 중" size={16} />
              ) : (
                "팔로우"
              )
            }
            initialRelationship={isFollowing ? "FOLLOWING" : "NONE"}
            onSuccess={onClose}
            role="menuitem"
            targetSlug={targetUserSlug}
          />
        </div>
      ) : null}
      {actions.includes("report") ? (
        <button
          type="button"
          className={`${styles.menuItem} ${styles.reportItem}`}
          role="menuitem"
          onClick={() => runAndClose(onReport)}
        >
          신고
        </button>
      ) : null}
      {actions.includes("block") ? (
        <button
          type="button"
          className={styles.menuItem}
          role="menuitem"
          onClick={() => runAndClose(onBlock)}
        >
          차단
        </button>
      ) : null}
      {actions.includes("kick") ? (
        <button
          type="button"
          className={styles.menuItem}
          role="menuitem"
          disabled={isKickPending}
          onClick={() => runAndClose(onKick)}
        >
          {isKickPending ? (
            <LoadingSpinner ariaLabel="참가자 내보내는 중" size={16} />
          ) : (
            "내보내기"
          )}
        </button>
      ) : null}
      {actions.includes("transfer") ? (
        <button
          type="button"
          className={styles.menuItem}
          role="menuitem"
          disabled={isTransferPending}
          onClick={() => runAndClose(onTransfer)}
        >
          {isTransferPending ? (
            <LoadingSpinner ariaLabel="방장 위임 중" size={16} />
          ) : (
            "방장 위임"
          )}
        </button>
      ) : null}
    </ManagementMenuShell>
  );
}
