"use client";

import { checkNickname } from "@/src/entities/user/api/checkNickName";

export default function CheckNicknameButton({
  nickname,
  onResult,
}: {
  nickname: string;
  onResult: (result: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="border cursor-pointer p-1"
      onClick={async () => {
        const trimmed = nickname.trim();
        if (!trimmed) return;

        const ok = await checkNickname(trimmed);
        onResult(ok);
      }}
    >
      중복 확인
    </button>
  );
}
