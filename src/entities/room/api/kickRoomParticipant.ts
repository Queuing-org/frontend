import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { ApiError } from "@/src/shared/api/api-error";
import type { ApiResponse } from "@/src/shared/api/types";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export type KickRoomParticipantParams = {
  password?: string | null;
  slug: string;
  userId: number;
};

export async function kickRoomParticipant({
  password,
  slug,
  userId,
}: KickRoomParticipantParams): Promise<boolean> {
  if (!Number.isFinite(userId)) {
    throw new ApiError({
      message: "내보낼 참가자 식별자가 올바르지 않습니다.",
      status: 400,
    });
  }

  const res = await axiosInstance.delete<ApiResponse<boolean>>(
    `/api/v1/rooms/${encodeURIComponent(
      normalizeRoomSlug(slug),
    )}/participants/${encodeURIComponent(String(userId))}`,
    {
      headers: password
        ? {
            "X-Room-Password": password,
          }
        : undefined,
    },
  );

  if (!res.data.result) {
    throw new ApiError({
      message: "참가자를 내보내지 못했습니다.",
      status: 500,
    });
  }

  return res.data.result;
}
