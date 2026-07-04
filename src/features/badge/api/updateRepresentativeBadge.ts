import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { SetRepresentativeBadgePayload } from "../model/types";

export async function updateRepresentativeBadge(
  payload: SetRepresentativeBadgePayload,
): Promise<void> {
  await axiosInstance.put(
    "/api/v1/users/me/badges/representative",
    payload,
  );
}
