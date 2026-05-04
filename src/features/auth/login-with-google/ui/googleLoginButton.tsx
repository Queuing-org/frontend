"use client";

import { redirectToGoogleLogin } from "../api/login";

type GoogleLoginButtonProps = {
  className?: string;
};

export default function GoogleLoginButton({ className }: GoogleLoginButtonProps) {
  const buttonClassName = ["border cursor-pointer mx-2", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={() => redirectToGoogleLogin()}
    >
      구글 로그인
    </button>
  );
}
