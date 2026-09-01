"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { UserBadge } from "@/src/features/badge/model/types";
import styles from "./BadgeSelect.module.css";

type BadgeSelectProps = {
  disabled: boolean;
  emptyLabel: string;
  invalid: boolean;
  options: UserBadge[];
  value: string;
  onChange: (badgeCode: string) => void;
};

type ListboxPosition = CSSProperties & {
  maxHeight: number;
};

type TooltipPosition = {
  left: number;
  placement: "left" | "right";
  top: number;
};

const VIEWPORT_MARGIN = 12;
const POPUP_GAP = 6;
const TOOLTIP_GAP = 8;
const LISTBOX_MAX_HEIGHT = 240;
const LISTBOX_MIN_HEIGHT = 80;
const TOOLTIP_FALLBACK_WIDTH = 250;
const TOOLTIP_FALLBACK_HEIGHT = 58;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function formatAcquisitionRate(acquisitionRate: number | null) {
  return acquisitionRate === null
    ? "획득률 정보를 확인할 수 없음."
    : `${acquisitionRate.toFixed(2)}% 사용자가 획득함.`;
}

function formatAcquisitionDescription(description: string) {
  const normalizedDescription = description.trim();

  return normalizedDescription
    ? `${normalizedDescription}하여 획득함.`
    : "획득 조건을 확인할 수 없음.";
}

