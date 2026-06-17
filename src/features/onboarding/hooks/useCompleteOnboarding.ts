import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding } from "../api/onboarding";

export function useCompleteOnboarding() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
