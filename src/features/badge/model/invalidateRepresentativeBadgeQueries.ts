import type { QueryClient } from "@tanstack/react-query";
import { userKeys } from "@/src/features/user/model/queryKeys";
import type { User } from "@/src/features/user/model/types";
import { badgeKeys } from "./queryKeys";

export async function invalidateRepresentativeBadgeQueries(
  queryClient: QueryClient,
) {
  const me = queryClient.getQueryData<User | null>(userKeys.me());

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: badgeKeys.me() }),
    queryClient.invalidateQueries({ queryKey: userKeys.me() }),
    me?.slug
      ? queryClient.invalidateQueries({
          queryKey: badgeKeys.publicUser(me.slug),
        })
      : Promise.resolve(),
    me?.slug
      ? queryClient.invalidateQueries({
          queryKey: userKeys.profile(me.slug),
        })
      : Promise.resolve(),
  ]);
}
