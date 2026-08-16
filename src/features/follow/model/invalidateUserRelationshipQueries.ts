import type { QueryClient } from "@tanstack/react-query";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { followKeys } from "./queryKeys";

export function invalidateUserRelationshipQueries(
  queryClient: QueryClient,
  targetSlug: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: userKeys.profile(targetSlug) }),
    queryClient.invalidateQueries({ queryKey: userKeys.searchRoot() }),
    queryClient.invalidateQueries({ queryKey: followKeys.followersRoot() }),
    queryClient.invalidateQueries({ queryKey: followKeys.followingsRoot() }),
    queryClient.invalidateQueries({ queryKey: followKeys.blockedRoot() }),
  ]);
}
