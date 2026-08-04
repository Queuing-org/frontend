"use client";

import type { ReactNode } from "react";
import { useFollowPresenceSubscription } from "../hooks/useFollowPresenceSubscription";

export default function FollowPresenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  useFollowPresenceSubscription();

  return children;
}
