import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type RoomMemberAction = "kick" | "transfer";

export function getRoomMemberFeedbackKey(
  action: RoomMemberAction,
  roomSlug: string,
  userSlug: string,
) {
  return `room-member:${action}:${normalizeRoomSlug(roomSlug)}:${userSlug}`;
}

export function getRoomMemberSuccessMessage(
  action: RoomMemberAction,
  nickname: string,
) {
  return action === "kick"
    ? `'${nickname}'님을 방에서 내보냈습니다.`
    : `'${nickname}'님에게 방장을 위임했습니다!`;
}

export function getRoomMemberFailureMessage(
  action: RoomMemberAction,
  serverMessage?: string | null,
) {
  if (serverMessage?.trim()) {
    return serverMessage;
  }

  return action === "kick"
    ? "참가자를 방에서 내보내지 못했습니다."
    : "방장을 위임하지 못했습니다.";
}
