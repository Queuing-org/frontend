export type YouTubeQueueMode = "single" | "playlist";

export type YouTubeQueueSource =
  | {
      kind: "video";
      videoId: string;
    }
  | {
      currentVideoId: string | null;
      kind: "playlist";
      playlistUrl: string;
    };

export type YouTubeQueueRequest = {
  videoId: string;
  youtubePlaylist: boolean;
};

const YOUTUBE_PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function parseUrl(input: string) {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return null;
  }

  try {
    return new URL(trimmedInput);
  } catch {
    try {
      return new URL(`https://${trimmedInput}`);
    } catch {
      return null;
    }
  }
}

function isYouTubeHost(hostname: string) {
  return hostname === "youtube.com" || hostname.endsWith(".youtube.com");
}

function isPlaylistPath(hostname: string, pathname: string) {
  return (
    hostname === "youtu.be" || pathname === "/watch" || pathname === "/playlist"
  );
}

function getCurrentVideoId(parsedUrl: URL, hostname: string) {
  if (isYouTubeHost(hostname) && parsedUrl.pathname === "/watch") {
    return parsedUrl.searchParams.get("v")?.trim() || null;
  }

  if (hostname === "youtu.be") {
    return parsedUrl.pathname.split("/").filter(Boolean)[0]?.trim() || null;
  }

  return null;
}

export function parseYouTubeQueueSource(
  input: string,
): YouTubeQueueSource | null {
  const parsedUrl = parseUrl(input);
  if (!parsedUrl) {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (!isYouTubeHost(hostname) && hostname !== "youtu.be") {
    return null;
  }

  if (parsedUrl.searchParams.has("list")) {
    const playlistId = parsedUrl.searchParams.get("list")?.trim() ?? "";
    if (
      !isPlaylistPath(hostname, parsedUrl.pathname) ||
      !YOUTUBE_PLAYLIST_ID_PATTERN.test(playlistId)
    ) {
      return null;
    }

    return {
      currentVideoId: getCurrentVideoId(parsedUrl, hostname),
      kind: "playlist",
      playlistUrl: parsedUrl.toString(),
    };
  }

  const videoId = getCurrentVideoId(parsedUrl, hostname);
  return videoId ? { kind: "video", videoId } : null;
}

export function createYouTubeQueueRequest(
  source: YouTubeQueueSource | null,
  mode: YouTubeQueueMode | null,
): YouTubeQueueRequest | null {
  if (!source) {
    return null;
  }

  if (source.kind === "video") {
    return {
      videoId: source.videoId,
      youtubePlaylist: false,
    };
  }

  if (mode === "playlist") {
    return {
      videoId: source.playlistUrl,
      youtubePlaylist: true,
    };
  }

  if (mode === "single" && source.currentVideoId) {
    return {
      videoId: source.currentVideoId,
      youtubePlaylist: false,
    };
  }

  return null;
}
