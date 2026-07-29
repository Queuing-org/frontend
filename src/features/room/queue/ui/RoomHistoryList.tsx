"use client";

import Image from "next/image";
import type { RoomHistoryEntry } from "@/src/features/playlist/model/types";
import { formatQueueDuration } from "../model/roomQueue";
import styles from "./RoomHistoryList.module.css";

type Props = {
  entries: RoomHistoryEntry[];
  emptyMessage: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export function formatHistoryEndedAt(endedAtMs: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(endedAtMs));
}

export default function RoomHistoryList({
  entries,
  emptyMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: Props) {
  if (entries.length === 0) {
    return <div className={styles.state}>{emptyMessage}</div>;
  }

  return (
    <div>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.item}>
            <span className={styles.thumbnailWrap}>
              <Image
                src={entry.thumbnailUrl}
                alt=""
                fill
                sizes="46px"
                unoptimized
                className={styles.thumbnail}
              />
            </span>
            <span className={styles.meta}>
              <span className={styles.title}>{entry.title}</span>
              <span className={styles.requester}>
                신청자 {entry.addedByUserSlug ?? "알 수 없음"}
              </span>
              <span className={styles.detail}>
                <span data-skipped={entry.skipped}>
                  {entry.skipped ? "스킵" : "재생 완료"}
                </span>
                <span>{formatQueueDuration(entry.durationMs)}</span>
                <span>종료 {formatHistoryEndedAt(entry.endedAtMs)}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      {hasNextPage ? (
        <button
          type="button"
          className={styles.loadMore}
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
        </button>
      ) : null}
    </div>
  );
}
