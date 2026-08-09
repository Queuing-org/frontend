import { useCallback, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { getRepresentativeBadge } from "@/src/features/badge/model/badgeDisplay";
import { publicUserBadgesQueryOptions } from "@/src/features/badge/hooks/usePublicUserBadges";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import type { RoomMemberManagementAction } from "@/src/features/room/management/ui/RoomMemberManagementMenu";
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
  canModerateParticipants: boolean;
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
  canModerateParticipants,
  transferringUserSlug,
}: Props) {
  const [expandedParticipantKey, setExpandedParticipantKey] = useState<
    string | null
  >(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closeParticipantMenu = useCallback(() => {
    setExpandedParticipantKey(null);
  }, []);
  const toggleParticipantMenu = useCallback((participantKey: string) => {
    setExpandedParticipantKey((current) =>
      current === participantKey ? null : participantKey,
    );
  }, []);
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
    <div ref={listRef} className={styles.list} aria-label="참가자 목록">
      {participants.map((participant) => {
        const participantKey = getParticipantIdentityKey(participant);
        const isOwner = isParticipantRoomOwner(owner, participant);
        const kickTarget = getParticipantKickTarget(participant);
        const kickTargetKey = getParticipantKickTargetKey(kickTarget);
        const participantBadgeSlug =
          getParticipantBadgeLookupSlug(participant);
        const isCurrentUser = isSameUser(participant, currentUser);
        const userSlug = getParticipantUserSlug(participant);
        const memberUserSlug =
          participant.participantType === "USER" ? userSlug : null;
        const canUseSocialActions = Boolean(
          currentUser && memberUserSlug && !isCurrentUser,
        );
        const canUseRoomActions =
          canModerateParticipants &&
          Boolean(kickTarget) &&
          !isOwner &&
          !isCurrentUser;
        const actions: RoomMemberManagementAction[] = [
          ...(canUseSocialActions
            ? (["follow", "report", "block"] as const)
            : []),
          ...(canUseRoomActions ? (["kick"] as const) : []),
          ...(canUseRoomActions && memberUserSlug
            ? (["transfer"] as const)
            : []),
        ];
        const hasActions = actions.length > 0;
        const isCurrentKickPending =
          isKickPending &&
          kickTargetKey != null &&
          kickingParticipantKey === kickTargetKey;
        const isCurrentTransferPending =
          isTransferPending &&
          memberUserSlug != null &&
          memberUserSlug === transferringUserSlug;
        const expanded =
          hasActions &&
          activeExpandedParticipantKey === participantKey;

        return (
          <RoomParticipantCard
            key={participantKey}
            actions={actions}
            expanded={expanded}
            isKickPending={isCurrentKickPending}
            isOwner={isOwner}
            isTransferPending={isCurrentTransferPending}
            kickTarget={kickTarget}
            listRef={listRef}
            onBlockParticipant={onBlockParticipant}
            onClose={closeParticipantMenu}
            onKickParticipant={onKickParticipant}
            onReportParticipant={onReportParticipant}
            onToggle={toggleParticipantMenu}
            onTransferOwner={onTransferOwner}
            participant={participant}
            participantKey={participantKey}
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
