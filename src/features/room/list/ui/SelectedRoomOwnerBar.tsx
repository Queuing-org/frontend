import Image from "next/image";
import type { RoomOwner } from "@/src/features/room/model/types";
import styles from "./SelectedRoomOwnerBar.module.css";

type Props = {
  owner: RoomOwner;
};

export default function SelectedRoomOwnerBar({ owner }: Props) {
  return (
    <div className={styles.bar} aria-label={`방장 ${owner.nickname}`}>
      <span className={styles.avatarWrap}>
        <Image
          src={owner.profileImageUrl || "/Basic_Profile.png"}
          alt=""
          fill
          sizes="32px"
          unoptimized={Boolean(owner.profileImageUrl)}
          className={styles.avatar}
        />
      </span>
      <span className={styles.name}>{owner.nickname}</span>
    </div>
  );
}
