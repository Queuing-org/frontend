import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoom } from "../api/deleteRoom";
import { roomKeys } from "../model/queryKeys";
import type { ApiError } from "@/src/shared/api/api-error";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

export function useDeleteRoom() {
  const qc = useQueryClient();

  return useMutation<boolean, ApiError, string>({
    mutationKey: roomKeys.delete(),
    mutationFn: (slug: string) => deleteRoom(slug),
    onSuccess: async (_result, slug) => {
      const normalizedSlug = normalizeRoomSlug(slug);

      qc.removeQueries({ queryKey: roomKeys.meta(normalizedSlug) });
      await qc.invalidateQueries({ queryKey: roomKeys.all() });
    },
  });
}
