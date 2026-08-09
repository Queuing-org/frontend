import Image from "next/image";
import { useId, useRef } from "react";
import type { BadgeSummary } from "@/src/features/badge/model/types";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import RoomParticipantActionsMenu from "./RoomParticipantActionsMenu";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  canManage: boolean;
  expanded: boolean;
  isKickPending: boolean;
  isOwner: boolean;
  isTransferPending: boolean;
  onBlock: () => void;
  onClose: () => void;
  onKick: () => void;
  onReport: () => void;
  onToggle: () => void;
  onTransfer: () => void;
  participant: PlaylistParticipant;
  representativeBadge?: BadgeSummary | null;
  userSlug: string | null;
};

export default function RoomParticipantCard({
  canManage,
  expanded,
  isKickPending,
  isOwner,
  isTransferPending,
  onBlock,
  onClose,
  onKick,
  onReport,
  onToggle,
  onTransfer,
  participant,
  representativeBadge,
  userSlug,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actionsId = useId();
  const content = (
    <>
      <div className={styles.avatarWrap}>
        {participant.profileImageUrl ? (
          <Image
            src={participant.profileImageUrl}
            alt={`${participant.nickname} avatar`}
            fill
            sizes="40px"
            unoptimized
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarFallback} aria-hidden="true">
            {participant.nickname.slice(0, 1)}
          </div>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.nameRow}>
          <div className={styles.nickname}>{participant.nickname}</div>
          {isOwner ? (
            <Image
              src="/icons/onwer_black.svg"
              alt="방장"
              width={18}
              height={18}
              className={styles.ownerIcon}
            />
          ) : null}
        </div>
        {representativeBadge ? (
          <div className={styles.badgeLabel}>{representativeBadge.name}</div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className={styles.participantItem} data-expanded={expanded || undefined}>
      {canManage ? (
        <button
          ref={triggerRef}
          type="button"
          className={`${styles.participant} ${styles.participantTrigger}`}
          aria-controls={actionsId}
          aria-expanded={expanded}
          aria-label={`${participant.nickname} 참가자 관리 ${expanded ? "접기" : "펼치기"}`}
          onClick={onToggle}
        >
          {content}
        </button>
      ) : (
        <div className={styles.participant}>{content}</div>
      )}
      {canManage && expanded ? (
        <RoomParticipantActionsMenu
          isKickPending={isKickPending}
          isTransferPending={isTransferPending}
          menuId={actionsId}
          nickname={participant.nickname}
          onBlock={onBlock}
          onClose={onClose}
          onKick={onKick}
          onReport={onReport}
          onTransfer={onTransfer}
          triggerRef={triggerRef}
          userSlug={userSlug}
        />
      ) : null}
    </div>
  );
}
