import Image from "next/image";
import { useRoomMeta } from "../hooks/useRoomMeta";
import type { RoomTag } from "../model/types";
import styles from "./SearchPageRoomCard.module.css";

type Props = {
  slug: string;
  title: string;
  tag: RoomTag[];
  isSelected: boolean;
  onClick: () => void;
};

export default function SearchPageRoomCard({
  slug,
  title,
  tag,
  isSelected,
  onClick,
}: Props) {
  const { data, isLoading, isError } = useRoomMeta(slug);
  const activeUsersCount =
    isLoading || isError ? "-" : (data?.activeUsersCount ?? "-");
  const hasPassword = Boolean(data?.hasPassword);
  const tagsText = tag.length
    ? tag.map((roomTag) => roomTag.name).join("/")
    : "태그없음";
  const arrowSrc = isSelected
    ? "/icons/search_arrow_w.svg"
    : "/icons/search_arrow_g.svg";

  return (
    <button
      type="button"
      className={styles.card}
      data-room-slug={slug}
      data-selected={isSelected}
      onClick={onClick}
      aria-label={isSelected ? `${title} 방 입장` : `${title} 방 선택`}
    >
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.meta} data-selected={isSelected}>
          <span className={styles.metaText}>
            {tagsText} · {activeUsersCount}명
          </span>
          {hasPassword ? (
            <>
              <span className={styles.metaSeparator} aria-hidden="true">
                ·
              </span>
              <Image
                src="/icons/lock2.svg"
                alt="비밀번호 방"
                width={9}
                height={11}
                className={styles.lockIcon}
                data-selected={isSelected}
              />
            </>
          ) : null}
        </div>
      </div>
      <Image
        src={arrowSrc}
        alt=""
        width={20}
        height={32}
        className={styles.arrow}
        aria-hidden="true"
      />
    </button>
  );
}
