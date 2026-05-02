"use client";

import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import type { RoomOwner } from "@/src/entities/room/model/types";
import { useMe } from "@/src/entities/user/hooks/useMe";
import type { User } from "@/src/entities/user/model/types";
import styles from "./UpdateRoomButton.module.css";

type Props = {
  slug: string | null;
};

function isRoomOwner(
  owner: RoomOwner | null | undefined,
  me: User | null | undefined,
) {
  if (!owner || !me) {
    return false;
  }

  if (owner.userId != null && me.userId != null) {
    return owner.userId === me.userId;
  }

  return owner.slug === me.slug;
}

export default function UpdateRoomButton({ slug }: Props) {
  const { data: roomMeta } = useRoomMeta(slug);
  const { data: me } = useMe();

  if (!isRoomOwner(roomMeta?.owner, me)) {
    return null;
  }

  return (
    <button type="button" className={styles.button}>
      편집
    </button>
  );
}
