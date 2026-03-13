"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  joinRoom,
  type JoinRoomResult,
} from "@/src/entities/room/api/joinRoom";
import { ApiError } from "@/src/shared/api/api-error";

type JoinStatus = "joining" | "joined" | "error";

export default function RoomPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const joinRequestRef = useRef<{
    slug: string;
    promise: Promise<JoinRoomResult>;
  } | null>(null);

  const [status, setStatus] = useState<JoinStatus>("joining");
  const [message, setMessage] = useState("joining...");

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
