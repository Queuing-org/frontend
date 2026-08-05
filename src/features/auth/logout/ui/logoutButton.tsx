"use client";

import { useLogout } from "../model/useLogout";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";

export default function LogoutButton() {
  const { mutate: logout, isPending } = useLogout();

  return (
    <button
      className="border cursor-pointer"
      onClick={() => logout()}
      disabled={isPending}
    >
      {isPending ? (
        <LoadingSpinner ariaLabel="로그아웃 중" size={16} />
      ) : (
        "로그아웃"
      )}
    </button>
  );
}
