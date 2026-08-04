import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export function publishLeaveRequest(slug: string) {
  const safeSlug = normalizeRoomSlug(slug);
  const client = getSocketClient();

  if (!safeSlug || !client.connected) {
    return false;
  }

  try {
    client.publish({
      destination: `/app/room/${encodeURIComponent(safeSlug)}/leave`,
      body: "",
    });
    return true;
  } catch {
    // A route cleanup can race with a socket close.
    return false;
  }
}
