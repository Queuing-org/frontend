import { axiosInstance } from "@/src/shared/api/axiosInstance";

export async function blockUser(userSlug: string): Promise<void> {
  await axiosInstance.put(
    `/api/v1/user-profiles/me/blocked-users/${encodeURIComponent(userSlug)}`,
  );
}
