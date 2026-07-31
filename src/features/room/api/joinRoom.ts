import type { IFrame, StompSubscription } from "@stomp/stompjs";
import { ApiError } from "@/src/shared/api/api-error";
import {
  addSocketListener,
  connectSocket,
  getSocketClient,
} from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type { JoinRoomPayload, JoinRoomResult } from "./joinRoom.types";
import { publishJoinRequest } from "./websocket/publishJoinRequest";
import { publishLeaveRequest } from "./websocket/publishLeaveRequest";
import { subscribeUserJoinEvents } from "./websocket/subscribeUserJoinEvents";

export type { JoinRoomPayload, JoinRoomResult } from "./joinRoom.types";

type JoinRoomOptions = {
  leaveOnAbort?: boolean;
  signal?: AbortSignal;
};

const SOCKET_CONNECT_TIMEOUT_MS = 12_000;
const ROOM_JOIN_TIMEOUT_MS = 8_000;
const USER_EVENT_SUBSCRIPTION_SETTLE_MS = 250;

function createJoinCancelledError() {
  return new ApiError({
    status: 499,
    code: "room.join-cancelled",
    message: "방 참가 요청이 취소되었습니다.",
  });
}

// 전역 STOMP client가 재연결 중이어도 다음 onConnect까지 기다린다.
async function waitForSocketConnected(
  signal?: AbortSignal,
  timeoutMs = SOCKET_CONNECT_TIMEOUT_MS,
) {
  const client = getSocketClient();
  if (client.connected) return;

  if (signal?.aborted) {
    throw createJoinCancelledError();
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let removeSocketListener = () => {};

    const cleanup = () => {
      clearTimeout(timeoutId);
      removeSocketListener();
      signal?.removeEventListener("abort", handleAbort);
    };

    const finishResolve = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const finishReject = (error: ApiError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const handleAbort = () => {
      finishReject(createJoinCancelledError());
    };

    const timeoutId = setTimeout(() => {
      finishReject(
        new ApiError({
          status: 408,
          code: "socket.connect-timeout",
          message: "웹소켓 연결 시간이 초과되었습니다.",
        }),
      );
    }, timeoutMs);

    removeSocketListener = addSocketListener({
      onConnect: finishResolve,
      onStompError: (frame) => {
        finishReject(createStompError(frame));
      },
    });
    signal?.addEventListener("abort", handleAbort, { once: true });

    if (client.connected) {
      finishResolve();
      return;
    }

    if (!client.active) {
      try {
        connectSocket();
      } catch (error) {
        finishReject(
          new ApiError({
            status: 503,
            code: "socket.connect-failed",
            message:
              error instanceof Error
                ? error.message
                : "웹소켓 연결을 시작하지 못했습니다.",
          }),
        );
      }
    }
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
  options: JoinRoomOptions = {},
): Promise<JoinRoomResult> {
  const safeSlug = normalizeRoomSlug(slug);
  if (!safeSlug) {
    throw new ApiError({
      status: 400,
      code: "room.invalid-slug",
      message: "방 slug가 비어 있습니다.",
    });
  }

  await waitForSocketConnected(options.signal);

  return new Promise<JoinRoomResult>((resolve, reject) => {
    let settled = false;
    let joinPublished = false;
    let subscription: StompSubscription | null = null;
    let publishTimer: ReturnType<typeof setTimeout> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
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

    const handleAbort = () => {
      finishReject(createJoinCancelledError(), {
        leave: options.leaveOnAbort ?? true,
      });
    };

    const cleanup = (cleanupOptions: { unsubscribe?: boolean } = {}) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (publishTimer) {
        clearTimeout(publishTimer);
        publishTimer = null;
      }
      removeSocketListener();
      options.signal?.removeEventListener("abort", handleAbort);

      if (!cleanupOptions.unsubscribe || !subscription) {
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
      rejectOptions: { leave?: boolean; unsubscribe?: boolean } = {},
    ) => {
      if (settled) return;
      settled = true;
      if (joinPublished && (rejectOptions.leave ?? true)) {
        publishLeaveRequest(safeSlug);
      }
      cleanup({ unsubscribe: rejectOptions.unsubscribe ?? true });
      reject(error);
    };

    try {
      if (options.signal?.aborted) {
        finishReject(createJoinCancelledError());
        return;
      }

      options.signal?.addEventListener("abort", handleAbort, { once: true });
      subscription = subscribeUserJoinEvents(safeSlug, {
        onJoined: finishResolve,
        onError: finishReject,
      });
      // backend broker가 SUBSCRIBE receipt를 반환하지 않으므로 user-event
      // 구독 등록이 inbound join 처리보다 먼저 끝날 짧은 안정화 구간을 둔다.
      publishTimer = setTimeout(() => {
        publishTimer = null;
        if (settled) return;

        try {
          publishJoinRequest(safeSlug, payload);
          joinPublished = true;
          timeoutId = setTimeout(() => {
            finishReject(
              new ApiError({
                status: 408,
                code: "room.join-timeout",
                message: "방 참가 응답 대기 시간이 초과되었습니다.",
              }),
            );
          }, ROOM_JOIN_TIMEOUT_MS);
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
      }, USER_EVENT_SUBSCRIPTION_SETTLE_MS);
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
