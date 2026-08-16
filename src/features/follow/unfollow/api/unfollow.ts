import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { UnfollowParams } from "../model/types";

export async function unfollow({
  targetSlug,
}: UnfollowParams): Promise<void> {
  await axiosInstance.delete(
    `/api/v1/user-profiles/me/following/${encodeURIComponent(targetSlug)}`,
  );
}
