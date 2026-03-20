import { useState, type FormEvent } from "react";

type Props = {
  onSubmit: (password: string) => void | Promise<void>;
  message?: string;
  submitting?: boolean;
};

export default function RoomPasswordInput({
  onSubmit,
  message,
  submitting = false,
}: Props) {
  const [password, setPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setValidationMessage("비밀번호를 입력해주세요.");
      return;
    }

    setValidationMessage("");
    await onSubmit(trimmedPassword);
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium">비밀번호를 입력하세요</label>
      <input
        className="w-full border px-3 py-2"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={submitting}
      />
      {message ? <div className="text-sm text-red-600">{message}</div> : null}
      {validationMessage ? (
        <div className="text-sm text-red-600">{validationMessage}</div>
      ) : null}
      <button className="border px-3 py-2" disabled={submitting} type="submit">
        {submitting ? "확인 중..." : "입장하기"}
      </button>
    </form>
  );
}
