"use client";

import { useEffect, useId } from "react";

type UseDialogA11yParams = {
  onClose: () => void;
  open: boolean;
};

export function useDialogA11y({ onClose, open }: UseDialogA11yParams) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return { titleId };
}
