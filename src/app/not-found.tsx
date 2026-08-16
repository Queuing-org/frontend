import Link from "next/link";
import RoomSearchButton from "@/src/features/room/search/ui/RoomSearchButton";
import MainLogo from "@/src/shared/ui/main-logo/MainLogo";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <MainLogo />
        <span className={styles.searchButton}>
          <RoomSearchButton />
        </span>
      </header>
      <main className={styles.content}>
        <h1 className={styles.title}>존재하지 않는 페이지입니다.</h1>
        <p className={styles.description}>
          주소가 잘못되었거나 페이지가 이동되었을 수 있습니다.
        </p>
        <Link href="/" className={styles.homeLink}>
          홈으로 돌아가기
        </Link>
      </main>
    </div>
  );
}
