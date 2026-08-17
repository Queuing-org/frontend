import type { JoinRoomPayload } from "../joinRoom.types";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

// 최초 입장은 비밀번호, 재접속은 접근 토큰 중 하나만 보낸다.
export function publishJoinRequest(
  safeSlug: string,
  payload: JoinRoomPayload,
) {
  const client = getSocketClient();
  const normalizedSlug = normalizeRoomSlug(safeSlug);
  const body = typeof payload.accessToken === "string"
    ? { accessToken: payload.accessToken.trim() }
    : { password: payload.password?.trim() || null };

  client.publish({
    destination: `/app/room/${encodeURIComponent(normalizedSlug)}/join`,
    body: JSON.stringify(body),
  });
}
