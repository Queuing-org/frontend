"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { ApiError } from "@/src/shared/api/api-error";
import { isSafeInternalPath } from "@/src/shared/lib/isSafeInternalPath";

const AUTH_CHECK_MAX_RETRIES = 3;
const AUTH_CHECK_RETRY_DELAY_MS = 400;
const ONBOARDING_REQUIRED_CODES = new Set([
  "user.profile-not-found",
  "user-profile.not-found",
  "user.onboarding-required",
  "user.not-onboarded",
]);

function isUnauthenticatedError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 401 || error.code === "user.not-authenticated")
  );
}

function isOnboardingRequiredError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.code && ONBOARDING_REQUIRED_CODES.has(error.code)) {
    return true;
  }

  return error.status === 403 || error.status === 404;
}

export default function AuthCallbackContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextParam = sp.get("next");
  const next = nextParam && isSafeInternalPath(nextParam) ? nextParam : "/";
  const [authCheckRetries, setAuthCheckRetries] = useState(0);

  const { data: me, isError, error, isSuccess, refetch } = useMe();

  useEffect(() => {
    if (isError) {
      if (isUnauthenticatedError(error)) {
        if (authCheckRetries < AUTH_CHECK_MAX_RETRIES) {
          const retryTimer = window.setTimeout(() => {
            setAuthCheckRetries((currentRetries) => currentRetries + 1);
            void refetch();
          }, AUTH_CHECK_RETRY_DELAY_MS);

          return () => window.clearTimeout(retryTimer);
        }

        router.replace(next);
        return;
      }

      if (isOnboardingRequiredError(error)) {
        router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
        return;
      }

      router.replace(next);
      return;
    }

    if (isSuccess && me) {
      router.replace(next);
    }
  }, [authCheckRetries, error, isError, isSuccess, me, next, refetch, router]);

  return null;
}
