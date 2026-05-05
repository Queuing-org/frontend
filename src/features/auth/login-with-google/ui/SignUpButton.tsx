"use client";

import { useState } from "react";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { useLogout } from "../../logout/model/useLogout";
import { redirectToGoogleLogin } from "../api/login";
import LoginModal from "./LoginModal";
import styles from "./SignUpButton.module.css";

type SignUpButtonProps = {
  className?: string;
};

export default function SignUpButton({ className }: SignUpButtonProps) {
  const { data: me, isLoading } = useMe();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const buttonClassName = [styles.button, className].filter(Boolean).join(" ");

  const isDisabled = isLoading || isLoggingOut;
  const buttonLabel = me
    ? isLoggingOut
      ? "로그아웃 중"
      : "Log Out"
    : isLoading
      ? "로그인 확인 중"
      : "Sign Up";

  function handleClick() {
    if (isDisabled) {
      return;
    }

    if (me) {
      logout();
      return;
    }

    setIsLoginModalOpen(true);
  }

  function handleCloseModal() {
    setIsLoginModalOpen(false);
  }

  function handleGoogleLogin() {
    redirectToGoogleLogin();
  }

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        disabled={isDisabled}
        onClick={handleClick}
      >
        {buttonLabel}
      </button>
      <LoginModal
        open={isLoginModalOpen}
        onClose={handleCloseModal}
        onGoogleLogin={handleGoogleLogin}
      />
    </>
  );
}
