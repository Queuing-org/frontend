import Image from "next/image";
import styles from "./HomeBottomControl.module.css";

export default function HomeBottomControl() {
  return (
    <div className={styles.controlWrap}>
      <button
        type="button"
        className={styles.control}
        aria-label="홈 하단 컨트롤"
      >
        <span className={styles.topLabel}>MENU</span>
        <span className={styles.leftArrow} aria-hidden="true">
          <Image src="/icons/left_arrow.svg" alt="" width={20} height={20} />
        </span>
        <span className={styles.rightArrow} aria-hidden="true">
          <Image src="/icons/right_arrow.svg" alt="" width={20} height={20} />
        </span>
        <span className={styles.centerCircle} aria-hidden="true" />
        <span className={styles.bottomLabel}>FILTER</span>
      </button>
    </div>
  );
}
