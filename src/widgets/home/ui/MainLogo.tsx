import Link from "next/link";
import styles from "./MainLogo.module.css";

export default function MainLogo() {
  return (
    <Link href="/home" className={styles.logo}>
      QUEUING.COM
    </Link>
  );
}
