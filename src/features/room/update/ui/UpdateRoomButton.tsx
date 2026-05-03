"use client";

import { useMemo, useState } from "react";
import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import type { RoomOwner } from "@/src/entities/room/model/types";
import { useMe } from "@/src/entities/user/hooks/useMe";
import type { User } from "@/src/entities/user/model/types";
import RoomFormModal from "@/src/features/room/create/ui/RoomFormModal";
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
