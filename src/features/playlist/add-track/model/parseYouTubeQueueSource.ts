export type YouTubeQueueSource = {
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
      videoId: parsedUrl.toString(),
      youtubePlaylist: true,
    };
  }

  if (isYouTubeHost(hostname) && parsedUrl.pathname === "/watch") {
    const videoId = parsedUrl.searchParams.get("v")?.trim();
    return videoId ? { videoId, youtubePlaylist: false } : null;
  }

  if (hostname === "youtu.be") {
    const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0]?.trim();
    return videoId ? { videoId, youtubePlaylist: false } : null;
  }

  return null;
}
