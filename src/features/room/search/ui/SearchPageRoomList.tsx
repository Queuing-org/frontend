import type { Room } from "@/src/entities/room/model/types";
import SearchPageRoomCard from "@/src/entities/room/ui/SearchPageRoomCard";

type Props = {
  rooms: Room[];
};

export function SearchPageRoomList({ rooms }: Props) {
  return (
    <div>
      <div>
        {rooms.map((room) => (
          <SearchPageRoomCard
            key={room.id}
            slug={room.slug}
            title={room.title}
            tag={room.tags}
          />
        ))}
      </div>
    </div>
  );
}
