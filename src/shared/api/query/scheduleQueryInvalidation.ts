import type { QueryClient, QueryKey } from "@tanstack/react-query";

export const QUERY_INVALIDATION_COALESCE_MS = 75;

type PendingInvalidation = {
  queries: Map<
    string,
    { mode: "invalidate" | "reset"; queryKey: QueryKey }
  >;
  timeoutId: ReturnType<typeof setTimeout>;
};

const pendingByClient = new WeakMap<
  QueryClient,
  Map<string, PendingInvalidation>
>();

function getPendingScopes(queryClient: QueryClient) {
  const current = pendingByClient.get(queryClient);
  if (current) {
    return current;
  }

  const next = new Map<string, PendingInvalidation>();
  pendingByClient.set(queryClient, next);
  return next;
}

function getQueryKeyId(queryKey: QueryKey) {
  return JSON.stringify(queryKey);
}

async function refreshQuery(
  queryClient: QueryClient,
  queryKey: QueryKey,
  mode: "invalidate" | "reset",
) {
  await queryClient.cancelQueries({ queryKey });
  if (mode === "reset") {
    await queryClient.resetQueries({ queryKey });
    return;
  }

  await queryClient.invalidateQueries({ queryKey });
}

export function scheduleQueryInvalidation({
  queryClient,
  queryKeys,
  resetQueryKeys = [],
  scopeKey,
}: {
  queryClient: QueryClient;
  queryKeys: readonly QueryKey[];
  resetQueryKeys?: readonly QueryKey[];
  scopeKey: string;
}) {
  const pendingScopes = getPendingScopes(queryClient);
  const existing = pendingScopes.get(scopeKey);

  if (existing) {
    queryKeys.forEach((queryKey) => {
      const keyId = getQueryKeyId(queryKey);
      if (existing.queries.get(keyId)?.mode !== "reset") {
        existing.queries.set(keyId, { mode: "invalidate", queryKey });
      }
    });
    resetQueryKeys.forEach((queryKey) =>
      existing.queries.set(getQueryKeyId(queryKey), {
        mode: "reset",
        queryKey,
      }),
    );
    return;
  }

  const pendingQueries = new Map<
    string,
    { mode: "invalidate" | "reset"; queryKey: QueryKey }
  >(
    queryKeys.map((queryKey) => [
      getQueryKeyId(queryKey),
      { mode: "invalidate" as const, queryKey },
    ]),
  );
  resetQueryKeys.forEach((queryKey) =>
    pendingQueries.set(getQueryKeyId(queryKey), {
      mode: "reset",
      queryKey,
    }),
  );
  const timeoutId = setTimeout(() => {
    pendingScopes.delete(scopeKey);
    if (pendingScopes.size === 0) {
      pendingByClient.delete(queryClient);
    }

    pendingQueries.forEach(({ mode, queryKey }) => {
      void refreshQuery(queryClient, queryKey, mode);
    });
  }, QUERY_INVALIDATION_COALESCE_MS);

  pendingScopes.set(scopeKey, {
    queries: pendingQueries,
    timeoutId,
  });
}

export function cancelScheduledQueryInvalidation(
  queryClient: QueryClient,
  scopeKey: string,
) {
  const pendingScopes = pendingByClient.get(queryClient);
  const pending = pendingScopes?.get(scopeKey);
  if (!pending || !pendingScopes) {
    return;
  }

  clearTimeout(pending.timeoutId);
  pendingScopes.delete(scopeKey);
  if (pendingScopes.size === 0) {
    pendingByClient.delete(queryClient);
  }
}
