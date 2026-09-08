import { parseYouTubeQueueSource } from "../add-track/model/parseYouTubeQueueSource";

export type FrequentTrack = {
  videoId: string;
  provider: "YOUTUBE" | "SOUNDCLOUD";
  title: string;
  thumbnailUrl: string | null;
  durationMs: number;
  requestCount: number;
};
export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationMs: number;
};
export type TrackSuggestionPage<T> = {
  items: T[];
  hasNext: boolean;
  nextCursor: string | null;
};

export function classifyTrackInput(value: string) {
  const query = value.trim();
  if (!query) return { kind: "frequent" as const, query };
  if (parseYouTubeQueueSource(query)) return { kind: "url" as const, query };
  if (
    /^(?:[a-z][a-z\d+.-]*:|\/\/|www\.)/i.test(query) ||
    /^[^\s/]+\.[a-z]{2,}(?:[/?#]|$)/i.test(query)
  ) {
    return { kind: "invalid-url" as const, query };
  }
  return {
    kind: query.length > 100 ? ("too-long" as const) : ("search" as const),
    query,
  };
}

export function highlightTitle(title: string, query: string) {
  if (!query) return [{ text: title, match: false }];
  const parts: { text: string; match: boolean }[] = [];
  let start = 0;
  let index = title.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  while (index !== -1) {
    if (index > start)
      parts.push({ text: title.slice(start, index), match: false });
    parts.push({ text: title.slice(index, index + query.length), match: true });
    start = index + query.length;
    index = title.toLocaleLowerCase().indexOf(query.toLocaleLowerCase(), start);
  }
  if (start < title.length)
    parts.push({ text: title.slice(start), match: false });
  return parts;
}
