"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/features/room/api/joinRoom";
import { acquireSocketSession } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import { getAlreadyParticipatingRoom } from "./roomJoinErrors";
import {
  storeRoomJoinHandoff,
  type RoomJoinTarget,
} from "./roomJoinHandoff";

export type RoomJoinConflict = {
  currentRoom: { slug: string; title: string };
  target: RoomJoinTarget;
};

export type RoomJoinOutcome =
  | { status: "joined"; result: JoinRoomResult }
  | { status: "conflict" };

type UseRoomJoinTransitionParams = {
  handoffOnSuccess?: boolean;
  onJoined: (result: JoinRoomResult, target: RoomJoinTarget) => void;
};

export function useRoomJoinTransition({
  handoffOnSuccess = false,
  onJoined,
}: UseRoomJoinTransitionParams) {
  const router = useRouter();
  const { notify } = useActionFeedback();
  const [conflict, setConflict] = useState<RoomJoinConflict | null>(null);
  const [isPending, setIsPending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const releaseSocketSessionRef = useRef<(() => void) | null>(null);
  const activeRequestRef = useRef<Promise<RoomJoinOutcome> | null>(null);
  const onJoinedRef = useRef(onJoined);
  onJoinedRef.current = onJoined;

  const releaseSocketSession = useCallback(() => {
    releaseSocketSessionRef.current?.();
    releaseSocketSessionRef.current = null;
  }, []);

  const runJoin = useCallback(
    (
      rawTarget: RoomJoinTarget,
      options: { keepConflictOnError: boolean },
    ): Promise<RoomJoinOutcome> => {
      if (activeRequestRef.current) {
        return activeRequestRef.current;
      }

      const target: RoomJoinTarget = {
        slug: normalizeRoomSlug(rawTarget.slug),
        ...(Object.prototype.hasOwnProperty.call(rawTarget, "password")
          ? { password: rawTarget.password }
          : {}),
      };
      if (!target.slug) {
        return Promise.reject(new Error("방 slug가 비어 있습니다."));
      }

      releaseSocketSessionRef.current ??= acquireSocketSession();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsPending(true);

      const request = joinRoom(
        target.slug,
        target.password !== undefined
          ? { password: target.password }
          : {},
        { signal: abortController.signal },
      )
        .then((result): RoomJoinOutcome => {
          setConflict(null);
          const release = releaseSocketSessionRef.current;
          releaseSocketSessionRef.current = null;

          if (!release) {
            throw new Error("방 입장 소켓 세션을 찾을 수 없습니다.");
          }

          if (handoffOnSuccess) {
            storeRoomJoinHandoff({
              releaseSocketSession: release,
              result,
              target,
            });
          } else {
            release();
          }
          onJoinedRef.current(result, target);
          return { status: "joined", result };
        })
        .catch((error: unknown): RoomJoinOutcome => {
          const currentRoom = getAlreadyParticipatingRoom(error);
          if (currentRoom) {
            setConflict({ currentRoom, target });
            return { status: "conflict" };
          }

          if (!options.keepConflictOnError) {
            releaseSocketSession();
          }
          throw error;
        })
        .finally(() => {
          if (abortControllerRef.current === abortController) {
            abortControllerRef.current = null;
          }
          if (activeRequestRef.current === request) {
            activeRequestRef.current = null;
            setIsPending(false);
          }
        });

      activeRequestRef.current = request;
      return request;
    },
    [handoffOnSuccess, releaseSocketSession],
  );

  const requestJoin = useCallback(
    (target: RoomJoinTarget) =>
      runJoin(target, { keepConflictOnError: false }),
    [runJoin],
  );

  const confirmJoin = useCallback(async () => {
    if (!conflict || isPending) {
      return;
    }

    try {
      const outcome = await runJoin(conflict.target, {
        keepConflictOnError: true,
      });
      if (outcome.status === "conflict") {
        notify({
          dedupeKey: `room-join:${conflict.target.slug}:conflict`,
          message: "새 방에 참여하지 못했습니다.",
          tone: "error",
        });
      }
    } catch (error) {
      notify({
        dedupeKey: `room-join:${conflict.target.slug}:conflict`,
        message:
          error instanceof Error && error.message
            ? error.message
            : "새 방에 참여하지 못했습니다.",
        tone: "error",
      });
    }
  }, [conflict, isPending, notify, runJoin]);

  const returnToCurrentRoom = useCallback(() => {
    if (!conflict || isPending) {
      return;
    }

    const currentRoomSlug = conflict.currentRoom.slug;
    setConflict(null);
    releaseSocketSession();
    router.replace(`/room/${encodeURIComponent(currentRoomSlug)}`);
  }, [conflict, isPending, releaseSocketSession, router]);

  const cancelTransition = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeRequestRef.current = null;
    setConflict(null);
    setIsPending(false);
    releaseSocketSession();
  }, [releaseSocketSession]);

  useEffect(
    () => cancelTransition,
    [cancelTransition],
  );

  return {
    cancelTransition,
    conflict,
    confirmJoin,
    isPending,
    requestJoin,
    returnToCurrentRoom,
  };
}
