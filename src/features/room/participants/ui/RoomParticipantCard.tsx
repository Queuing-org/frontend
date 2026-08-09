import Image from "next/image";
import { MoreVertical } from "lucide-react";
import { useId, useRef, useState, type RefObject } from "react";
import type { BadgeSummary } from "@/src/features/badge/model/types";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import RoomMemberManagementMenu, {
  type RoomMemberManagementAction,
} from "@/src/features/room/management/ui/RoomMemberManagementMenu";
import type { ParticipantKickTarget } from "../model/participantIdentity";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  canManage: boolean;
  expanded: boolean;
  isKickPending: boolean;
  isOwner: boolean;
  isTransferPending: boolean;
  kickTarget: ParticipantKickTarget | null;
  listRef: RefObject<HTMLDivElement | null>;
  onBlockParticipant: (participant: PlaylistParticipant) => void;
  onClose: () => void;
  onKickParticipant: (target: ParticipantKickTarget) => void;
  onReportParticipant: (participant: PlaylistParticipant) => void;
  onToggle: (participantKey: string) => void;
  onTransferOwner: (participant: PlaylistParticipant) => void;
  participant: PlaylistParticipant;
  participantKey: string;
  representativeBadge?: BadgeSummary | null;
  userSlug: string | null;
};

export default function RoomParticipantCard({
  canManage,
  expanded,
  isKickPending,
  isOwner,
  isTransferPending,
  kickTarget,
  listRef,
  onBlockParticipant,
  onClose,
  onKickParticipant,
  onReportParticipant,
  onToggle,
  onTransferOwner,
  participant,
  participantKey,
  representativeBadge,
  userSlug,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actionsId = useId();
  const [menuPlacement, setMenuPlacement] = useState<"down" | "up">("down");
  const actions: RoomMemberManagementAction[] = userSlug
    ? ["follow", "report", "block", "kick", "transfer"]
    : ["kick"];

  const handleToggle = () => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    const listRect = listRef.current?.getBoundingClientRect();
    if (triggerRect) {
      const estimatedMenuHeight = actions.length * 40 + 2;
      const spaceBelow =
        (listRect?.bottom ?? window.innerHeight) - triggerRect.bottom;
      const spaceAbove = triggerRect.top - (listRect?.top ?? 0);
      setMenuPlacement(
        spaceBelow < estimatedMenuHeight && spaceAbove >= estimatedMenuHeight
          ? "up"
          : "down",
      );
    }
    onToggle(participantKey);
  };

  return (
    <div className={styles.participantItem} data-expanded={expanded || undefined}>
      <div className={styles.participant}>
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
      </div>
      {canManage ? (
        <div className={styles.participantManagement}>
          <button
            ref={triggerRef}
            type="button"
            className={styles.participantMenuButton}
            aria-label={`${participant.nickname} 참가자 관리 메뉴`}
            aria-haspopup="menu"
            aria-expanded={expanded}
            aria-controls={expanded ? actionsId : undefined}
            onClick={handleToggle}
          >
            <MoreVertical aria-hidden="true" size={18} />
          </button>
          {expanded ? (
            <RoomMemberManagementMenu
              actions={actions}
              isKickPending={isKickPending}
              isTransferPending={isTransferPending}
              label={`${participant.nickname} 참가자 관리`}
              menuId={actionsId}
              onBlock={() => onBlockParticipant(participant)}
              onClose={onClose}
              onKick={() => {
                if (kickTarget) {
                  onKickParticipant(kickTarget);
                }
              }}
              onReport={() => onReportParticipant(participant)}
              onTransfer={() => onTransferOwner(participant)}
              placement={menuPlacement}
              targetUserSlug={userSlug}
              triggerRef={triggerRef}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
