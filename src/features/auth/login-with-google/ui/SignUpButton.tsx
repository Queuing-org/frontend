"use client";

import { useState } from "react";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { redirectToGoogleLogin } from "../api/login";
import LoginModal from "./LoginModal";
import styles from "./SignUpButton.module.css";

type SignUpButtonProps = {
  className?: string;
};

export default function SignUpButton({ className }: SignUpButtonProps) {
  const { data: me, isLoading } = useMe();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const buttonClassName = [styles.button, className].filter(Boolean).join(" ");

  if (me) {
    return null;
  }

  const isDisabled = isLoading;

  function handleClick() {
    if (isDisabled) {
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
        {isLoading ? (
          <LoadingSpinner ariaLabel="로그인 상태 확인 중" size={16} />
        ) : (
          "Sign Up"
        )}
      </button>
      <LoginModal
        open={isLoginModalOpen}
        onClose={handleCloseModal}
        onGoogleLogin={handleGoogleLogin}
      />
    </>
  );
}
