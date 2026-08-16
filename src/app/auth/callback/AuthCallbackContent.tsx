"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { ApiError } from "@/src/shared/api/api-error";
import { isSafeInternalPath } from "@/src/shared/lib/isSafeInternalPath";

const AUTH_CHECK_MAX_RETRIES = 3;
const AUTH_CHECK_RETRY_DELAY_MS = 400;
function isUnauthenticatedError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 401 || error.code === "user.not-authenticated")
  );
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

      router.replace(next);
      return;
    }

    if (isSuccess && me) {
      router.replace(next);
    }
  }, [authCheckRetries, error, isError, isSuccess, me, next, refetch, router]);

  return null;
}
