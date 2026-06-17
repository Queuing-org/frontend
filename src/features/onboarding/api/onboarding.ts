import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { OnboardingPayload } from "../model/types";
import { ApiResponse } from "@/src/shared/api/types";

export async function completeOnboarding(
  payload: OnboardingPayload
): Promise<boolean> {
  const { data } = await axiosInstance.patch<ApiResponse<boolean>>(
    "/api/v1/user-profiles/me/onboarding",
    payload
  );

  return data.result;
}
