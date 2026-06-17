import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding } from "../api/onboarding";
import { userKeys } from "@/src/features/user/model/queryKeys";

export function useCompleteOnboarding() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}
