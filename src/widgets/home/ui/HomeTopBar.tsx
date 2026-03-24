import type { Room } from "@/src/entities/room/model/types";
import RoomSearchButton from "@/src/features/room/search/ui/RoomSearchButton";
import MainLogo from "./MainLogo";
import RoomInfo from "./RoomInfo";
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
        <RoomInfo currentRoom={currentRoom} />
      </div>
    </div>
  );
}
