import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoom } from "../api/deleteRoom";
import { roomKeys } from "../model/queryKeys";

export function useDeleteRoom() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: roomKeys.delete(),
    mutationFn: (slug: string) => deleteRoom(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.all() });
    },
  });
}
