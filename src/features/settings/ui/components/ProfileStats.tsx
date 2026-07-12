"use client";

import { formatOptionalStat } from "@/src/shared/lib/formatOptionalStat";
import styles from "../ProfileSettingsTab.module.css";

type Props = {
  musicPower?: number;
  queuingCount?: number;
};

export default function ProfileStats({ musicPower, queuingCount }: Props) {
  return (
    <dl className={styles.profileStats}>
      <div className={styles.statItem}>
        <dt>큐잉 횟수</dt>
        <dd>{formatOptionalStat(queuingCount)}</dd>
      </div>
      <div className={styles.statItem}>
        <dt>이용 시간</dt>
        <dd>개발중입니다.</dd>
      </div>
      <div className={styles.statItem}>
        <dt>음악력</dt>
        <dd>{formatOptionalStat(musicPower)}</dd>
      </div>
    </dl>
  );
}
