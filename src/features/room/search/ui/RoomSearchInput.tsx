"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./RoomSearchInput.module.css";

export default function RoomSearchInput() {
  const [query, setQuery] = useState("");

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
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query ? (
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => setQuery("")}
        >
          RESET
        </button>
      ) : null}
    </form>
  );
}
