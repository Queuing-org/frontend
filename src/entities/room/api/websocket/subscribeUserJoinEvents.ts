import type { StompSubscription } from "@stomp/stompjs";
import { ApiError } from "@/src/shared/api/api-error";
import type { WsErrorData, WsEvent } from "@/src/entities/room/model/types";
import type { JoinRoomResult } from "../joinRoom.types";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";

type RoomJoinEvent = Partial<WsEvent>;

export type JoinHandlers = {
  onJoined: (result: JoinRoomResult) => void;
  onError: (error: ApiError) => void;
};

const USER_EVENTS_DESTINATION = "/user/playlist/events";

// 유저 전용 토픽에서 현재 방 join 결과만 골라서 전달한다.
export function subscribeUserJoinEvents(
  safeSlug: string,
  handlers: JoinHandlers,
): StompSubscription {
  const client = getSocketClient();

  return client.subscribe(USER_EVENTS_DESTINATION, ({ body }) => {
    if (!body) return;

    let event: RoomJoinEvent;
    try {
      event = JSON.parse(body) as RoomJoinEvent;
    } catch {
      return;
    }

    const eventRoomSlug = event.roomSlug ?? safeSlug;
    if (eventRoomSlug !== safeSlug) {
      return;
    }

    if (event.type === "ROOM_JOINED") {
      handlers.onJoined({
        roomSlug: eventRoomSlug,
        timestamp: event.timestamp ?? Date.now(),
        data: event.data ?? null,
      });
      return;
    }

    if (event.type === "ERROR" || event.type === "ROOM_JOIN_FAILED") {
      const errorData = event.data as WsErrorData;
      handlers.onError(
        new ApiError({
          status: errorData.statusCode,
          code: errorData.code,
          message: errorData.message,
        }),
      );
    }
  });
}
