"use client";

import Image from "next/image";
import styles from "./RoomSearchInput.module.css";

export default function RoomSearchInput() {
  return (
    <form
      className={styles.field}
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        <Image
          src="/icons/search2.svg"
          alt=""
          width={18}
          height={18}
          className={styles.icon}
        />
      </span>
      <input
        type="search"
        name="q"
        className={styles.input}
        placeholder="찾고 싶은 큐가 있나요?"
        aria-label="방 검색"
        autoComplete="off"
      />
    </form>
  );
}
