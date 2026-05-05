"use client";

import { useMe } from "@/src/entities/user/hooks/useMe";
import { useLogout } from "../../logout/model/useLogout";
import { redirectToGoogleLogin } from "../api/login";
import styles from "./googleLoginButton.module.css";

type GoogleLoginButtonProps = {
  className?: string;
};

export default function GoogleLoginButton({
  className,
}: GoogleLoginButtonProps) {
  const { data: me, isLoading } = useMe();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
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

    redirectToGoogleLogin();
  }

  return (
    <button
      type="button"
      className={buttonClassName}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {buttonLabel}
    </button>
  );
}
