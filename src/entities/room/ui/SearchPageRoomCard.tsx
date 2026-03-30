import { useRoomMeta } from "../hooks/useRoomMeta";
import type { RoomTag } from "../model/types";
import styles from "./SearchPageRoomCard.module.css";

type Props = {
  slug: string;
  title: string;
  tag: RoomTag[];
  isSelected: boolean;
  distance: number;
};

function getOpacity(distance: number) {
  if (distance === 0) return 1;
  if (distance === 1) return 0.72;
  if (distance === 2) return 0.46;
  return 0.24;
}

export default function SearchPageRoomCard({
  slug,
  title,
  tag,
  isSelected,
  distance,
}: Props) {
  const { data, isLoading, isError } = useRoomMeta(slug);
  const activeUsersCount =
    isLoading || isError ? "-" : (data?.activeUsersCount ?? "-");
  const tagsText = tag.map((roomTag) => roomTag.name).join(" · ");

  return (
    <div
      className={styles.card}
      data-room-slug={slug}
      data-selected={isSelected}
      data-distance={distance}
      style={{ opacity: getOpacity(distance) }}
    >
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {tagsText ? <div className={styles.tags}>{tagsText}</div> : null}
      </div>
      <div className={styles.activeUsersCount}>{activeUsersCount}명</div>
    </div>
  );
}
