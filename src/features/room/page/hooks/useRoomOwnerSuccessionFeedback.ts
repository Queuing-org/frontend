"use client";

import { useEffect, useRef } from "react";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

type OwnershipSnapshot = {
  ownerSlug: string | null;
  pendingOwnerSlug: string | null;
  roomSlug: string;
};

type UseRoomOwnerSuccessionFeedbackParams = {
  currentUserSlug?: string | null;
  isCurrentUserLoading: boolean;
  ownerSlug?: string | null;
  roomSlug: string;
  roomTitle: string;
};

export function useRoomOwnerSuccessionFeedback({
  currentUserSlug,
  isCurrentUserLoading,
  ownerSlug,
  roomSlug,
  roomTitle,
}: UseRoomOwnerSuccessionFeedbackParams) {
  const { notify } = useActionFeedback();
  const previousOwnershipRef = useRef<OwnershipSnapshot | null>(null);
  const normalizedCurrentUserSlug = currentUserSlug?.trim() || null;
  const normalizedOwnerSlug = ownerSlug?.trim() || null;

  useEffect(() => {
    const previous = previousOwnershipRef.current;
    const current = {
      ownerSlug: normalizedOwnerSlug,
      pendingOwnerSlug: null,
      roomSlug,
    };

    if (!previous || previous.roomSlug !== roomSlug) {
      previousOwnershipRef.current = current;
      return;
    }

    const ownerChanged = previous.ownerSlug !== normalizedOwnerSlug;
    const transferredOwnerSlug = ownerChanged
      ? normalizedOwnerSlug
      : previous.pendingOwnerSlug;
    const didBecomeOwner = Boolean(
      transferredOwnerSlug &&
        normalizedCurrentUserSlug === transferredOwnerSlug,
    );

    if (didBecomeOwner) {
      notify({
        dedupeKey: `room-owner-received:${roomSlug}`,
        message: `'${roomTitle}' 방의 방장 권한을 이어받았습니다!`,
        tone: "default",
      });
    }

    previousOwnershipRef.current = {
      ...current,
      pendingOwnerSlug:
        !didBecomeOwner && isCurrentUserLoading && transferredOwnerSlug
          ? transferredOwnerSlug
          : null,
    };
  }, [
    isCurrentUserLoading,
    normalizedCurrentUserSlug,
    normalizedOwnerSlug,
    notify,
    roomSlug,
    roomTitle,
  ]);
}
