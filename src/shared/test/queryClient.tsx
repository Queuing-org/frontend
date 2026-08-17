import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

export function createTestQueryClient(config: QueryClientConfig = {}) {
  const { defaultOptions, ...restConfig } = config;

  return new QueryClient({
    ...restConfig,
    defaultOptions: {
      ...defaultOptions,
      mutations: {
        retry: false,
        ...defaultOptions?.mutations,
      },
      queries: {
        retry: false,
        ...defaultOptions?.queries,
      },
    },
  });
}

export function createTestQueryClientWrapper(queryClient: QueryClient) {
  return function TestQueryClientWrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}
