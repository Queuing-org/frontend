import type { JoinRoomPayload } from "../joinRoom.types";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";

// 방 참가 destination으로 비밀번호를 포함한 join 요청을 보낸다.
export function publishJoinRequest(
  safeSlug: string,
  payload: JoinRoomPayload,
) {
  const client = getSocketClient();

  client.publish({
    destination: `/app/room/${encodeURIComponent(safeSlug)}/join`,
    body: JSON.stringify({ password: payload.password ?? null }),
  });
}
