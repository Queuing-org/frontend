"use client";

import Image from "next/image";
import styles from "./RoomSearchInput.module.css";

type Props = {
  onChange: (query: string) => void;
  value: string;
};

export default function RoomSearchInput({ onChange, value }: Props) {
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
        placeholder="노래 혹은 방 검색..."
        aria-label="방 검색"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => onChange("")}
        >
          RESET
        </button>
      ) : null}
    </form>
  );
}
