"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import {
  transferRoomOwner,
  type TransferRoomOwnerParams,
} from "../api/transferRoomOwner";
import { roomKeys } from "../model/queryKeys";

export function useTransferRoomOwner() {
  const queryClient = useQueryClient();

  return useMutation<boolean, ApiError, TransferRoomOwnerParams>({
    mutationFn: transferRoomOwner,
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: roomKeys.meta(normalizeRoomSlug(variables.slug)),
      });
    },
  });
}
