import type { PlaylistParticipant } from "@/src/entities/playlist/model/types";
import type { RoomOwner } from "@/src/entities/room/model/types";
import type { User } from "@/src/entities/user/model/types";
import RoomParticipantCard from "./RoomParticipantCard";
import { isRoomOwner, isSameUser } from "../model/participantIdentity";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  currentUser: User | null;
  isKickPending: boolean;
  kickingUserId: number | null;
  onKickParticipant: (userId: number) => void;
  owner: RoomOwner | null;
  participants: PlaylistParticipant[];
  showKickButton: boolean;
};

export default function RoomParticipantList({
  currentUser,
  isKickPending,
  kickingUserId,
  onKickParticipant,
  owner,
  participants,
  showKickButton,
}: Props) {
  return (
    <div className={styles.list}>
      {participants.map((participant) => {
        const isOwner = isRoomOwner(owner, participant);
        const hasKickableUserId = typeof participant.userId === "number";
        const canKickParticipant =
          showKickButton &&
          hasKickableUserId &&
          !isOwner &&
          !isSameUser(participant, currentUser);
        const isCurrentKickPending =
          hasKickableUserId &&
          isKickPending &&
          kickingUserId === participant.userId;

        return (
          <RoomParticipantCard
            key={participant.slug || participant.userId || participant.nickname}
            canKick={canKickParticipant}
            isKickPending={isCurrentKickPending}
            isOwner={isOwner}
            onKick={() => {
              if (typeof participant.userId !== "number") {
                return;
              }

              onKickParticipant(participant.userId);
            }}
            participant={participant}
          />
        );
      })}
    </div>
  );
}
