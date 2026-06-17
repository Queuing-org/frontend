"use client";

import Image from "next/image";
import styles from "./AddTrackAction.module.css";

type AddTrackButtonProps = {
  appearance?: "loading" | "login" | "primary";
  className?: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  variant?: "default" | "queueDock";
};

export default function AddTrackButton({
  appearance = "primary",
  className,
  disabled = false,
  label,
  onClick,
  variant = "default",
}: AddTrackButtonProps) {
  if (variant === "queueDock") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[styles.queueDockButton, className]
          .filter(Boolean)
          .join(" ")}
      >
        <Image
          src="/icons/add.svg"
          alt=""
          width={18}
          height={18}
          draggable={false}
          className={styles.queueDockIcon}
        />
        <span>{label}</span>
      </button>
    );
  }

  const defaultClassName =
    appearance === "primary"
      ? "rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
      : appearance === "login"
        ? "rounded-lg border border-black px-4 py-2 text-sm font-medium text-black"
        : "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[defaultClassName, className].filter(Boolean).join(" ")}
    >
      {label}
    </button>
  );
}
