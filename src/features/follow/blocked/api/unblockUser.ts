import { axiosInstance } from "@/src/shared/api/axiosInstance";

export async function unblockUser(userSlug: string): Promise<void> {
  await axiosInstance.delete(
    `/api/v1/user-profiles/me/blocked-users/${encodeURIComponent(userSlug)}`,
  );
}
