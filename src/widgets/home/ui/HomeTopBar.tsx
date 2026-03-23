import type { Room } from "@/src/entities/room/model/types";
import RoomSearchButton from "@/src/features/room/search/ui/RoomSearchButton";
import MainLogo from "./MainLogo";

type Props = {
  currentRoom: Room | null;
};

export default function HomeTopBar({ currentRoom }: Props) {
  return (
    <div className="flex items-center gap-4">
      <MainLogo />
      <RoomSearchButton />
      <div>{currentRoom?.title ?? "선택된 방 없음"}</div>
    </div>
  );
}
