"use client";

import Image from "next/image";
import { forwardRef } from "react";
import styles from "./GoogleLoginButton.module.css";

type GoogleLoginButtonProps = {
  onClick: () => void;
};

const GoogleLoginButton = forwardRef<HTMLButtonElement, GoogleLoginButtonProps>(
  function GoogleLoginButton({ onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={styles.googleButton}
        onClick={onClick}
      >
        <Image
          src="/icons/google.svg"
          alt=""
          width={24}
          height={24}
          draggable={false}
          className={styles.googleIcon}
        />
        <span>구글로 1초만에 큐잉하기</span>
      </button>
    );
  },
);

export default GoogleLoginButton;
