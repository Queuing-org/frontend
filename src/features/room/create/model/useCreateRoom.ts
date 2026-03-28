"use client";

import { createRoom } from "@/src/entities/room/api/createRoom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import type {
  CreateRoomPayload,
  CreateRoomResult,
} from "@/src/entities/room/api/types";
import { useRouter } from "next/navigation";

export function useCreateRoom() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation<CreateRoomResult, ApiError, CreateRoomPayload>({
    mutationFn: createRoom,
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["rooms"] });
      router.push(
        `/room/${encodeURIComponent(normalizeRoomSlug(result.slug))}`,
      );
    },
  });
}
