import type { Room } from "@/src/entities/room/model/types";
import RoomInfo from "@/src/entities/room/ui/RoomInfo";
import RoomSearchButton from "@/src/features/room/search/ui/RoomSearchButton";
import MainLogo from "./MainLogo";
import styles from "./HomeTopBar.module.css";

type Props = {
  currentRoom: Room | null;
};

export default function HomeTopBar({ currentRoom }: Props) {
  return (
    <div className={styles.topBar}>
      <div className={styles.leftGroup}>
        <MainLogo />
        <RoomSearchButton />
      </div>
      <div className={styles.rightGroup}>
        <RoomInfo slug={currentRoom?.slug ?? null} />
      </div>
    </div>
  );
}
