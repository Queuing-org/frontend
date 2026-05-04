import Image from "next/image";
import type { PlaylistParticipant } from "@/src/entities/playlist/model/types";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  canKick: boolean;
  isKickPending: boolean;
  isOwner: boolean;
  onKick: () => void;
  participant: PlaylistParticipant;
};

export default function RoomParticipantCard({
  canKick,
  isKickPending,
  isOwner,
  onKick,
  participant,
}: Props) {
  return (
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
              src="/icons/owner.svg"
              alt="방장"
              width={18}
              height={18}
              className={styles.ownerIcon}
            />
          ) : null}
        </div>
      </div>
      {canKick ? (
        <button
          type="button"
          className={styles.kickButton}
          disabled={isKickPending}
          onClick={onKick}
        >
          {isKickPending ? "내보내는 중" : "내보내기"}
        </button>
      ) : null}
    </div>
  );
}
