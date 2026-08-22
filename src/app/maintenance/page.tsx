import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  formatMaintenanceWindow,
  getMaintenanceConfig,
} from "@/src/shared/config/maintenance/maintenanceConfig";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "서버 점검 | 큐잉",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MaintenancePage() {
  const maintenance = await getMaintenanceConfig();
  const maintenanceWindow = formatMaintenanceWindow(maintenance);

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="maintenance-title">
        <p className={styles.brand}>QUEUING.CC</p>
        <div className={styles.illustrationFrame} aria-hidden="true">
          <Image
            src="/qlofile_white.png"
            alt=""
            width={176}
            height={176}
            priority
            className={styles.illustration}
          />
        </div>
        <p className={styles.eyebrow}>SYSTEM MAINTENANCE</p>
        <h1 id="maintenance-title" className={styles.title}>
          서버 점검 중입니다.
        </h1>
        {maintenanceWindow ? (
          <p className={styles.schedule}>
            <span>{maintenanceWindow}</span>
            <span>서버 점검입니다.</span>
          </p>
        ) : (
          <p className={styles.schedule}>현재 서버 점검을 진행하고 있습니다.</p>
        )}
        <p className={styles.message}>
          {maintenance.message ?? DEFAULT_MAINTENANCE_MESSAGE}
        </p>
        <p className={styles.apology}>
          이용에 불편을 드려 죄송합니다.
        </p>
        <Link href="/" prefetch={false} className={styles.retryLink}>
          서비스 상태 다시 확인
        </Link>
      </section>
    </main>
  );
}
