import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

// 다음 곡 재생 destination으로 빈 STOMP frame을 보낸다.
export function publishNextTrack(safeSlug: string) {
  const client = getSocketClient();
  const normalizedSlug = normalizeRoomSlug(safeSlug);

  client.publish({
    destination: `/app/room/${encodeURIComponent(normalizedSlug)}/next`,
  });
}
