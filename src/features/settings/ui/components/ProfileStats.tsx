"use client";

import styles from "../ProfileSettingsTab.module.css";

export default function ProfileStats() {
  return (
    <dl className={styles.profileStats}>
      <div className={styles.statItem}>
        <dt>큐잉 횟수</dt>
        <dd>개발중입니다.</dd>
      </div>
      <div className={styles.statItem}>
        <dt>이용 시간</dt>
        <dd>개발중입니다.</dd>
      </div>
      <div className={styles.statItem}>
        <dt>음악력</dt>
        <dd>개발중입니다.</dd>
      </div>
    </dl>
  );
}
