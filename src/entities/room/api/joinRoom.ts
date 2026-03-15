import type { IFrame, StompSubscription } from "@stomp/stompjs";
import { ApiError } from "@/src/shared/api/api-error";
import {
  addSocketListener,
  connectSocket,
  getSocketClient,
} from "@/src/shared/api/websocket/stompConnection";
import type { JoinRoomPayload, JoinRoomResult } from "./joinRoom.types";
import { publishJoinRequest } from "./websocket/publishJoinRequest";
import { subscribeUserJoinEvents } from "./websocket/subscribeUserJoinEvents";

export type { JoinRoomPayload, JoinRoomResult } from "./joinRoom.types";

// STOMP 연결을 기다리는 함수
async function waitForSocketConnected(timeoutMs = 5000) {
  const client = getSocketClient();
  if (client.connected) return;

  if (!client.active) {
    connectSocket();
  }

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

function createStompError(frame: IFrame) {
  return new ApiError({
    status: 403,
    code: "socket.stomp-error",
    message:
      frame.headers["message"] ??
      frame.body ??
      "웹소켓 서버가 요청을 거부했습니다.",
  });
}

function createSocketClosedError(event: CloseEvent) {
  return new ApiError({
    status: 503,
    code: "socket.closed",
    message: event.reason || "웹소켓 연결이 종료되었습니다.",
  });
}

function createSocketError() {
  return new ApiError({
    status: 503,
    code: "socket.error",
    message: "웹소켓 통신 중 오류가 발생했습니다.",
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
    const removeSocketListener = addSocketListener({
      onStompError: (frame) => {
        finishReject(createStompError(frame), { unsubscribe: false });
      },
      onWebSocketClose: (event) => {
        finishReject(createSocketClosedError(event), { unsubscribe: false });
      },
      onWebSocketError: () => {
        finishReject(createSocketError(), { unsubscribe: false });
      },
    });

    const timeoutId = setTimeout(() => {
      finishReject(
        new ApiError({
          status: 408,
          code: "room.join-timeout",
          message: "방 참가 응답 대기 시간이 초과되었습니다.",
        }),
      );
    }, 8000);

    const cleanup = (options: { unsubscribe?: boolean } = {}) => {
      clearTimeout(timeoutId);
      removeSocketListener();

      if (!options.unsubscribe || !subscription) {
        return;
      }

      const client = getSocketClient();
      if (!client.connected) {
        return;
      }

      try {
        subscription.unsubscribe();
      } catch {
        // The broker may have already torn down the subscription.
      }
    };

    const finishResolve = (result: JoinRoomResult) => {
      if (settled) return;
      settled = true;
      cleanup({ unsubscribe: true });
      resolve(result);
    };

    const finishReject = (
      error: ApiError,
      options: { unsubscribe?: boolean } = {},
    ) => {
      if (settled) return;
      settled = true;
      cleanup({ unsubscribe: options.unsubscribe ?? true });
      reject(error);
    };

    try {
      subscription = subscribeUserJoinEvents(safeSlug, {
        onJoined: finishResolve,
        onError: finishReject,
      });
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
