import { axiosInstance } from "@/src/shared/api/axiosInstance";

export type WithdrawMeParams = {
  reason?: string;
};

export async function withdrawMe({ reason }: WithdrawMeParams = {}): Promise<void> {
  const normalizedReason = reason?.trim();
  await axiosInstance.delete(
    "/api/v1/user-profiles/me",
    normalizedReason ? { data: { reason: normalizedReason } } : undefined,
  );
}
