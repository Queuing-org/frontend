import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getRepresentativeBadge } from "@/src/features/badge/model/badgeDisplay";
import { publicUserBadgesQueryOptions } from "@/src/features/badge/hooks/usePublicUserBadges";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import type { RoomOwner } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import RoomParticipantCard from "./RoomParticipantCard";
import {
  getParticipantIdentityKey,
  getParticipantKickTarget,
  getParticipantKickTargetKey,
  getParticipantUserSlug,
  isRoomOwner,
  isSameUser,
  type ParticipantKickTarget,
} from "../model/participantIdentity";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  currentUser: User | null;
  isKickPending: boolean;
  kickingParticipantKey: string | null;
  onKickParticipant: (target: ParticipantKickTarget) => void;
  owner: RoomOwner | null;
  participants: PlaylistParticipant[];
  showKickButton: boolean;
};

function getParticipantBadgeLookupSlug(participant: PlaylistParticipant) {
  if (
    participant.participantType &&
    participant.participantType !== "USER"
  ) {
    return null;
  }

  return getParticipantUserSlug(participant);
}

export default function RoomParticipantList({
  currentUser,
  isKickPending,
  kickingParticipantKey,
  onKickParticipant,
  owner,
  participants,
  showKickButton,
}: Props) {
  const participantBadgeSlugs = useMemo(() => {
    const seenSlugs = new Set<string>();
    const slugs: string[] = [];

    participants.forEach((participant) => {
      const slug = getParticipantBadgeLookupSlug(participant);
      if (!slug || seenSlugs.has(slug)) {
        return;
      }

      seenSlugs.add(slug);
      slugs.push(slug);
    });

    return slugs;
  }, [participants]);
  const participantBadgeQueries = useQueries({
    queries: participantBadgeSlugs.map(publicUserBadgesQueryOptions),
  });
  const representativeBadgeBySlug = new Map(
    participantBadgeSlugs.map((slug, index) => [
      slug,
      getRepresentativeBadge(participantBadgeQueries[index]?.data),
    ]),
  );

  return (
    <div className={styles.list}>
      {participants.map((participant) => {
        const isOwner = isRoomOwner(owner, participant);
        const kickTarget = getParticipantKickTarget(participant);
        const kickTargetKey = getParticipantKickTargetKey(kickTarget);
        const participantBadgeSlug =
          getParticipantBadgeLookupSlug(participant);
        const canKickParticipant =
          showKickButton &&
          Boolean(kickTarget) &&
          !isOwner &&
          !isSameUser(participant, currentUser);
        const isCurrentKickPending =
          isKickPending &&
          kickTargetKey != null &&
          kickingParticipantKey === kickTargetKey;

        return (
          <RoomParticipantCard
            key={getParticipantIdentityKey(participant)}
            canKick={canKickParticipant}
            isKickPending={isCurrentKickPending}
            isOwner={isOwner}
            onKick={() => {
              if (!kickTarget) {
                return;
              }

              onKickParticipant(kickTarget);
            }}
            participant={participant}
            representativeBadge={
              participantBadgeSlug
                ? representativeBadgeBySlug.get(participantBadgeSlug) ?? null
                : null
            }
          />
        );
      })}
    </div>
  );
}
