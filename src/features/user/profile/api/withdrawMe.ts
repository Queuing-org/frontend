import { axiosInstance } from "@/src/shared/api/axiosInstance";

export async function withdrawMe(): Promise<void> {
  await axiosInstance.delete("/api/v1/user-profiles/me");
}
