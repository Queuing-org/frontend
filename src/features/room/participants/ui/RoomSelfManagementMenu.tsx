"use client";

import type { RefObject } from "react";
import ManagementMenuShell from "@/src/shared/ui/management-menu/ManagementMenuShell";

type Props = {
  anchorBoundaryRef: RefObject<HTMLElement | null>;
  label: string;
  menuId: string;
  onClose: () => void;
  onOpenFriends: () => void;
  onOpenSettings: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export default function RoomSelfManagementMenu({
  anchorBoundaryRef,
  label,
  menuId,
  onClose,
  onOpenFriends,
  onOpenSettings,
  triggerRef,
}: Props) {
  const runAndClose = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <ManagementMenuShell
      anchorBoundaryRef={anchorBoundaryRef}
      label={label}
      menuId={menuId}
      onClose={onClose}
      positioning="viewport"
      triggerRef={triggerRef}
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => runAndClose(onOpenSettings)}
      >
        Setting
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => runAndClose(onOpenFriends)}
      >
        Friends
      </button>
    </ManagementMenuShell>
  );
}
