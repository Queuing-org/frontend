import type { RoomTag } from "../model/types";
import styles from "./SearchPageRoomCard.module.css";

type Props = {
  slug: string;
  title: string;
  tag: RoomTag[];
};

export default function SearchPageRoomCard({ slug, title, tag }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.tags}>
        {tag.map((roomTag) => (
          <span key={roomTag.slug} className={styles.tag}>
            {roomTag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
