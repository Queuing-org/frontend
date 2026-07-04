import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type AddTrackPayload = {
  story: string | null;
  videoId: string;
};

// 플레이리스트 추가 destination으로 videoId와 선택 사연을 포함한 요청을 보낸다.
export function publishAddTrack(safeSlug: string, payload: AddTrackPayload) {
  const client = getSocketClient();
  const normalizedSlug = normalizeRoomSlug(safeSlug);
  const story = payload.story?.trim() ?? "";

  client.publish({
    destination: `/app/room/${encodeURIComponent(normalizedSlug)}/playlist`,
    body: JSON.stringify({
      story: story ? story : null,
      videoId: payload.videoId.trim(),
    }),
  });
}
