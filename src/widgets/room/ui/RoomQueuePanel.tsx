"use client";

import { useState } from "react";
import Image from "next/image";
import { useRoomQueue } from "@/src/entities/playlist/model/useRoomQueue";
import type { PlaylistEntry } from "@/src/entities/playlist/model/types";
import { useMe } from "@/src/entities/user/hooks/useMe";
import styles from "./RoomQueuePanel.module.css";

type Props = {
  roomPassword?: string | null;
  roomSlug: string;
};

type QueueTab = "all" | "mine";
type StatusTone = "active" | "played" | "queued" | "skipped";

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getEntryStatus(entry: PlaylistEntry): {
  label: string;
  tone: StatusTone;
} {
  if (entry.status.isActive) {
    return { label: "재생 중", tone: "active" };
  }

  if (entry.status.skipped) {
    return { label: "건너뜀", tone: "skipped" };
  }

  if (entry.status.isPlayed) {
    return { label: "재생 완료", tone: "played" };
  }

  return { label: "대기 중", tone: "queued" };
}

function isRequestedByCurrentUser(
  entry: PlaylistEntry,
  currentUser: ReturnType<typeof useMe>["data"],
) {
  if (!currentUser) {
    return false;
  }

  if (typeof currentUser.userId === "number") {
    return entry.addedBy.userId === currentUser.userId;
  }

  return entry.addedBy.nickname === currentUser.nickname;
}

function QueueEntryCard({ entry }: { entry: PlaylistEntry }) {
  const entryStatus = getEntryStatus(entry);

  return (
    <li className={styles.item} data-active={entry.status.isActive}>
      <div className={styles.thumbnailWrap}>
        <Image
          src={entry.track.thumbnailUrl}
          alt={`${entry.track.title} thumbnail`}
          fill
          sizes="72px"
          unoptimized
          className={styles.thumbnail}
        />
        {entry.status.isActive ? (
          <div className={styles.nowPlaying}>PLAY</div>
        ) : null}
      </div>
      <div className={styles.meta}>
        <div className={styles.title}>{entry.track.title}</div>
        <div className={styles.subtext}>신청자 {entry.addedBy.nickname}</div>
        <div className={styles.badges}>
          <span className={styles.badge}>#{entry.order}</span>
          <span className={styles.badge} data-tone={entryStatus.tone}>
            {entryStatus.label}
          </span>
        </div>
      </div>
      <div className={styles.duration}>{formatDuration(entry.track.durationMs)}</div>
    </li>
  );
}

export default function RoomQueuePanel({ roomPassword, roomSlug }: Props) {
  const [activeTab, setActiveTab] = useState<QueueTab>("all");
  const { data: currentUser, isLoading: isMeLoading } = useMe();
  const {
    data: entries,
    error,
    isLoading,
    isRefetching,
  } = useRoomQueue(roomSlug, roomPassword, 0, 200);

  const allEntries = entries ?? [];
  const myEntries = allEntries.filter((entry) =>
    isRequestedByCurrentUser(entry, currentUser),
  );
  const visibleEntries = activeTab === "all" ? allEntries : myEntries;

  let emptyMessage = "플레이리스트가 아직 비어 있습니다.";
  if (activeTab === "mine") {
    if (isMeLoading) {
      emptyMessage = "내 신청곡 정보를 확인하는 중입니다.";
    } else if (!currentUser) {
      emptyMessage = "내 신청곡을 확인할 수 없습니다.";
    } else {
      emptyMessage = "내가 신청한 곡이 아직 없습니다.";
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.tabs} role="tablist" aria-label="플레이리스트 탭">
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={activeTab === "all"}
          data-active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        >
          전체 트랙
          <span className={styles.tabCount}>{allEntries.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={activeTab === "mine"}
          data-active={activeTab === "mine"}
          onClick={() => setActiveTab("mine")}
        >
          내 신청곡
          <span className={styles.tabCount}>{myEntries.length}</span>
        </button>
      </div>
      <div className={styles.listArea}>
        {isLoading ? (
          <div className={styles.state}>플레이리스트를 불러오는 중입니다.</div>
        ) : error ? (
          <div className={styles.state}>
            {error.message || "플레이리스트를 불러오지 못했습니다."}
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className={styles.state}>{emptyMessage}</div>
        ) : (
          <ul className={styles.list}>
            {visibleEntries.map((entry) => (
              <QueueEntryCard key={entry.entryId} entry={entry} />
            ))}
          </ul>
        )}
      </div>
      {isRefetching ? <div className={styles.refreshing}>최신 목록으로 갱신 중...</div> : null}
    </div>
  );
}
