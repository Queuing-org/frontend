export const userKeys = {
  me: () => ["me"] as const,
  search: (query: string, lastId?: number, limit?: number) =>
    ["searchUsers", query, lastId, limit] as const,
  searchRoot: () => ["searchUsers"] as const,
};
