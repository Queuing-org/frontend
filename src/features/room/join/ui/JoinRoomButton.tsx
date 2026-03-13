"use client";

import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

export default function JoinRoomButton({ slug }: Props) {
  const router = useRouter();

  return (
    <button
      className="border cursor-pointer"
      onClick={() => router.push(`/room/${slug}`)}
    >
      방 입장하기
    </button>
  );
}
