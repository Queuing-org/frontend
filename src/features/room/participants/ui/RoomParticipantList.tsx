import { useMemo, useState } from "react";
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
  isParticipantRoomOwner,
  isSameUser,
  type ParticipantKickTarget,
} from "../model/participantIdentity";
import styles from "./RoomParticipantsPanel.module.css";

type Props = {
  currentUser: User | null;
  isKickPending: boolean;
  isTransferPending: boolean;
  kickingParticipantKey: string | null;
  onBlockParticipant: (participant: PlaylistParticipant) => void;
  onKickParticipant: (target: ParticipantKickTarget) => void;
  onReportParticipant: (participant: PlaylistParticipant) => void;
  onTransferOwner: (participant: PlaylistParticipant) => void;
  owner: RoomOwner | null;
  participants: PlaylistParticipant[];
  showParticipantActions: boolean;
  transferringUserSlug: string | null;
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
  isTransferPending,
  kickingParticipantKey,
  onBlockParticipant,
  onKickParticipant,
  onReportParticipant,
  onTransferOwner,
  owner,
  participants,
  showParticipantActions,
  transferringUserSlug,
}: Props) {
  const [expandedParticipantKey, setExpandedParticipantKey] = useState<
    string | null
  >(null);
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

  const activeExpandedParticipantKey = participants.some(
    (participant) =>
      getParticipantIdentityKey(participant) === expandedParticipantKey,
  )
    ? expandedParticipantKey
    : null;

  return (
    <div className={styles.list}>
      {participants.map((participant) => {
        const participantKey = getParticipantIdentityKey(participant);
        const isOwner = isParticipantRoomOwner(owner, participant);
        const kickTarget = getParticipantKickTarget(participant);
        const kickTargetKey = getParticipantKickTargetKey(kickTarget);
        const participantBadgeSlug =
          getParticipantBadgeLookupSlug(participant);
        const canManageParticipant =
          showParticipantActions &&
          Boolean(kickTarget) &&
          !isOwner &&
          !isSameUser(participant, currentUser);
        const isCurrentKickPending =
          isKickPending &&
          kickTargetKey != null &&
          kickingParticipantKey === kickTargetKey;
        const userSlug = getParticipantUserSlug(participant);
        const memberUserSlug =
          participant.participantType === "USER" ? userSlug : null;
        const isCurrentTransferPending =
          isTransferPending &&
          memberUserSlug != null &&
          memberUserSlug === transferringUserSlug;
        const expanded =
          canManageParticipant &&
          activeExpandedParticipantKey === participantKey;

        return (
          <RoomParticipantCard
            key={participantKey}
            canManage={canManageParticipant}
            expanded={expanded}
            isKickPending={isCurrentKickPending}
            isOwner={isOwner}
            isTransferPending={isCurrentTransferPending}
            onBlock={() => onBlockParticipant(participant)}
            onClose={() => setExpandedParticipantKey(null)}
            onKick={() => {
              if (!kickTarget) {
                return;
              }

              onKickParticipant(kickTarget);
            }}
            onReport={() => onReportParticipant(participant)}
            onToggle={() =>
              setExpandedParticipantKey((current) =>
                current === participantKey ? null : participantKey,
              )
            }
            onTransfer={() => onTransferOwner(participant)}
            participant={participant}
            representativeBadge={
              participantBadgeSlug
                ? representativeBadgeBySlug.get(participantBadgeSlug) ?? null
                : null
            }
            userSlug={memberUserSlug}
          />
        );
      })}
    </div>
  );
}
