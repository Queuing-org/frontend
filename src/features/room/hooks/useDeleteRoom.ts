import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoom } from "../api/deleteRoom";

export function useDeleteRoom() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["rooms", "delete"],
    mutationFn: (slug: string) => deleteRoom(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}
