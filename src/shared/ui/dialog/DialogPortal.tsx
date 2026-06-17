"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type DialogPortalProps = {
  children: ReactNode;
  open: boolean;
};

export default function DialogPortal({ children, open }: DialogPortalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
