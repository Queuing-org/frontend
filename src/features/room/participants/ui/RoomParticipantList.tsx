import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type UIEvent,
} from "react";
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

export const PARTICIPANT_CARD_DOM_LIMIT = 24;
const PARTICIPANT_VIRTUAL_ROW_HEIGHT_FALLBACK_PX = 68;
const PARTICIPANT_WINDOW_OVERSCAN = 4;

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

function useVisibleParticipantBadgeSlugs(
  listRef: RefObject<HTMLDivElement | null>,
  participantBadgeSlugs: readonly string[],
) {
  const [visibleBadgeSlugs, setVisibleBadgeSlugs] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list || participantBadgeSlugs.length === 0) {
      return;
    }

    const nodes = Array.from(
      list.querySelectorAll<HTMLElement>("[data-badge-user-slug]"),
    );

    if (typeof IntersectionObserver === "undefined") {
      const fallbackTimer = window.setTimeout(
        () => setVisibleBadgeSlugs(new Set(participantBadgeSlugs)),
        0,
      );
      return () => window.clearTimeout(fallbackTimer);
    }

    const visibleNodes = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!visibleNodes.has(entry.target)) {
              visibleNodes.add(entry.target);
              changed = true;
            }
          } else if (visibleNodes.delete(entry.target)) {
            changed = true;
          }
        });

        if (!changed) {
          return;
        }

        setVisibleBadgeSlugs(
          new Set(
            Array.from(visibleNodes).flatMap((node) => {
              const userSlug = (node as HTMLElement).dataset.badgeUserSlug;
              return userSlug ? [userSlug] : [];
            }),
          ),
        );
      },
      { root: list, rootMargin: "120px 0px" },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [listRef, participantBadgeSlugs]);

  return useMemo(
    () => participantBadgeSlugs.filter((slug) => visibleBadgeSlugs.has(slug)),
    [participantBadgeSlugs, visibleBadgeSlugs],
  );
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
  const [windowStart, setWindowStart] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const closeParticipantMenu = useCallback(() => {
    setExpandedParticipantKey(null);
  }, []);
  const toggleParticipantMenu = useCallback((participantKey: string) => {
    setExpandedParticipantKey((current) =>
      current === participantKey ? null : participantKey,
    );
  }, []);
  const maxWindowStart = Math.max(
    0,
    participants.length - PARTICIPANT_CARD_DOM_LIMIT,
  );
  const effectiveWindowStart = Math.min(windowStart, maxWindowStart);
  const handleListScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      setExpandedParticipantKey(null);
      const configuredRowHeight = Number.parseFloat(
        window
          .getComputedStyle(event.currentTarget)
          .getPropertyValue("--participant-row-height"),
      );
      const rowHeight =
        configuredRowHeight > 0
          ? configuredRowHeight
          : PARTICIPANT_VIRTUAL_ROW_HEIGHT_FALLBACK_PX;
      const nextWindowStart = Math.max(
        0,
        Math.floor(event.currentTarget.scrollTop / rowHeight) -
          PARTICIPANT_WINDOW_OVERSCAN,
      );
      setWindowStart(Math.min(nextWindowStart, maxWindowStart));
    },
    [maxWindowStart],
  );

  const visibleParticipants = useMemo(
    () =>
      participants.slice(
        effectiveWindowStart,
        effectiveWindowStart + PARTICIPANT_CARD_DOM_LIMIT,
      ),
    [effectiveWindowStart, participants],
  );
  const participantBadgeSlugs = useMemo(() => {
    const seenSlugs = new Set<string>();
    const slugs: string[] = [];

    visibleParticipants.forEach((participant) => {
      const slug = getParticipantBadgeLookupSlug(participant);
      if (!slug || seenSlugs.has(slug)) {
        return;
      }

      seenSlugs.add(slug);
      slugs.push(slug);
    });

    return slugs;
  }, [visibleParticipants]);
  const visibleParticipantBadgeSlugs = useVisibleParticipantBadgeSlugs(
    listRef,
    participantBadgeSlugs,
  );
  const participantBadgeQueries = useQueries({
    queries: visibleParticipantBadgeSlugs.map(publicUserBadgesQueryOptions),
  });
  const representativeBadgeBySlug = new Map(
    visibleParticipantBadgeSlugs.map((slug, index) => [
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
    <div
      ref={listRef}
      className={styles.list}
      aria-label="참가자 목록"
      onScroll={handleListScroll}
    >
      <div
        className={styles.virtualList}
        style={
          { "--participant-count": participants.length } as CSSProperties
        }
      >
        {visibleParticipants.map((participant, visibleIndex) => {
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
            <div
              key={participantKey}
              className={styles.virtualRow}
              data-participant-key={participantKey}
              data-expanded={expanded || undefined}
              style={
                {
                  "--participant-index": effectiveWindowStart + visibleIndex,
                } as CSSProperties
              }
            >
              <RoomParticipantCard
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
                badgeUserSlug={participantBadgeSlug}
                representativeBadge={
                  participantBadgeSlug
                    ? representativeBadgeBySlug.get(participantBadgeSlug) ?? null
                    : null
                }
                userSlug={memberUserSlug}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
