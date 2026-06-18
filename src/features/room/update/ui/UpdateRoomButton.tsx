"use client";

import { useMemo, useState } from "react";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import type { RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";
import styles from "./UpdateRoomButton.module.css";

type Props = {
  currentUser: User | null;
  roomMeta: RoomMeta | null;
};

export default function UpdateRoomButton({ currentUser, roomMeta }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialTagSlugs = useMemo(
    () => roomMeta?.tags.map((tag) => tag.slug) ?? [],
    [roomMeta?.tags],
  );

  if (!roomMeta || !isRoomOwner(roomMeta.owner, currentUser)) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => setIsModalOpen(true)}
      >
        편집
      </button>
      {isModalOpen ? (
        <RoomFormModal
          open
          mode="edit"
          roomSlug={roomMeta.slug}
          initialTitle={roomMeta.title}
          initialTagSlugs={initialTagSlugs}
          initialHasPassword={roomMeta.hasPassword}
          initialThumbnailUrl={roomMeta.thumbnailUrl}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </>
  );
}
