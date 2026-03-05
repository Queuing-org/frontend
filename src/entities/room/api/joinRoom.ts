import type { StompSubscription } from "@stomp/stompjs";
import { ApiError } from "@/src/shared/api/api-error";
import type { WsErrorData, WsEvent } from "@/src/entities/room/model/types";
import {
  connectSocket,
  getSocketClient,
} from "@/src/shared/api/websocket/stompConnection";

type RoomJoinEvent = Partial<WsEvent>;

export type JoinRoomPayload = {
  password?: string | null;
};

export type JoinRoomResult = {
  roomSlug: string;
  timestamp: number;
  data: unknown;
};

async function waitForSocketConnected(timeoutMs = 5000) {
  const client = getSocketClient();
  if (client.connected) return;

  connectSocket();

  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const poller = setInterval(() => {
      if (client.connected) {
        clearInterval(poller);
        resolve();
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(poller);
        reject(
          new ApiError({
            status: 408,
            code: "socket.connect-timeout",
            message: "웹소켓 연결 시간이 초과되었습니다.",
          }),
        );
      }
    }, 50);
  });
}

type JoinHandlers = {
  onJoined: (result: JoinRoomResult) => void;
  onError: (error: ApiError) => void;
};

function subscribeRoomJoinEvents(
  safeSlug: string,
  handlers: JoinHandlers,
): StompSubscription {
  const client = getSocketClient();
  const topic = `/topic/room/${encodeURIComponent(safeSlug)}/events`;

  return client.subscribe(topic, ({ body }) => {
    if (!body) return;

    let event: RoomJoinEvent;
    try {
      event = JSON.parse(body) as RoomJoinEvent;
    } catch {
      return;
    }

    if (event.type === "ROOM_JOINED") {
      handlers.onJoined({
        roomSlug: event.roomSlug ?? safeSlug,
        timestamp: event.timestamp ?? Date.now(),
        data: event.data ?? null,
      });
      return;
    }

    if (event.type === "ERROR" || event.type === "ROOM_JOIN_FAILED") {
      const errorData = (event.data ?? {}) as Partial<WsErrorData>;
      handlers.onError(
        new ApiError({
          status: errorData.statusCode ?? 400,
          code: errorData.code ?? "room.join-failed",
          message: errorData.message ?? "방 참가에 실패했습니다.",
        }),
      );
    }
  });
}

function publishJoinRequest(safeSlug: string, payload: JoinRoomPayload) {
  const client = getSocketClient();

  client.publish({
    destination: `/app/room/${encodeURIComponent(safeSlug)}/join`,
    body: JSON.stringify({ password: payload.password ?? null }),
  });
}

export async function joinRoom(
  slug: string,
  payload: JoinRoomPayload = {},
): Promise<JoinRoomResult> {
  const safeSlug = slug.trim();
  if (!safeSlug) {
    throw new ApiError({
      status: 400,
      code: "room.invalid-slug",
      message: "방 slug가 비어 있습니다.",
    });
  }

  await waitForSocketConnected();

  return new Promise<JoinRoomResult>((resolve, reject) => {
    let settled = false;
    let subscription: StompSubscription | null = null;

    const timeoutId = setTimeout(() => {
      finishReject(
        new ApiError({
          status: 408,
          code: "room.join-timeout",
          message: "방 참가 응답 대기 시간이 초과되었습니다.",
        }),
      );
    }, 8000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };

    const finishResolve = (result: JoinRoomResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const finishReject = (error: ApiError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    subscription = subscribeRoomJoinEvents(safeSlug, {
      onJoined: finishResolve,
      onError: finishReject,
    });

    try {
      publishJoinRequest(safeSlug, payload);
    } catch (error) {
      finishReject(
        new ApiError({
          status: 500,
          code: "room.join-publish-failed",
          message:
            error instanceof Error
              ? error.message
              : "방 참가 요청 전송에 실패했습니다.",
        }),
      );
    }
  });
}
