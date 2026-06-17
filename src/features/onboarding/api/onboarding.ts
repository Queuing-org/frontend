import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { OnboardingPayload } from "@/src/features/user/model/types";
import {
  assertApiBooleanResult,
  unwrapApiResponse,
} from "@/src/shared/api/api-response";
import { ApiResponse } from "@/src/shared/api/types";

export async function completeOnboarding(
  payload: OnboardingPayload
): Promise<boolean> {
  const { data } = await axiosInstance.patch<ApiResponse<boolean>>(
    "/api/v1/user-profiles/me/onboarding",
    payload
  );

  return assertApiBooleanResult(
    unwrapApiResponse(data),
    "온보딩을 완료하지 못했습니다.",
  );
}
