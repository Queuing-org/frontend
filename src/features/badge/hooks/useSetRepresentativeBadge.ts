"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { User } from "@/src/features/user/model/types";
import { updateRepresentativeBadge } from "../api/updateRepresentativeBadge";
import { badgeKeys } from "../model/queryKeys";
import type { SetRepresentativeBadgePayload } from "../model/types";

export function useSetRepresentativeBadge() {
  const qc = useQueryClient();

  return useMutation<void, ApiError, SetRepresentativeBadgePayload>({
    mutationFn: updateRepresentativeBadge,
    onSuccess: async () => {
      const me = qc.getQueryData<User | null>(userKeys.me());

      await Promise.all([
        qc.invalidateQueries({ queryKey: badgeKeys.me() }),
        qc.invalidateQueries({ queryKey: userKeys.me() }),
        me?.slug
          ? qc.invalidateQueries({
              queryKey: badgeKeys.publicUser(me.slug),
            })
          : Promise.resolve(),
      ]);
    },
  });
}
