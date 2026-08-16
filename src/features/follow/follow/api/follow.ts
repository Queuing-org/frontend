import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { FollowParams } from "../model/types";

export async function follow({ targetSlug }: FollowParams): Promise<void> {
  await axiosInstance.put(
    `/api/v1/user-profiles/me/following/${encodeURIComponent(targetSlug)}`,
  );
}
