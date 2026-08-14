"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { CircleX } from "lucide-react";
import { useAddFriendModalState } from "@/src/features/follow/hooks/useAddFriendModalState";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useInfiniteScrollSentinel } from "@/src/shared/lib/useInfiniteScrollSentinel";
import styles from "./AddFriendModal.module.css";

type AddFriendModalProps = {
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function AddFriendModal({ onClose }: AddFriendModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const modal = useAddFriendModalState();
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = modal;
  const loadNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const sentinelRef = useInfiniteScrollSentinel({
    enabled: Boolean(modal.hasNextPage) && !modal.isFetchingNextPage && !modal.isFetchNextPageError,
    onVisible: loadNextPage,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hidden);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      const activeElement = document.activeElement;
      const focusIsOutside =
        !dialogRef.current.contains(activeElement) ||
        !focusableElements.includes(activeElement as HTMLElement);

      if (event.shiftKey && (activeElement === firstElement || focusIsOutside)) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement || focusIsOutside)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const feedback = modal.errorMessage
    ? { message: modal.errorMessage, tone: "error" as const }
    : modal.isSuccess
      ? { message: "성공적으로 팔로우했어요!", tone: "success" as const }
      : null;

  return (
    <div
      className={styles.overlay}
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      role="presentation"
    >
      <section
        ref={dialogRef}
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-friend-title"
      >
        <header className={styles.header}>
          <h3 id="add-friend-title" className={styles.title}>
            친구 추가
          </h3>
          <p className={styles.description}>
            팔로우하고 싶은 친구의 닉네임을 입력해주세요.
          </p>
        </header>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            modal.submit();
          }}
        >
          <div className={styles.searchArea}>
            <div className={styles.inputWrap} data-tone={feedback?.tone}>
              <input
                className={styles.input}
                value={modal.query}
                onChange={(event) => modal.updateQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.nativeEvent.isComposing ||
                      event.nativeEvent.keyCode === 229)
                  ) {
                    event.preventDefault();
                  }
                }}
                placeholder="닉네임 검색"
                aria-label="친구 닉네임 검색"
                autoComplete="off"
                autoFocus
              />
              {modal.query ? (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={modal.clearQuery}
                  aria-label="검색어 지우기"
                >
                  <CircleX aria-hidden="true" size={20} strokeWidth={2.5} />
                </button>
              ) : null}
            </div>

            {feedback ? (
              <p className={styles.feedback} data-tone={feedback.tone} role="status">
                {feedback.message}
              </p>
            ) : null}

            {modal.isResultsOpen ? (
              <div className={styles.results}>
                {modal.isSearchLoading ? (
                  <div className={styles.resultState}>
                    <LoadingSpinner ariaLabel="친구 검색 중" size={20} />
                  </div>
                ) : null}
                {modal.isSearchError ? (
                  <div className={styles.resultState}>검색에 실패했어요.</div>
                ) : null}
                {!modal.isSearchLoading &&
                !modal.isSearchError &&
                modal.users.length === 0 ? (
                  <div className={styles.resultState}>검색 결과가 없습니다.</div>
                ) : null}
                {modal.users.length > 0 ? (
                  <ul className={styles.resultList}>
                    {modal.users.map((user) => (
                      <li key={user.slug}>
                        <button
                          type="button"
                          className={styles.resultButton}
                          onClick={() => modal.selectUser(user)}
                        >
                          <span className={styles.avatarWrap}>
                            <Image
                              src={user.profileImageUrl || "/Basic_Profile.png"}
                              alt=""
                              fill
                              sizes="40px"
                              unoptimized={Boolean(user.profileImageUrl)}
                              className={styles.avatar}
                            />
                          </span>
                          <span className={styles.nickname}>{user.nickname}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div ref={sentinelRef} aria-hidden="true" />
                {modal.isFetchingNextPage ? (
                  <div className={styles.resultState}>
                    <LoadingSpinner ariaLabel="친구 검색 결과 더 불러오는 중" size={18} />
                  </div>
                ) : null}
                {modal.isFetchNextPageError ? (
                  <button type="button" className={styles.resultButton} onClick={loadNextPage}>
                    다시 시도
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              취소
            </button>
            <button
              type="submit"
              className={styles.followButton}
              disabled={!modal.canSubmit || modal.isSubmitting}
            >
              {modal.isSubmitting ? (
                <LoadingSpinner ariaLabel="팔로우 중" size={18} color="#3f83f8" />
              ) : (
                "팔로우"
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
