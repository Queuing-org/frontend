"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./RadialControl.module.css";

type RadialControlSlot = "top" | "left" | "center" | "right" | "bottom";

type RadialControlItem = {
  ariaLabel?: string;
  content?: ReactNode;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
};

type RadialControlProps = {
  ariaLabel: string;
  topItem?: RadialControlItem;
  leftItem?: RadialControlItem;
  centerItem?: RadialControlItem;
  rightItem?: RadialControlItem;
  bottomItem?: RadialControlItem;
};

function getSlotClassName(slot: RadialControlSlot) {
  switch (slot) {
    case "top":
      return `${styles.slot} ${styles.topSlot}`;
    case "left":
      return `${styles.slot} ${styles.leftSlot}`;
    case "center":
      return `${styles.slot} ${styles.centerSlot}`;
    case "right":
      return `${styles.slot} ${styles.rightSlot}`;
    case "bottom":
      return `${styles.slot} ${styles.bottomSlot}`;
  }
}

function getItemClassName(
  slot: RadialControlSlot,
  isInteractive: boolean,
  isDisabled: boolean,
) {
  const classNames = [styles.item];

  if (slot === "left" || slot === "right") {
    classNames.push(styles.sideItem);
  } else if (slot === "center") {
    classNames.push(styles.centerItem);
  } else {
    classNames.push(styles.labelItem);
  }

  if (isInteractive) {
    classNames.push(styles.interactiveItem);
  }

  if (isDisabled) {
    classNames.push(styles.disabledItem);
  }

  return classNames.join(" ");
}

function renderItem(slot: RadialControlSlot, item?: RadialControlItem) {
  if (!item) {
    return null;
  }

  const isInteractive = Boolean(item.href || item.onClick);
  const itemClassName = getItemClassName(
    slot,
    isInteractive && !item.disabled,
    Boolean(item.disabled),
  );

  let content: ReactNode;

  if (item.href && !item.disabled) {
    content = (
      <Link href={item.href} className={itemClassName} aria-label={item.ariaLabel}>
        {item.content}
      </Link>
    );
  } else if (item.onClick || item.disabled) {
    content = (
      <button
        type="button"
        className={itemClassName}
        onClick={item.onClick}
        disabled={item.disabled}
        aria-label={item.ariaLabel}
      >
        {item.content}
      </button>
    );
  } else {
    content = <span className={itemClassName}>{item.content}</span>;
  }

  return <div className={getSlotClassName(slot)}>{content}</div>;
}

export default function RadialControl({
  ariaLabel,
  topItem,
  leftItem,
  centerItem,
  rightItem,
  bottomItem,
}: RadialControlProps) {
  return (
    <div className={styles.control} role="group" aria-label={ariaLabel}>
      {renderItem("top", topItem)}
      {renderItem("left", leftItem)}
      {renderItem("center", centerItem)}
      {renderItem("right", rightItem)}
      {renderItem("bottom", bottomItem)}
    </div>
  );
}
