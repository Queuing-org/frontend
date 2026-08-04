"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMe } from "../api/updateMe";
import type { UpdateMePayload } from "../model/types";
import type { ApiError } from "@/src/shared/api/api-error";
import type { User } from "@/src/features/user/model/types";
import { userKeys } from "@/src/features/user/model/queryKeys";

export function useUpdateMe() {
  const qc = useQueryClient();

  return useMutation<boolean, ApiError, UpdateMePayload>({
    mutationFn: (payload) => updateMe(payload),
    onSuccess: async () => {
      const me = qc.getQueryData<User | null>(userKeys.me());

      await Promise.all([
        qc.invalidateQueries({ queryKey: userKeys.me() }),
        me?.slug
          ? qc.invalidateQueries({ queryKey: userKeys.profile(me.slug) })
          : Promise.resolve(),
      ]);
    },
  });
}
