"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { API_BASE_URL } from "@/src/shared/api/config";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import { useSetRepresentativeBadge } from "../../hooks/useSetRepresentativeBadge";
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
  const { notify } = useActionFeedback();
  const setRepresentativeBadge = useSetRepresentativeBadge();
  const applyError = setRepresentativeBadge.error;
  const isApplying = setRepresentativeBadge.isPending;
  const applyRepresentativeBadge = setRepresentativeBadge.mutate;
  const resetRepresentativeBadge = setRepresentativeBadge.reset;
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

      void queryClient.invalidateQueries({ queryKey: badgeKeys.me() });
    };

    eventSource.addEventListener("badge-awarded", handleAward);

    return () => {
      eventSource.removeEventListener("badge-awarded", handleAward);
      eventSource.close();
    };
  }, [queryClient]);

  const closeCurrent = useCallback(() => {
    if (isApplying) {
      return;
    }

    resetRepresentativeBadge();
    setQueue((current) => current.slice(1));
  }, [isApplying, resetRepresentativeBadge]);

  const applyCurrent = useCallback(() => {
    const badge = queue[0];
    if (!badge || isApplying) {
      return;
    }

    applyRepresentativeBadge(
      { badgeCode: badge.badgeCode },
      {
        onSuccess: () => {
          notify({
            dedupeKey: "profile:representative-badge",
            message: `대표 칭호를 적용했습니다: '${badge.name}'`,
            tone: "default",
          });
          setQueue((current) => current.slice(1));
        },
        onError: (error) => {
          notify({
            dedupeKey: "profile:representative-badge",
            message: error.message || "대표 칭호를 설정하지 못했습니다.",
            tone: "error",
          });
        },
      },
    );
  }, [applyRepresentativeBadge, isApplying, notify, queue]);

  return (
    <BadgeAwardModal
      applyErrorMessage={
        applyError
          ? applyError.message || "대표 칭호를 설정하지 못했습니다."
          : null
      }
      badge={queue[0] ?? null}
      isApplying={isApplying}
      onApply={applyCurrent}
      onClose={closeCurrent}
    />
  );
}