export default function BadgeSelect({
  disabled,
  emptyLabel,
  invalid,
  options,
  value,
  onChange,
}: BadgeSelectProps) {
  const generatedId = useId();
  const triggerId = "settings-badge";
  const listboxId = `${generatedId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [keyboardTooltipIndex, setKeyboardTooltipIndex] = useState<
    number | null
  >(null);
  const [listboxPosition, setListboxPosition] =
    useState<ListboxPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const listboxOptions = useMemo(
    () => [
      { badgeCode: "", name: emptyLabel, badge: null },
      ...options.map((badge) => ({
        badgeCode: badge.badgeCode,
        name: badge.name,
        badge,
      })),
    ],
    [emptyLabel, options],
  );
  const selectedIndex = Math.max(
    0,
    listboxOptions.findIndex((option) => option.badgeCode === value),
  );
  const selectedOption = listboxOptions[selectedIndex];
  const resolvedActiveIndex = clamp(
    activeIndex,
    0,
    listboxOptions.length - 1,
  );
  const isListboxOpen = isOpen && !disabled;
  const tooltipIndex = hoveredIndex ?? keyboardTooltipIndex;
  const tooltipBadge =
    tooltipIndex === null ? null : listboxOptions[tooltipIndex]?.badge;
  const tooltipId = tooltipBadge
    ? `${generatedId}-tooltip-${tooltipBadge.badgeCode}`
    : undefined;

  const closeListbox = useCallback(() => {
    setIsOpen(false);
    setHoveredIndex(null);
    setKeyboardTooltipIndex(null);
    setTooltipPosition(null);
  }, []);

  const updateListboxPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxPopupWidth = Math.max(1, viewportWidth - VIEWPORT_MARGIN * 2);
    const width = Math.min(
      Math.max(rect.width, trigger.offsetWidth, 200),
      maxPopupWidth,
    );
    const left = clamp(
      rect.left,
      VIEWPORT_MARGIN,
      viewportWidth - VIEWPORT_MARGIN - width,
    );
    const availableBelow =
      viewportHeight - rect.bottom - POPUP_GAP - VIEWPORT_MARGIN;
    const availableAbove = rect.top - POPUP_GAP - VIEWPORT_MARGIN;
    const placeAbove =
      availableBelow < LISTBOX_MIN_HEIGHT && availableAbove > availableBelow;
    const availableHeight = placeAbove ? availableAbove : availableBelow;
    const maxHeight = Math.min(
      LISTBOX_MAX_HEIGHT,
      Math.max(LISTBOX_MIN_HEIGHT, availableHeight),
    );

    setListboxPosition({
      left,
      width,
      maxHeight,
      ...(placeAbove
        ? { bottom: viewportHeight - rect.top + POPUP_GAP }
        : { top: rect.bottom + POPUP_GAP }),
    });
  }, []);

  const updateTooltipPosition = useCallback(() => {
    if (tooltipIndex === null) {
      return;
    }

    const option = optionRefs.current[tooltipIndex];
    const tooltip = tooltipRef.current;
    if (!option || !tooltip) {
      return;
    }

    const optionRect = option.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || TOOLTIP_FALLBACK_WIDTH;
    const tooltipHeight = tooltipRect.height || TOOLTIP_FALLBACK_HEIGHT;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const availableRight =
      viewportWidth - VIEWPORT_MARGIN - optionRect.right - TOOLTIP_GAP;
    const availableLeft = optionRect.left - VIEWPORT_MARGIN - TOOLTIP_GAP;
    const placeRight =
      availableRight >= tooltipWidth || availableRight >= availableLeft;
    const placement = placeRight ? "right" : "left";
    const preferredLeft = placeRight
      ? optionRect.right + TOOLTIP_GAP
      : optionRect.left - TOOLTIP_GAP - tooltipWidth;
    const left = clamp(
      preferredLeft,
      VIEWPORT_MARGIN,
      viewportWidth - VIEWPORT_MARGIN - tooltipWidth,
    );
    const top = clamp(
      optionRect.top + optionRect.height / 2 - tooltipHeight / 2,
      VIEWPORT_MARGIN,
      viewportHeight - VIEWPORT_MARGIN - tooltipHeight,
    );

    setTooltipPosition({ left, placement, top });
  }, [tooltipIndex]);

  useEffect(() => {
    if (!isListboxOpen) {
      return;
    }

    updateListboxPosition();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        triggerRef.current?.contains(target) ||
        listboxRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return;
      }

      closeListbox();
    };
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        triggerRef.current?.contains(target) ||
        listboxRef.current?.contains(target)
      ) {
        return;
      }

      closeListbox();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    window.addEventListener("resize", updateListboxPosition);
    window.addEventListener("scroll", updateListboxPosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("resize", updateListboxPosition);
      window.removeEventListener("scroll", updateListboxPosition, true);
    };
  }, [closeListbox, isListboxOpen, updateListboxPosition]);

  useEffect(() => {
    if (tooltipBadge) {
      updateTooltipPosition();
    }
  }, [listboxPosition, tooltipBadge, updateTooltipPosition]);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    const timeoutId = window.setTimeout(closeListbox, 0);
    return () => window.clearTimeout(timeoutId);
  }, [closeListbox, disabled]);

  function openListbox(nextActiveIndex = selectedIndex, fromKeyboard = false) {
    setActiveIndex(nextActiveIndex);
    setHoveredIndex(null);
    setKeyboardTooltipIndex(fromKeyboard ? nextActiveIndex : null);
    setTooltipPosition(null);
    setIsOpen(true);
  }

  function moveActiveOption(nextIndex: number) {
    const clampedIndex = clamp(nextIndex, 0, listboxOptions.length - 1);
    setActiveIndex(clampedIndex);
    setHoveredIndex(null);
    setKeyboardTooltipIndex(clampedIndex);
    setTooltipPosition(null);
    optionRefs.current[clampedIndex]?.scrollIntoView?.({ block: "nearest" });
  }

  function selectOption(index: number) {
    const option = listboxOptions[index];
    if (!option) {
      return;
    }

    closeListbox();
    onChange(option.badgeCode);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (isListboxOpen) {
          moveActiveOption(resolvedActiveIndex + 1);
        } else {
          openListbox(selectedIndex, true);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (isListboxOpen) {
          moveActiveOption(resolvedActiveIndex - 1);
        } else {
          openListbox(selectedIndex, true);
        }
        break;
      case "Home":
        event.preventDefault();
        if (!isListboxOpen) {
          openListbox(0, true);
        } else {
          moveActiveOption(0);
        }
        break;
      case "End":
        event.preventDefault();
        if (!isListboxOpen) {
          openListbox(listboxOptions.length - 1, true);
        } else {
          moveActiveOption(listboxOptions.length - 1);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (isListboxOpen) {
          selectOption(resolvedActiveIndex);
        } else {
          openListbox(selectedIndex, true);
        }
        break;
      case "Escape":
        if (!isListboxOpen) {
          return;
        }
        event.preventDefault();
        closeListbox();
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  }

  const popup = isListboxOpen && typeof document !== "undefined" ? (
    <>
      <ul
        ref={listboxRef}
        id={listboxId}
        className={styles.listbox}
        role="listbox"
        aria-label="칭호"
        style={listboxPosition ?? undefined}
        onScroll={updateTooltipPosition}
      >
        {listboxOptions.map((option, index) => {
          const optionId = `${generatedId}-option-${index}`;
          const isSelected = option.badgeCode === value;
          const isActive = index === resolvedActiveIndex;
          const describedBy =
            tooltipId && tooltipIndex === index ? tooltipId : undefined;

          return (
            <li
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              key={option.badgeCode || "empty"}
              id={optionId}
              className={styles.option}
              role="option"
              aria-describedby={describedBy}
              aria-selected={isSelected}
              data-active={isActive}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => {
                setActiveIndex(index);
                setHoveredIndex(index);
                setKeyboardTooltipIndex(null);
                setTooltipPosition(null);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => selectOption(index)}
            >
              <span className={styles.optionName}>{option.name}</span>
              {isSelected ? (
                <span className={styles.selectedMark} aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {tooltipBadge ? (
        <div
          ref={tooltipRef}
          id={tooltipId}
          className={styles.tooltip}
          role="tooltip"
          data-placement={tooltipPosition?.placement}
          style={
            tooltipPosition
              ? { left: tooltipPosition.left, top: tooltipPosition.top }
              : undefined
          }
        >
          <p>{formatAcquisitionRate(tooltipBadge.acquisitionRate)}</p>
          <p>{formatAcquisitionDescription(tooltipBadge.description)}</p>
        </div>
      ) : null}
    </>
  ) : null;

  return (
    <div className={styles.control}>
      <button
        ref={triggerRef}
        id={triggerId}
        className={styles.trigger}
        type="button"
        role="combobox"
        aria-activedescendant={
          isListboxOpen
            ? `${generatedId}-option-${resolvedActiveIndex}`
            : undefined
        }
        aria-controls={isListboxOpen ? listboxId : undefined}
        aria-describedby={invalid ? "settings-badge-error" : undefined}
        aria-expanded={isListboxOpen}
        aria-haspopup="listbox"
        aria-invalid={invalid}
        disabled={disabled}
        onClick={() => {
          if (isListboxOpen) {
            closeListbox();
          } else {
            openListbox();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.triggerLabel}>{selectedOption.name}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
      {popup ? createPortal(popup, document.body) : null}
    </div>
  );
}
