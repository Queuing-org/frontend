export const trackSuggestionKeys = {
  all: () => ["trackSuggestions"] as const,
  frequentRoot: () => ["trackSuggestions", "frequent"] as const,
  frequent: (userSlug: string | null) =>
    ["trackSuggestions", "frequent", userSlug] as const,
  search: (userSlug: string | null, query: string) =>
    ["trackSuggestions", "search", userSlug, query] as const,
};
