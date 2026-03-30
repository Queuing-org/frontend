"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { ApiError } from "@/src/shared/api/api-error";
import { isSafeInternalPath } from "@/src/shared/lib/isSafeInternalPath";

export default function AuthCallbackContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextParam = sp.get("next");
  const next = nextParam && isSafeInternalPath(nextParam) ? nextParam : "/";

  const { data: me, isError, error, isSuccess } = useMe();

  useEffect(() => {
    if (isError) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
        return;
      }

      router.replace("/error");
      return;
    }

    if (isSuccess && me) {
      router.replace(next);
    }
  }, [isError, error, isSuccess, me, next, router]);

  return null;
}
