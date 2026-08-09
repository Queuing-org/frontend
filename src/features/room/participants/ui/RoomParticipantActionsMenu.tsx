"use client";

import { useEffect, useRef, type RefObject } from "react";
import FollowToggleButton from "@/src/features/follow/follow/ui/FollowToggleButton";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  isKickPending: boolean;
  isTransferPending: boolean;
  menuId: string;
  nickname: string;
  onBlock: () => void;
  onClose: () => void;
  onKick: () => void;
  onReport: () => void;
  onTransfer: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  userSlug: string | null;
};

export default function RoomParticipantActionsMenu({
  isKickPending,
  isTransferPending,
  menuId,
  nickname,
  onBlock,
  onClose,
  onKick,
  onReport,
  onTransfer,
  triggerRef,
  userSlug,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: isFollowing, isLoading: isRelationshipLoading } =
    useFollowingRelationship(userSlug);

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      onClose();
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, triggerRef]);

  const runAndClose = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      id={menuId}
      className={styles.participantActions}
      role="group"
      aria-label={`${nickname} 참가자 관리`}
    >
      {userSlug ? (
        <div className={styles.participantFollowAction} onClick={onClose}>
          <FollowToggleButton
            className={styles.participantActionButton}
            disabled={isRelationshipLoading}
            disabledLabel={
              isRelationshipLoading ? (
                <LoadingSpinner ariaLabel="팔로우 관계 확인 중" size={16} />
              ) : (
                "팔로우"
              )
            }
            initialRelationship={isFollowing ? "FOLLOWING" : "NONE"}
            targetSlug={userSlug}
          />
        </div>
      ) : null}
      {userSlug ? (
        <>
          <button
            type="button"
            className={`${styles.participantActionButton} ${styles.reportAction}`}
            onClick={() => runAndClose(onReport)}
          >
            신고
          </button>
          <button
            type="button"
            className={styles.participantActionButton}
            onClick={() => runAndClose(onBlock)}
          >
            차단
          </button>
        </>
      ) : null}
      <button
        type="button"
        className={styles.participantActionButton}
        disabled={isKickPending}
        onClick={() => runAndClose(onKick)}
      >
        {isKickPending ? (
          <LoadingSpinner ariaLabel="참가자 내보내는 중" size={16} />
        ) : (
          "내보내기"
        )}
      </button>
      {userSlug ? (
        <button
          type="button"
          className={styles.participantActionButton}
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
    </div>
  );
}
