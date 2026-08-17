import { RoomJoinError } from "@/src/features/room/api/joinRoom.types";
import { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type AlreadyParticipatingRoom = {
  slug: string;
  title: string;
};

export function getAlreadyParticipatingRoom(
  error: unknown,
): AlreadyParticipatingRoom | null {
  if (
    !(error instanceof RoomJoinError) ||
    error.code !== "room.already-participating"
  ) {
    return null;
  }

  const slug = normalizeRoomSlug(error.data?.slug ?? "");
  const title = error.data?.title?.trim() ?? "";

  return slug && title ? { slug, title } : null;
}

export function isRoomAccessDeniedError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.code === "room.access-denied"
  );
}

export function shouldKeepPasswordFormAfterSubmit(error: ApiError) {
  return (
    isRoomAccessDeniedError(error)
  );
}
