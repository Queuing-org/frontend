"use client";

import { createRoom } from "@/src/features/room/api/createRoom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import type {
  CreateRoomPayload,
  CreateRoomResult,
} from "@/src/features/room/api/types";
import { roomKeys } from "@/src/features/room/model/queryKeys";

export function useCreateRoom() {
  const qc = useQueryClient();

  return useMutation<CreateRoomResult, ApiError, CreateRoomPayload>({
    mutationFn: createRoom,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: roomKeys.all() });
    },
  });
}
