"use client";

import JoinRoomButton from "@/src/features/room/join/JoinRoomButton";
import DeleteRoomButton from "@/src/features/room/delete/ui/DeleteRoomButton";
import RoomCard from "@/src/entities/room/ui/RoomCard";
import { useRoomsQuery } from "@/src/entities/room/hooks/useFetchRooms";

export default function RoomsListTest() {
  const { data, isLoading, isError, error } = useRoomsQuery();

  if (isLoading)
    return <div className="border p-4 text-black">방 목록 로딩중...</div>;

  if (isError) {
    return (
      <div className="border p-4 text-black">
        방 목록 로딩 실패: ({error.status}) {error.message}
      </div>
    );
  }

  const rooms = data?.rooms ?? [];

  return (
    <div className="border p-4 space-y-3 text-black">
      <div className="text-sm font-semibold">방 목록 테스트</div>

      {rooms.length === 0 ? (
        <div className="text-sm">방이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              title={room.title}
              slug={room.slug}
              tags={room.tags}
              actions={
                <div className="flex gap-2">
                  <JoinRoomButton slug={room.slug} />
                  <DeleteRoomButton slug={room.slug} />
                </div>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
