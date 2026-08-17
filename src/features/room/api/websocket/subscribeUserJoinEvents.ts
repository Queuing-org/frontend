import type { StompSubscription } from "@stomp/stompjs";
import { ApiError } from "@/src/shared/api/api-error";
import type { RoomJoinedData, WsErrorData } from "@/src/features/room/model/types";
import { RoomJoinError, type JoinRoomResult } from "../joinRoom.types";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";

export type RoomJoinEvent = {
  type: "ROOM_JOINED" | "ERROR";
  roomSlug: string;
  timestamp: number;
  data: unknown;
};

export type JoinHandlers = {
  onJoined: (result: JoinRoomResult) => void;
  onError: (error: ApiError) => void;
};

const USER_EVENTS_DESTINATION = "/user/playlist/events";

function getRoomJoinedData(data: unknown): RoomJoinedData | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as Partial<RoomJoinedData>;
  const participant = candidate.participant;
  if (
    !participant ||
    typeof participant !== "object" ||
    (participant.participantType !== "USER" &&
      participant.participantType !== "GUEST") ||
    typeof participant.participantId !== "string" ||
    (participant.userSlug !== null &&
      typeof participant.userSlug !== "string") ||
    typeof participant.nickname !== "string" ||
    (participant.profileImageUrl !== null &&
      typeof participant.profileImageUrl !== "string") ||
    !Array.isArray(candidate.recentChatMessages) ||
    typeof candidate.roomAccessToken !== "string" ||
    !candidate.roomAccessToken.trim()
  ) {
    return null;
  }

  return candidate as RoomJoinedData;
}

function getWsErrorData(
  data: unknown,
): (WsErrorData & { slug?: string; title?: string }) | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as Partial<WsErrorData> & {
    slug?: unknown;
    title?: unknown;
  };
  if (
    typeof candidate.statusCode !== "number" ||
    typeof candidate.code !== "string" ||
    typeof candidate.message !== "string"
  ) {
    return null;
  }

  return {
    statusCode: candidate.statusCode,
    code: candidate.code,
    message: candidate.message,
    ...(typeof candidate.slug === "string" ? { slug: candidate.slug } : {}),
    ...(typeof candidate.title === "string" ? { title: candidate.title } : {}),
  };
}

export function parseRoomJoinEvent(body: string): RoomJoinEvent | null {
  let candidate: unknown;
  try {
    candidate = JSON.parse(body) as unknown;
  } catch {
    return null;
  }

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const event = candidate as Partial<RoomJoinEvent>;
  if (
    (event.type !== "ROOM_JOINED" && event.type !== "ERROR") ||
    typeof event.roomSlug !== "string" ||
    !event.roomSlug.trim() ||
    typeof event.timestamp !== "number" ||
    !Number.isFinite(event.timestamp) ||
    !("data" in event)
  ) {
    return null;
  }

  return event as RoomJoinEvent;
}

// 유저 전용 토픽에서 현재 방 join 결과만 골라서 전달한다.
export function subscribeUserJoinEvents(
  safeSlug: string,
  handlers: JoinHandlers,
): StompSubscription {
  const client = getSocketClient();

  return client.subscribe(USER_EVENTS_DESTINATION, ({ body }) => {
    if (!body) return;

    const event = parseRoomJoinEvent(body);
    if (!event || event.roomSlug !== safeSlug) {
      return;
    }

    if (event.type === "ROOM_JOINED") {
      const data = getRoomJoinedData(event.data);
      if (!data) {
        handlers.onError(
          new ApiError({
            status: 502,
            code: "room.invalid-join-response",
            message: "방 참가 응답이 올바르지 않습니다.",
          }),
        );
        return;
      }
      handlers.onJoined({
        roomSlug: event.roomSlug,
        timestamp: event.timestamp,
        data,
      });
      return;
    }

    if (event.type === "ERROR") {
      const errorData = getWsErrorData(event.data);
      if (!errorData) {
        return;
      }
      handlers.onError(
        new RoomJoinError({
          status: errorData.statusCode,
          code: errorData.code,
          message: errorData.message,
          data:
            errorData.slug !== undefined || errorData.title !== undefined
              ? {
                  ...(errorData.slug !== undefined
                    ? { slug: errorData.slug }
                    : {}),
                  ...(errorData.title !== undefined
                    ? { title: errorData.title }
                    : {}),
                }
              : null,
        }),
      );
    }
  });
}
