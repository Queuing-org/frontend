"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { joinRoom } from "@/src/entities/room/api/joinRoom";
import { ApiError } from "@/src/shared/api/api-error";

type JoinStatus = "joining" | "joined" | "error";

export default function RoomPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [status, setStatus] = useState<JoinStatus>("joining");
  const [message, setMessage] = useState("joining...");

  useEffect(() => {
    if (!slug) return;

    let isActive = true;

    (async () => {
      try {
        const result = await joinRoom(slug, { password: null });
        if (!isActive) return;

        setStatus("joined");
        setMessage(
          `joined at ${new Date(result.timestamp).toLocaleTimeString()}`,
        );
      } catch (error) {
        if (!isActive) return;

        const err = error as ApiError;
        setStatus("error");
        setMessage(err.message ?? "join failed");
      }
    })();

    return () => {
      isActive = false;
    };
  }, [slug]);

  return (
    <div>
      <div>room: {slug}</div>
      <div>join: {status}</div>
      <div>message: {message}</div>
    </div>
  );
}
