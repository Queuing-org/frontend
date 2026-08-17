import type {
  JoinRoomResult,
} from "@/src/features/room/api/joinRoom";

export type RoomJoinTarget =
  | { slug: string; password?: string | null; accessToken?: never }
  | { slug: string; accessToken: string; password?: never };

export type RoomJoinHandoff = {
  releaseSocketSession: () => void;
  result: JoinRoomResult;
  target: RoomJoinTarget;
};

const HANDOFF_TIMEOUT_MS = 15_000;
let pendingHandoff: RoomJoinHandoff | null = null;
let handoffTimeoutId: ReturnType<typeof setTimeout> | null = null;

function clearHandoffTimeout() {
  if (handoffTimeoutId !== null) {
    clearTimeout(handoffTimeoutId);
    handoffTimeoutId = null;
  }
}

export function storeRoomJoinHandoff(handoff: RoomJoinHandoff) {
  clearHandoffTimeout();
  pendingHandoff?.releaseSocketSession();
  pendingHandoff = handoff;
  handoffTimeoutId = setTimeout(() => {
    handoffTimeoutId = null;
    pendingHandoff?.releaseSocketSession();
    pendingHandoff = null;
  }, HANDOFF_TIMEOUT_MS);
}

export function consumeRoomJoinHandoff(slug: string) {
  if (pendingHandoff?.target.slug !== slug) {
    return null;
  }

  const handoff = pendingHandoff;
  pendingHandoff = null;
  clearHandoffTimeout();
  return handoff;
}
