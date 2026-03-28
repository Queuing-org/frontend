import type { JoinRoomPayload } from "../joinRoom.types";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

// 방 참가 destination으로 비밀번호를 포함한 join 요청을 보낸다.
export function publishJoinRequest(
  safeSlug: string,
  payload: JoinRoomPayload,
) {
  const client = getSocketClient();
  const normalizedSlug = normalizeRoomSlug(safeSlug);

  client.publish({
    destination: `/app/room/${encodeURIComponent(normalizedSlug)}/join`,
    body: JSON.stringify({ password: payload.password ?? null }),
  });
}
