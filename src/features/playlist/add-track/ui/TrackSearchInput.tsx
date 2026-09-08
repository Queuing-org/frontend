"use client";

import Image from "next/image";
import { History } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ApiError } from "@/src/shared/api/api-error";
import OverflowMarquee from "@/src/shared/ui/overflow-marquee/OverflowMarquee";
import { useTrackSuggestions } from "../../model/useTrackSuggestions";
import { highlightTitle } from "../../model/trackSuggestions";
import styles from "./TrackSearchInput.module.css";
import formStyles from "./AddTrackModal.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  invalid: boolean;
};

export default function TrackSearchInput({
  value,
  onChange,
  disabled,
  invalid,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const compositionRef = useRef(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 0,
  });
  const suggestions = useTrackSuggestions(value, open && !disabled, composing);
  const visible =
    open &&
    !disabled &&
    suggestions.loggedIn &&
    suggestions.input.kind !== "url";
  const items = suggestions.items;

  useLayoutEffect(() => {
    if (!visible) return;
    const update = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
        maxHeight: Math.max(0, window.innerHeight - rect.bottom - 12),
      });
    };
    update();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (inputRef.current) observer?.observe(inputRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !inputRef.current?.contains(event.target) &&
        !listRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape, true);
    };
  }, [visible]);

  useEffect(() => {
    if (active >= 0)
      document
        .getElementById(`${id}-${active}`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [active, id]);

  const select = (index: number) => {
    const item = items[index];
    if (!item || ("provider" in item && item.provider !== "YOUTUBE")) return;
    onChange(
      `https://www.youtube.com/watch?v=${encodeURIComponent(item.videoId)}`,
    );
    setOpen(false);
    setActive(-1);
  };
  const errorMessage =
    suggestions.error instanceof ApiError &&
    suggestions.error.code === "room.youtube-api-quota-exceeded"
      ? "YouTube 검색 한도를 초과했어요. 영상 URL을 직접 입력해 주세요."
      : suggestions.error instanceof ApiError &&
          suggestions.error.status === 429
        ? "요청이 많아요. 잠시 후 다시 시도해 주세요."
        : "음악을 불러오지 못했어요. 영상 URL을 직접 입력할 수 있어요.";
  const status =
    suggestions.input.kind === "invalid-url"
      ? "올바른 유튜브 영상 또는 재생목록 링크를 입력해 주세요."
      : suggestions.input.kind === "too-long"
        ? "검색어는 100자 이하로 입력해 주세요."
        : suggestions.loading
          ? "음악을 찾고 있어요…"
          : suggestions.error
            ? errorMessage
            : items.length === 0
              ? suggestions.input.kind === "frequent"
                ? "자주 신청한 음악이 아직 없어요."
                : "검색 결과가 없어요."
              : null;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="노래 제목 또는 유튜브 링크"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={visible ? id : undefined}
        aria-activedescendant={
          visible && active >= 0 && items[active]
            ? `${id}-${active}`
            : undefined
        }
        aria-invalid={invalid}
        aria-describedby={invalid ? "add-track-error" : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onCompositionStart={() => {
          compositionRef.current = true;
          setComposing(true);
          setActive(-1);
        }}
        onCompositionEnd={() => {
          compositionRef.current = false;
          setComposing(false);
        }}
        onKeyDown={(event) => {
          if (
            compositionRef.current ||
            event.nativeEvent.isComposing ||
            event.keyCode === 229
          )
            return;
          if (event.key === "Tab") {
            setOpen(false);
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            const selectable = items.flatMap((item, index) =>
              "provider" in item && item.provider !== "YOUTUBE" ? [] : [index],
            );
            if (!selectable.length) return;
            const currentIndex = selectable.indexOf(active);
            const next =
              currentIndex < 0
                ? event.key === "ArrowDown"
                  ? 0
                  : selectable.length - 1
                : (currentIndex +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    selectable.length) %
                  selectable.length;
            setActive(selectable[next]);
          } else if (event.key === "Enter" && visible && active >= 0) {
            event.preventDefault();
            select(active);
          }
        }}
        placeholder="노래 제목을 검색하거나 영상·재생목록 URL을 붙여넣으세요"
        className={formStyles.input}
        disabled={disabled}
        autoComplete="off"
        autoFocus
      />
      {visible &&
        createPortal(
          <div
            ref={listRef}
            className={styles.dropdown}
            style={position}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.preventDefault()}
          >
            <div
              id={id}
              role="listbox"
              aria-label={
                suggestions.input.kind === "frequent"
                  ? "자주 신청한 음악"
                  : "YouTube 검색 결과"
              }
              aria-busy={suggestions.loading}
            >
              {!status &&
                items.map((item, index) => {
                  const unsupported =
                    "provider" in item && item.provider !== "YOUTUBE";
                  return (
                    <div
                      key={`${"provider" in item ? item.provider : "YOUTUBE"}:${
                        item.videoId
                      }`}
                      id={`${id}-${index}`}
                      role="option"
                      aria-selected={active === index}
                      aria-disabled={unsupported}
                      className={styles.row}
                      data-marquee-group
                      data-marquee-active={active === index}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => select(index)}
                    >
                      {"provider" in item ? (
                        <History
                          aria-hidden="true"
                          className={styles.history}
                        />
                      ) : (
                        <Image
                          src={item.thumbnailUrl}
                          alt=""
                          width={32}
                          height={32}
                          unoptimized
                          className={styles.thumbnail}
                        />
                      )}
                      <span className={styles.meta}>
                        <OverflowMarquee
                          text={item.title}
                          className={styles.title}
                          contentClassName={styles.titleText}
                          activation="group-hover"
                          focusable={false}
                        >
                          {highlightTitle(
                            item.title,
                            suggestions.input.kind === "search"
                              ? suggestions.input.query
                              : "",
                          ).map((part, partIndex) =>
                            part.match ? (
                              <mark key={partIndex}>{part.text}</mark>
                            ) : (
                              <span key={partIndex}>{part.text}</span>
                            ),
                          )}
                        </OverflowMarquee>
                        {"channelTitle" in item && (
                          <span className={styles.channel}>
                            {item.channelTitle}
                          </span>
                        )}
                        {unsupported && (
                          <span className={styles.channel}>
                            SoundCloud는 아직 지원하지 않아요
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
            </div>
            {status && (
              <div role="status" className={styles.status}>
                {status}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
