import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { ApiError } from "@/src/shared/api/api-error";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import { buildRoomPasswordHeaders } from "@/src/shared/api/roomPasswordHeaders";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type KickRoomParticipantParams = {
  participantId?: string | null;
  password?: string | null;
  slug: string;
  userSlug?: string | null;
};

function normalizeIdentifier(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

export async function kickRoomParticipant({
  participantId,
  password,
  slug,
  userSlug,
}: KickRoomParticipantParams): Promise<boolean> {
  const normalizedUserSlug = normalizeIdentifier(userSlug);
  const normalizedParticipantId = normalizeIdentifier(participantId);

  let participantPath: string;
  if (normalizedUserSlug) {
    participantPath = `participants/${encodeURIComponent(normalizedUserSlug)}`;
  } else if (normalizedParticipantId) {
    participantPath = `guest-participants/${encodeURIComponent(
      normalizedParticipantId,
    )}`;
  } else {
    throw new ApiError({
      message: "내보낼 참가자 식별자가 올바르지 않습니다.",
      status: 400,
    });
  }

  const res = await axiosInstance.delete<ApiResponse<boolean>>(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/${participantPath}`,
    {
      headers: buildRoomPasswordHeaders(password),
    },
  );

  return assertApiBooleanResult(
    unwrapApiResponse(res.data),
    "참가자를 내보내지 못했습니다.",
  );
}
