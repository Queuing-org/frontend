"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMe } from "../api/updateMe";
import type { UpdateMePayload } from "../model/types";
import type { ApiError } from "@/src/shared/api/api-error";
import type { User } from "@/src/features/user/model/types";
import { userKeys } from "@/src/features/user/model/queryKeys";

export function useUpdateMe() {
  const qc = useQueryClient();

  return useMutation<User, ApiError, UpdateMePayload>({
    mutationFn: (payload) => updateMe(payload),
    onSuccess: async (updatedUser) => {
      qc.setQueryData(userKeys.me(), updatedUser);
      await qc.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}
