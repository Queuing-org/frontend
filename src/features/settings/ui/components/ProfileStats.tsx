"use client";

import styles from "../ProfileSettingsTab.module.css";

type Props = {
  musicPower?: number;
  queuingCount?: number;
};

function formatStat(value: number | undefined) {
  return typeof value === "number" ? value.toLocaleString("ko-KR") : "-";
}

export default function ProfileStats({ musicPower, queuingCount }: Props) {
  return (
    <dl className={styles.profileStats}>
      <div className={styles.statItem}>
        <dt>큐잉 횟수</dt>
        <dd>{formatStat(queuingCount)}</dd>
      </div>
      <div className={styles.statItem}>
        <dt>음악력</dt>
        <dd>{formatStat(musicPower)}</dd>
      </div>
    </dl>
  );
}
