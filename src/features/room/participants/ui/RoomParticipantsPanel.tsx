import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import { useKickRoomParticipant } from "@/src/features/room/hooks/useKickRoomParticipant";
import type { RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import {
  getParticipantKickTargetKey,
  isRoomOwner,
} from "../model/participantIdentity";
import RoomParticipantList from "./RoomParticipantList";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  currentUser: User | null;
  participants: PlaylistParticipant[];
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
};

export default function RoomParticipantsPanel({
  currentUser,
  participants,
  roomMeta,
  roomPassword,
  roomSlug,
}: Props) {
  const kickParticipant = useKickRoomParticipant();
  const owner = roomMeta?.owner ?? null;
  const canKickParticipants = isRoomOwner(owner, currentUser);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>참가자</div>
        <div className={styles.count}>{participants.length}</div>
      </div>
      {participants.length ? (
        <RoomParticipantList
          currentUser={currentUser}
          isKickPending={kickParticipant.isPending}
          kickingParticipantKey={getParticipantKickTargetKey(
            kickParticipant.variables ?? null,
          )}
          onKickParticipant={(target) =>
            kickParticipant.mutate({
              ...target,
              password: roomPassword,
              slug: roomSlug,
            })
          }
          owner={owner}
          participants={participants}
          showKickButton={canKickParticipants}
        />
      ) : (
        <div className={styles.empty}>참가자가 없습니다.</div>
      )}
      {kickParticipant.isError ? (
        <div className={styles.error}>
          {kickParticipant.error.message || "참가자를 내보내지 못했습니다."}
        </div>
      ) : null}
    </div>
  );
}
