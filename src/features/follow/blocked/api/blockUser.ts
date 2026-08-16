import { axiosInstance } from "@/src/shared/api/axiosInstance";

export type BlockUserParams = {
  reason?: string;
  targetSlug: string;
};

export async function blockUser({
  reason,
  targetSlug,
}: BlockUserParams): Promise<void> {
  const normalizedReason = reason?.trim();
  await axiosInstance.put(
    `/api/v1/user-profiles/me/blocked-users/${encodeURIComponent(targetSlug)}`,
    normalizedReason ? { reason: normalizedReason } : undefined,
  );
}
