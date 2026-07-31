"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { API_BASE_URL } from "@/src/shared/api/config";
import { badgeKeys } from "../../model/queryKeys";
import {
  enqueueUnseenBadgeAwards,
  parseBadgeAwardEvent,
  type BadgeAward,
} from "../model/badgeAwardEvents";
import BadgeAwardModal from "./BadgeAwardModal";

function getBadgeEventsUrl() {
  return `${API_BASE_URL.replace(/\/$/, "")}/api/v1/users/me/badges/events`;
}

export default function BadgeAwardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: me } = useMe();

  return (
    <>
      {children}
      {me ? <AuthenticatedBadgeAwardController key={me.slug} /> : null}
    </>
  );
}

function AuthenticatedBadgeAwardController() {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<BadgeAward[]>([]);
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    const eventSource = new EventSource(getBadgeEventsUrl(), {
      withCredentials: true,
    });
    const handleAward = (rawEvent: Event) => {
      const event = rawEvent as MessageEvent<string>;
      const data = parseBadgeAwardEvent(event.data);
      if (!data) {
        return;
      }

      const unseen = enqueueUnseenBadgeAwards({
        eventId: event.lastEventId,
        badges: data.badges,
        seen: seenRef.current,
      });
      if (unseen.length > 0) {
        setQueue((current) => [...current, ...unseen]);
      }

      void queryClient.invalidateQueries({ queryKey: badgeKeys.catalog() });
      void queryClient.invalidateQueries({ queryKey: badgeKeys.me() });
    };

    eventSource.addEventListener("badge-awarded", handleAward);

    return () => {
      eventSource.removeEventListener("badge-awarded", handleAward);
      eventSource.close();
    };
  }, [queryClient]);

  const closeCurrent = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  return <BadgeAwardModal badge={queue[0] ?? null} onClose={closeCurrent} />;
}
