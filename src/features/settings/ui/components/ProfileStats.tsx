"use client";

import { formatOptionalStat } from "@/src/shared/lib/formatOptionalStat";
import { formatListeningDuration } from "@/src/features/user/profile/model/formatListeningDuration";
import styles from "../ProfileSettingsTab.module.css";

type Props = {
  listeningDurationSeconds?: number;
  musicPower?: number;
  queuingCount?: number;
};

export default function ProfileStats({
  listeningDurationSeconds,
  musicPower,
  queuingCount,
}: Props) {
  return (
    <dl className={styles.profileStats}>
      <div className={styles.statItem}>
        <dt>큐잉 횟수</dt>
        <dd>{formatOptionalStat(queuingCount)}</dd>
      </div>
      <div className={styles.statItem}>
        <dt>이용 시간</dt>
        <dd>{formatListeningDuration(listeningDurationSeconds)}</dd>
      </div>
      <div className={styles.statItem}>
        <dt>음악력</dt>
        <dd>{formatOptionalStat(musicPower)}</dd>
      </div>
    </dl>
  );
}
