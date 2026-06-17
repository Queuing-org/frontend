"use client";

import { Suspense, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import {
  ErrorBoundary,
  type FallbackProps,
} from "react-error-boundary";
import styles from "./QueryBoundary.module.css";

type QueryBoundaryProps = {
  children: ReactNode;
  errorDescription?: string;
  errorFallback?: (props: FallbackProps) => ReactNode;
  errorTitle?: string;
  fallback: ReactNode;
  resetKeys?: unknown[];
};

type DefaultErrorFallbackProps = FallbackProps & {
  description?: string;
  title: string;
};

function DefaultErrorFallback({
  description,
  error,
  resetErrorBoundary,
  title,
}: DefaultErrorFallbackProps) {
  const message =
    description ||
    (error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.");

  return (
    <div className={styles.panel} role="alert">
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{message}</p>
      <button
        type="button"
        className={styles.button}
        onClick={resetErrorBoundary}
      >
        다시 시도
      </button>
    </div>
  );
}

export default function QueryBoundary({
  children,
  errorDescription,
  errorFallback,
  errorTitle = "데이터를 불러오지 못했어요.",
  fallback,
  resetKeys,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallbackRender={
            errorFallback ??
            ((props) => (
              <DefaultErrorFallback
                {...props}
                description={errorDescription}
                title={errorTitle}
              />
            ))
          }
          onReset={reset}
          resetKeys={resetKeys}
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
