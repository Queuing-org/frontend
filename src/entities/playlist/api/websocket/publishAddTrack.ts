import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type AddTrackPayload = {
  videoId: string;
};

// 플레이리스트 추가 destination으로 videoId를 포함한 요청을 보낸다.
export function publishAddTrack(safeSlug: string, payload: AddTrackPayload) {
  const client = getSocketClient();
  const normalizedSlug = normalizeRoomSlug(safeSlug);

  client.publish({
    destination: `/app/room/${encodeURIComponent(normalizedSlug)}/playlist`,
    body: JSON.stringify({ videoId: payload.videoId.trim() }),
  });
}
