"use client";

import { useMemo, useState } from "react";
import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import { isRoomOwner } from "@/src/entities/room/lib/isRoomOwner";
import { useMe } from "@/src/entities/user/hooks/useMe";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";
import styles from "./UpdateRoomButton.module.css";

type Props = {
  slug: string | null;
};

export default function UpdateRoomButton({ slug }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: roomMeta } = useRoomMeta(slug);
  const { data: me } = useMe();
  const initialTagSlugs = useMemo(
    () => roomMeta?.tags.map((tag) => tag.slug) ?? [],
    [roomMeta?.tags],
  );

  if (!isRoomOwner(roomMeta?.owner, me)) {
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
          roomSlug={slug ?? undefined}
          initialTitle={roomMeta?.title ?? ""}
          initialTagSlugs={initialTagSlugs}
          initialHasPassword={roomMeta?.hasPassword ?? false}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </>
  );
}
