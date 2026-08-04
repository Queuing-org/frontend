"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ensureCsrf } from "../shared/api/csrf/ensureCsrf";
import { shouldRetryQuery } from "../shared/api/queryRetry";
import BadgeAwardProvider from "../features/badge/events/ui/BadgeAwardProvider";
import FollowPresenceProvider from "../features/follow/presence/ui/FollowPresenceProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetryQuery,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    ensureCsrf().catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FollowPresenceProvider>
        <BadgeAwardProvider>{children}</BadgeAwardProvider>
      </FollowPresenceProvider>

      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
