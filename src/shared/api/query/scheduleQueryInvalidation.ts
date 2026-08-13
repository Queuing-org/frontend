import type { QueryClient, QueryKey } from "@tanstack/react-query";

export const QUERY_INVALIDATION_COALESCE_MS = 75;

type PendingInvalidation = {
  cancelled: boolean;
  completion: Promise<void>;
  queries: Map<
    string,
    { mode: "invalidate" | "reset"; queryKey: QueryKey; revision: number }
  >;
  resolveCompletion: () => void;
  timeoutId: ReturnType<typeof setTimeout> | null;
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
      const current = existing.queries.get(keyId);
      existing.queries.set(keyId, {
        mode: current?.mode === "reset" ? "reset" : "invalidate",
        queryKey,
        revision: (current?.revision ?? 0) + 1,
      });
    });
    resetQueryKeys.forEach((queryKey) => {
      const keyId = getQueryKeyId(queryKey);
      const current = existing.queries.get(keyId);
      existing.queries.set(keyId, {
        mode: "reset",
        queryKey,
        revision: (current?.revision ?? 0) + 1,
      });
    });
    return existing.completion;
  }

  const pendingQueries = new Map<
    string,
    { mode: "invalidate" | "reset"; queryKey: QueryKey; revision: number }
  >(
    queryKeys.map((queryKey) => [
      getQueryKeyId(queryKey),
      { mode: "invalidate" as const, queryKey, revision: 0 },
    ]),
  );
  resetQueryKeys.forEach((queryKey) =>
    pendingQueries.set(getQueryKeyId(queryKey), {
      mode: "reset",
      queryKey,
      revision: 0,
    }),
  );
  let resolveCompletion = () => {};
  const completion = new Promise<void>((resolve) => {
    resolveCompletion = resolve;
  });
  const pending: PendingInvalidation = {
    cancelled: false,
    completion,
    queries: pendingQueries,
    resolveCompletion,
    timeoutId: null,
  };

  const cleanup = () => {
    if (pendingScopes.get(scopeKey) === pending) {
      pendingScopes.delete(scopeKey);
      if (pendingScopes.size === 0) {
        pendingByClient.delete(queryClient);
      }
    }
    pending.resolveCompletion();
  };

  pending.timeoutId = setTimeout(() => {
    void (async () => {
      const processedRevisions = new Map<string, number>();

      while (!pending.cancelled) {
        const nextQueries = [...pending.queries.entries()].filter(
          ([queryId, { revision }]) =>
            processedRevisions.get(queryId) !== revision,
        );

        if (nextQueries.length === 0) {
          break;
        }

        nextQueries.forEach(([queryId, { revision }]) => {
          processedRevisions.set(queryId, revision);
        });
        await Promise.allSettled(
          nextQueries.map(([, { mode, queryKey }]) =>
            refreshQuery(queryClient, queryKey, mode),
          ),
        );
      }

      cleanup();
    })();
  }, QUERY_INVALIDATION_COALESCE_MS);

  pendingScopes.set(scopeKey, pending);

  return completion;
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

  if (pending.timeoutId !== null) {
    clearTimeout(pending.timeoutId);
  }
  pending.cancelled = true;
  pendingScopes.delete(scopeKey);
  if (pendingScopes.size === 0) {
    pendingByClient.delete(queryClient);
  }
  pending.resolveCompletion();
}
