"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/entities/room/api/joinRoom";
import { ApiError } from "@/src/shared/api/api-error";
import RoomPasswordInput from "@/src/features/room/join/ui/roomPasswordInput";

type JoinStatus = "joining" | "joined" | "error" | "needs-password";

export default function RoomPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const joinRequestRef = useRef<{
    slug: string;
    promise: Promise<JoinRoomResult>;
  } | null>(null);

  const [status, setStatus] = useState<JoinStatus>("joining");
  const [message, setMessage] = useState("joining...");
  const [code, setErrorCode] = useState("joining...");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  async function handlePasswordSubmit(password: string) {
    if (!slug) return;

    setIsSubmittingPassword(true);
    setMessage("비밀번호를 확인하는 중입니다...");

    try {
      const result = await joinRoom(slug, { password });
      setStatus("joined");
      setMessage(
        `joined at ${new Date(result.timestamp).toLocaleTimeString()}`,
      );
      setErrorCode("");
    } catch (error) {
      const err = error as ApiError;
      setMessage(err.message ?? "join failed");
      setErrorCode(err.code ?? "join failed");

      if (err.code === "room.password-required") {
        setStatus("needs-password");
        return;
      }

      setStatus("error");
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  useEffect(() => {
    if (!slug) return;

    let isActive = true;

    if (joinRequestRef.current?.slug !== slug) {
      joinRequestRef.current = {
        slug,
        promise: joinRoom(slug, { password: null }),
      };
    }

    const currentJoinRequest = joinRequestRef.current;
    if (!currentJoinRequest) return;

    (async () => {
      try {
        const result = await currentJoinRequest.promise;
        if (!isActive) return;

        setStatus("joined");
        setMessage(
          `joined at ${new Date(result.timestamp).toLocaleTimeString()}`,
        );
      } catch (error) {
        if (!isActive) return;

        const err = error as ApiError;
        setMessage(err.message ?? "join failed");
        setErrorCode(err.code ?? "join failed");

        if (err.code === "room.password-required") {
          setStatus("needs-password");
          return;
        }

        setStatus("error");
      }
    })();

    return () => {
      isActive = false;
    };
  }, [slug]);

  if (status === "needs-password") {
    return (
      <RoomPasswordInput
        message={message}
        onSubmit={handlePasswordSubmit}
        submitting={isSubmittingPassword}
      />
    );
  }

  return (
    <div>
      <div>room: {slug}</div>
      <div>join: {status}</div>
      <div>message: {message}</div>
      <div>Error Code: {code}</div>
    </div>
  );
}
