"use client";

import { useDeleteRoom } from "@/src/entities/room/hooks/useDeleteRoom";

type Props = {
  slug: string;
};

export default function DeleteRoomButton({ slug }: Props) {
  const { mutate, isPending } = useDeleteRoom();

  return (
    <button
      type="button"
      className="cursor-pointer border"
      onClick={() => mutate(slug)}
      disabled={isPending}
    >
      방 삭제
    </button>
  );
}
