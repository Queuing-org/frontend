"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SsgoiTransition } from "@ssgoi/react";

export default function PageTransition({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return <SsgoiTransition id={pathname || "/"}>{children}</SsgoiTransition>;
}
